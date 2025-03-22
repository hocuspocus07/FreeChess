import Game from "../models/Game.models.js";
import Move from "../models/Move.models.js";
import User from "../models/User.models.js";
import { spawn } from "child_process";
import { Chess} from 'chess.js'

const STOCKFISH_PATH = 'C:/Users/Lenovo/Desktop/coding/FreeChess/backend/stockfish/stockfish.exe';

export const createGame = async (req, res) => {
    const { player1_id, player2_id,winner_id,status } = req.body;
    const userId = req.user.id;
  
    if (userId !== player1_id) {
      return res.status(403).json({ error: 'You are not authorized to create this game.' });
    }
  
    try {
      const gameId = await Game.create(player1_id, player2_id,winner_id,status);
      res.status(201).json({ message: 'Game created successfully', gameId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create game', details: error.message });
    }
  };

export const getGameDetails=async (req,res)=>{
    const {gameId}=req.params;
    try{
        const game=await Game.findById(gameId);
        if (game){
            res.status(200).json({game});
        }else{
            res.status(404).json({error:'game not found'});
        }
    }catch(error){
        res.status(500).json({error:'internal server error'});
    }
}

export const addMove = async (req, res) => {
  const { gameId } = req.params;
  const { playerId, moveNumber, move } = req.body;
  const userId = req.user?.id; 

  console.log(`Attempting to add move: GameID=${gameId}, Player=${playerId}, Move=${move}`);
  console.log(`Authenticated User ID: ${userId}`);

  try {
      if (!gameId || !playerId || !move) {
          return res.status(400).json({ error: "Missing required parameters: gameId, playerId, or move." });
      }

      const game = await Game.findById(gameId);
      if (!game) {
          return res.status(404).json({ error: `Game with ID ${gameId} not found!` });
      }

      console.log(`Game details fetched:`, game);

      if (userId !== game.player1_id && userId !== game.player2_id) {
          return res.status(403).json({ error: "You are not authorized to make this move." });
      }

      const isWhiteMove = moveNumber % 2 === 1;
      const expectedPlayerId = isWhiteMove ? game.player1_id : game.player2_id;

      if (playerId !== expectedPlayerId) {
          return res.status(400).json({ error: "It's not your turn!" });
      }

      const moves = await Move.findByGameId(gameId);
    const chess = new Chess();

    moves.forEach((m) => {
      console.log(`Replaying move: ${m.move}`);
      const moveResult = chess.move(m.move); // Replay each move
      if (!moveResult) {
        console.error(`Invalid move in history: ${m.move}`);
        throw new Error(`Invalid move in history: ${m.move}`);
      }
      console.log("Board state after move:", chess.ascii());
    });
      await Move.create(gameId, playerId, moveNumber, move);

      res.status(201).json({ message: "Move added successfully" });

  } catch (error) {
      console.error(`Error adding move:`, error);
      res.status(500).json({ error: "Failed to add move", details: error.message });
  }
};


export const getMoves=async(req,res)=>{
    const {gameId}=req.params;
    try {
        const moves=await Move.findByGameId(gameId);
        console.log(moves);
        res.status(200).json(moves);
    } catch (error) {
        res.status(500).json({message:'failed to fetch moves',error:error.message})
    }
}

export const getGamesByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const games = await Game.findByUserId(userId);
    console.log('Games fetched:', games); 

    const gamesWithOpponents = await Promise.all(
      games.map(async (game) => {
        const opponentId = game.player1_id === parseInt(userId) ? game.player2_id : game.player1_id;
        const opponentUsername = await User.findUsernameById(opponentId);

        return {
          ...game,
          opponent_id: opponentId,
          opponent_username: opponentUsername || 'Unknown', 
        };
      })
    );

    if (gamesWithOpponents.length > 0) {
      res.status(200).json({ games: gamesWithOpponents });
    } else {
      res.status(404).json({ message: 'No games found for this user' });
    }
  } catch (error) {
    console.error('Error in getGamesByUser:', error); 
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
};

export const endGame = async (req, res) => {
  const { gameId } = req.params;
  const { winnerId, status } = req.body;

  try {
    if (!winnerId) {
      throw new Error("Winner ID is undefined!");
    }

    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found!`);
    }

    const moves = await Move.findByGameId(gameId);
    if (!moves) {
      throw new Error(`No moves found for Game ID ${gameId}`);
    }
    console.log(moves);
    console.log(`Ending game: ${gameId}, Winner: ${winnerId}, Status: ${status}`);
    await Game.setWinner(gameId, winnerId);
    await Game.updateStatus(gameId, status);
    await Game.endGame(gameId);
    res.status(200).json({ message: 'Game ended successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end game', details: error.message });
  }
};

export const botMove = async (req, res) => {
  const { fen, botRating, gameId, playerId } = req.body; 
  console.log("🔹 Bot move requested: GameID:", gameId, "PlayerID:", playerId, "FEN:", fen);

  const getDepthFromRating = (botRating) => {
    if (botRating <= 1000) {
      return 1; 
    } else if (botRating <= 1500) {
      return 5; 
    } else if (botRating <= 2000) {
      return 10; 
    } else {
      return 20; 
    }
  };

  const depth = getDepthFromRating(botRating);

  if (!gameId || !playerId) {
    return res.status(400).json({ error: "Missing gameId or playerId." });
  }

  const stockfish = spawn(`${STOCKFISH_PATH}`);
  let buffer = '';

  // Send Stockfish commands
  stockfish.stdin.write('uci\n');
  stockfish.stdin.write('setoption name UCI_LimitStrength value true\n');
  stockfish.stdin.write(`setoption name UCI_Elo value ${botRating}\n`);
  stockfish.stdin.write(`position fen ${fen}\n`);
  stockfish.stdin.write(`go depth ${depth}\n`);

  stockfish.stdout.on('data', (data) => {
    buffer += data.toString();
    console.log("🔹 Stockfish Output:\n", buffer); 

    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach((line) => {
      if (line.startsWith('bestmove')) {
        const bestMove = line.split(' ')[1]; 
        console.log(" Extracted bestmove:", bestMove);

        if (bestMove && bestMove !== '(none)') {
          stockfish.kill();
          
          saveBotMove(gameId, playerId, bestMove)
            .then(() => res.json({ move: bestMove }))
            .catch((error) => {
              console.error('Failed to save bot move:', error);
              res.status(500).json({ error: 'Failed to save bot move' });
            });
        } else {
          console.error('No valid bestmove received.');
          stockfish.kill();
          res.status(500).json({ error: 'No valid bestmove received.' });
        }
      }
    });
  });

  stockfish.stderr.on('data', (data) => {
    console.error(`Stockfish error: ${data}`);
    res.status(500).json({ error: 'Stockfish error' });
  });
};


export const saveBotGame=async(req,res)=>{
  const { player1_id, player2_id, winner_id, status, moves } = req.body;

  try {
    const newGame = await Game.create(
      player1_id,
      player2_id,
      winner_id,
      status);
    const gameId = newGame.insertId;
    for (let i = 0; i < moves.length; i++) {
      const moveNumber = i + 1;
      const move = moves[i];
      await Move.create(gameId, player1_id, moveNumber, move); 
    }

    res.status(200).json({ message: 'Match saved successfully', game: newGame });
  } catch (error) {
    console.error('Error saving match:', error);
    res.status(500).json({ message: 'Failed to save match' });
  }
}

const saveBotMove = async (gameId, playerId, move) => {
  try {
    console.log(`Saving bot move: GameID=${gameId}, PlayerID=${playerId}, Move=${move}`);

    const moves = await Move.findByGameId(gameId);
    console.log(`Existing moves for game ${gameId}:`, moves);

    const moveNumber = moves.length + 1;
    console.log(`Calculated move number: ${moveNumber}`);

    const chess = new Chess();
    moves.forEach((m) => {
      console.log(`Replaying move: ${m.move}`);
      const moveResult = chess.move(m.move); 
      if (!moveResult) {
        console.error(`Invalid move in history: ${m.move}`);
        throw new Error(`Invalid move in history: ${m.move}`);
      }
      console.log("Board state after move:", chess.ascii());
    });

    console.log("Current board state before bot move:", chess.ascii());
    console.log("FEN before bot move:", chess.fen());

    // Convert UCI move (e.g., "g7g6") to { from, to } object
    const from = move.slice(0, 2); // First two characters (e.g., "g7")
    const to = move.slice(2, 4);   // Next two characters (e.g., "g6")
    const promotion = move.length > 4 ? move[4] : undefined;
    const moveObject = { from, to,promotion };

    console.log("Validating bot move:", moveObject);
    const moveResult = chess.move(moveObject);
    if (!moveResult) {
      console.error("Invalid bot move:", move);
      throw new Error("Invalid bot move.");
    }

    // Save the bot's move
    await Move.create(gameId, playerId, moveNumber, moveResult.san); 
    console.log('Bot move saved successfully:', moveResult.san);
  } catch (error) {
    console.error('Error saving bot move:', error);
    throw error;
  }
};