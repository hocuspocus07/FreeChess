import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import gameRouter from "./routes/game.routes.js";
import userRouter from "./routes/user.routes.js";
import moveRouter from "./routes/move.routes.js";
import analyzeRouter from "./routes/analyze.routes.js";
import { Server } from "socket.io";
import Game from "./models/Game.models.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Chess } from "chess.js";
import { deleteAbandonedGames } from "./controllers/Game.controller.js";
import messageRouter from "./routes/message.routes.js";

dotenv.config();

const app = express();
const corsOptions = {
  origin: ["http://localhost:5173","https://freechessfc.netlify.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173","https://freechessfc.netlify.app"],
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is alive" });
});

// Track active games and waiting players
const activeGames = new Map();
const waitingPlayers = new Map();

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Middleware to verify and attach user data
  socket.use((packet, next) => {
    if (["joinMatchmaking", "joinGame", "makeMove"].includes(packet[0])) {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }
      try {
        // Verify token and attach user data
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    } else {
      next();
    }
  });

  // Error handler
  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
    socket.emit("error", { message: err.message });
  });

  // Matchmaking system
  socket.on("joinMatchmaking", async () => {
    if (!socket.user)
      return socket.emit("error", { message: "Authentication required" });

    const userId = socket.user._id.toString();
    console.log(`User ${userId} joined matchmaking`);

    if (waitingPlayers.has(userId)) {
      const oldSocket = waitingPlayers.get(userId);
      if (oldSocket.id !== socket.id) {
        oldSocket.emit("removedFromMatchmaking");
        waitingPlayers.delete(userId);
      } else {
        return socket.emit("error", { message: "Already in matchmaking" });
      }
    }

    // Try to find a match
    for (const [waitingUserId, waitingSocket] of waitingPlayers) {
      if (waitingUserId !== userId) {
        try {
          const gameId = await Game.create(
            waitingUserId,
            userId,
            null,
            "active"
          );
          const initialFen =
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

          // Create game room and add both players
          waitingSocket.join(gameId);
          socket.join(gameId);

          activeGames.set(gameId, {
            chess: new Chess(initialFen),
            player1: waitingUserId,
            player2: userId,
            currentTurn: waitingUserId,
          });

          // Notify both players with complete game data
          io.to(waitingSocket.id).emit("gameReady", {
            gameId,
            isWhite: true,
            opponentId: userId,
            initialFen,
          });

          io.to(socket.id).emit("gameReady", {
            gameId,
            isWhite: false,
            opponentId: waitingUserId,
            initialFen,
          });

          waitingPlayers.delete(waitingUserId);
          return;
        } catch (error) {
          console.error("Game creation error:", error);
          socket.emit("error", { message: "Failed to start game" });
        }
      }
    }

    // No match found - wait
    waitingPlayers.set(userId, socket);
    socket.emit("waitingForOpponent");
  });

  socket.on("resignGame", async ({ gameId, resignerId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    let winnerId = null;
    if (game.player1 === resignerId) {
      winnerId = game.player2;
    } else if (game.player2 === resignerId) {
      winnerId = game.player1;
    }

    // Save to database
    await Game.setWinner(gameId, winnerId);
    await Game.endGame(gameId);
    await Game.updateStatus(gameId, "completed");

    io.to(gameId).emit("gameOver", { winnerId });
    socket.to(gameId).emit("opponentResigned");

    activeGames.delete(gameId);
  });

  socket.on(
    "makeMove",
    async ({ gameId, move, fen, currentTurn, moveHistory, timeRemaining }) => {
      const game = activeGames.get(gameId);
      if (!game) return;

      try {
        const moveObj = game.chess.move(move);
        if (!moveObj)
          return socket.emit("invalidMove", { message: "Invalid move" });

        game.currentTurn = game.chess.turn() === "w" ? "w" : "b";
        const timeControl = await Game.getTimeControl(gameId);
        const remainingTime = timeControl;

        await Game.saveMove(
          gameId,
          socket.user._id,
          game.chess.history().length,
          moveObj.san,
          move.color === "w" ? timeRemaining.white : timeRemaining.black
        );
        io.to(gameId).emit("moveMade", {
          move: moveObj.san,
          fen: game.chess.fen(),
          currentTurn: game.currentTurn,
          moveHistory: game.chess.history(),
        });

        if (game.chess.isGameOver()) {
          let winnerId = null;
          let winType = "draw";
          if (game.chess.isCheckmate()) {
            winType = "checkmate";
            winnerId = game.chess.turn() === "w" ? game.player2 : game.player1;
          }
          await Game.setWinner(gameId, winnerId);
          await Game.endGame(gameId);
          await Game.updateStatus(
            gameId,
            winType === "draw" ? "draw" : "completed"
          );
          io.to(gameId).emit("gameOver", { winnerId });
          activeGames.delete(gameId);
        }
      } catch (error) {
        socket.emit("error", { message: "Move processing failed" });
      }
    }
  );

  // Handle game restoration on reconnection
  socket.on("restoreGame", async ({ gameId }) => {
    try {
      const gameState = await Game.getGameState(gameId);
      const game = activeGames.get(gameId) || {
        chess: new Chess(),
        player1: null,
        player2: null,
        currentTurn: "white",
      };

      // Reconstruct game from moves
      gameState.moves.forEach((move) => {
        game.chess.move(move.move);
      });

      activeGames.set(gameId, game);
      socket.emit("gameRestored", gameState);
    } catch (error) {
      socket.emit("error", { message: "Failed to restore game" });
    }
  });

  // In your server code where you handle gameOver events
  // In your server's gameOver handler:
  socket.on("gameOver", async ({ gameId, winnerId }) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    // Verify the winner based on game state
    const chess = game.chess;
    let verifiedWinnerId = winnerId;
    const status = verifiedWinnerId === "draw" ? "draw" : "completed";

    if (chess.isCheckmate()) {
      const winnerColor = chess.turn() === "w" ? "black" : "white";
      verifiedWinnerId = winnerColor === "white" ? game.player1 : game.player2;
    } else if (chess.isDraw()) {
      verifiedWinnerId = null;
    }

    // Save to database
    await Game.setWinner(gameId, verifiedWinnerId);
    await Game.endGame(gameId);
    await Game.updateStatus(gameId, status);

    // Broadcast to all players
    io.to(gameId).emit("gameOver", { winnerId: verifiedWinnerId });
    activeGames.delete(gameId);
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      if (waitingPlayers.get(userId)?.id === socket.id) {
        waitingPlayers.delete(userId);
      }
    }
  });

  socket.on("leaveMatchmaking", () => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      if (waitingPlayers.get(userId)?.id === socket.id) {
        waitingPlayers.delete(userId);
        socket.emit("leftMatchmaking");
      }
    }
  });
});

//delete abandoned games
setInterval(async () => {
  try {
    await deleteAbandonedGames(
      {},
      { json: () => {}, status: () => ({ json: () => {} }) }
    );
    console.log("Abandoned games cleanup ran.");
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}, 600000);

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/chess/game", gameRouter);
app.use("/chess/users", userRouter);
app.use("/chess/moves", moveRouter);
app.use("/chess/analyze", analyzeRouter);
app.use("/chess/messages",messageRouter);

export { app, server };
