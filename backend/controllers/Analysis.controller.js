import Move from "../models/Move.models.js";
import { Chess } from "chess.js";
import { spawn } from "child_process";
import getStockfishEval from "../helper/stockfishEval.js";

export const analyzeGame = async (req, res) => {
  const { gameId } = req.params;
  const STOCKFISH_PATH =
    "C:/Users/Lenovo/Desktop/coding/FreeChess/backend/stockfish/stockfish.exe";

  try {
    const moves = await Move.findByGameId(gameId);
    if (!moves?.length)
      return res.status(404).json({ error: "No moves found" });

    const chess = new Chess();
    const results = [];
    const analyzedMoveIds = new Set();
    let stockfishProcess = null;
    let stockfishKilled = false;

    const cleanup = () => {
      if (!stockfishKilled && stockfishProcess) {
        try {
          stockfishProcess.stdin.write("quit\n");
          stockfishProcess.kill("SIGTERM");
          stockfishKilled = true;
        } catch (e) {
          console.error("Error killing Stockfish:", e);
        }
      }
    };

    try {
      stockfishProcess = spawn(STOCKFISH_PATH);
      stockfishProcess.stdin.write("setoption name Threads value 4\n");
      stockfishProcess.stdin.write("setoption name Hash value 256\n");

      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        if (analyzedMoveIds.has(move.id)) continue;

        const startTime = Date.now();

        try {
          const fenBefore = chess.fen();
          const evalBefore = await getStockfishEval(
            stockfishProcess,
            fenBefore
          );

          if (!chess.move(move.move, { sloppy: true })) {
            throw new Error("Invalid move");
          }

          const fenAfter = chess.fen();
          const evalAfter = await getStockfishEval(stockfishProcess, fenAfter);
const playerMakingMove = chess.turn();
          // Calculate evalDiff from the perspective of the player making the move
          const evalDiff = (evalAfter - evalBefore) * (playerMakingMove === 'w' ? 1 : -1);

          // Classify move type
          let moveType = "Neutral";
          if (evalDiff >= 2.0 &&evalAfter>1.5) moveType = "Brilliant";
          else if (evalDiff >= 1.0) moveType = "Great Move";
          else if (evalDiff >= 0.8) moveType = "Best Move";
          else if (evalDiff >= 0.4) moveType = "Excellent";
          else if (evalDiff >= 0.2) moveType = "Good";
          else if (evalDiff > -0.2) moveType = "Book";
          else if (evalDiff >= -0.7) moveType = "Inaccuracy";
          else if (evalDiff >= -1.5) moveType = "Mistake";
          else if (evalDiff > -2.0) moveType = "Miss";
          else moveType = "Blunder";

          results.push({
    moveId: move.id,
    move: move.move,
    evalBefore,
    evalAfter,
    evalDiff,
    moveType,
    player: i % 2 === 0 ? 1 : 2,
    status: "success",
    timeTaken: Date.now() - startTime,
  });

          analyzedMoveIds.add(move.id);
        } catch (err) {
          console.error(`Error on move ${i + 1}/${moves.length}:`, err);
          results.push({
            moveId: move.id,
            status: "failed",
            error: err.message,
          });
        }
      }

      res.json({
        success: true,
        analysisResults: results.filter((r) => r.status === "success"),
        analyzed: results.filter((r) => r.status === "success").length,
        totalMoves: moves.length,
      });
    } finally {
      cleanup();
    }
  } catch (error) {
    console.error("Game analysis failed:", error);
    res.status(500).json({
      error: "Game analysis failed",
      message: error.message,
    });
  }
};
