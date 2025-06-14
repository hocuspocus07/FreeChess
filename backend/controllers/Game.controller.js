import Game from "../models/Game.models.js";
import Move from "../models/Move.models.js";
import User from "../models/User.models.js";
import { spawn } from "child_process";
import { Chess} from 'chess.js'

const STOCKFISH_PATH = './stockfish/stockfish';

export const createGame = async (req, res) => {
    const { player1_id, player2_id, winner_id, status, time_control } = req.body;
    const userId = req.user.id;

    if (userId != player1_id) {
      return res.status(403).json({ error: 'You are not authorized to create this game.' });
    }

    try {
      const validTimeControls = [60, 180, 600];
      const selectedTime = validTimeControls.includes(parseInt(time_control))
        ? parseInt(time_control)
        : 600;
      console.log('About to create game:', player1_id, player2_id, winner_id, status, selectedTime);
      const gameId = await Game.create(
        player1_id,
        player2_id,
        winner_id ?? null,
        status ?? 'ongoing',
        selectedTime
      );
      console.log('Game created, ID:', gameId);
      res.status(201).json({ message: 'Game created successfully', gameId, time_control: selectedTime });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({ error: 'Failed to create game', details: error.message });
    }
};

export const getGameDetails=async (req,res)=>{
    const {gameId}=req.params;
    try{
        const game=await Game.findById(gameId);
        if (!game) {
          return res.status(200).json({ 
            game: null,
            message: 'Game not found'
          });
        }
    
        res.status(200).json({ game });
    }catch(error){
        res.status(500).json({error:'internal server error'});
    }
}

export const addMove = async (req, res) => {
  const { gameId } = req.params;
  const { playerId, moveNumber, move,remainingTime } = req.body;
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
      await Move.create(gameId, playerId, moveNumber, move,remainingTime);

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
    if (!games || games.length === 0) {
      return res.status(200).json({ games: [] }); // Return empty array instead of 404
    } 

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
  const { fen, botRating, gameId, playerId,remainingTime } = req.body;
  
  // Validate input
  if (!gameId || !playerId) {
    return res.status(400).json({ error: "Missing gameId or playerId." });
  }

  const stockfish = spawn(`${STOCKFISH_PATH}`);
  let buffer = '';

  // More granular bot configuration
  const configureBot = (botRating) => {
    if (botRating <= 800) {
      return { skill: 0, depth: 1, movetime: 100, maxMistakes: 5 };
    } else if (botRating <= 1200) {
      return { skill: 4, depth: 3, movetime: 200, maxMistakes: 3 };
    } else if (botRating <= 1600) {
      return { skill: 8, depth: 6, movetime: 300, maxMistakes: 2 };
    } else if (botRating <= 2000) {
      return { skill: 15, depth: 10, movetime: 400, maxMistakes: 1 };
    } else {
      return { skill: 20, depth: 15, movetime: 500, maxMistakes: 0 };
    }
  };

  const { skill, depth, movetime, maxMistakes } = configureBot(botRating);

  // Configure Stockfish
  stockfish.stdin.write('uci\n');
  stockfish.stdin.write('setoption name Skill Level value ' + skill + '\n');
  stockfish.stdin.write('setoption name UCI_LimitStrength value true\n');
  stockfish.stdin.write(`setoption name UCI_Elo value ${botRating}\n`);
  
  // Introduce random mistakes for weaker play
  if (maxMistakes > 0) {
    stockfish.stdin.write('setoption name Skill Level Maximum Error value ' + (maxMistakes * 100) + '\n');
  }
  
  stockfish.stdin.write(`position fen ${fen}\n`);
  
  // Use either depth OR movetime, not both
  if (botRating < 1600) {
    stockfish.stdin.write(`go depth ${depth}\n`);
  } else {
    stockfish.stdin.write(`go movetime ${movetime}\n`);
  }

  stockfish.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (line.startsWith('bestmove')) {
        let bestMove = line.split(' ')[1];
        stockfish.kill();
        
        if (bestMove && bestMove !== '(none)') {
          // Occasionally make a bad move for weaker bots
          if (maxMistakes > 0 && Math.random() < 0.2) {
            // Get all legal moves
            const chess = new Chess(fen);
            const legalMoves = chess.moves({verbose: true});
            
            // Filter out the best move and pick a random one
            const otherMoves = legalMoves.filter(m => m.san !== bestMove);
            if (otherMoves.length > 0) {
              let randomMove = otherMoves[Math.floor(Math.random() * otherMoves.length)].san;
              console.log(`Bot ${botRating} making intentional mistake: ${randomMove} instead of ${bestMove}`);
              bestMove = randomMove;
            }
          }
          
          saveBotMove(gameId, playerId, bestMove,remainingTime)
            .then(() => res.json({ move: bestMove }))
            .catch(error => {
              console.error('Save error:', error);
              res.status(500).json({ error: 'Failed to save move' });
            });
          return;
        }
      }
    }
  });

  stockfish.on('close', () => console.log('Stockfish process closed'));
  stockfish.stderr.on('data', (data) => {
    console.error('Stockfish error:', data.toString());
    res.status(500).json({ error: 'Stockfish error' });
  });
};


export const saveBotGame=async(req,res)=>{
  const { player1_id, player2_id, winner_id, status, moves } = req.body;

  try {
    const gameId = await Game.create(
  player1_id,
  player2_id,
  winner_id,
  status
);
    for (let i = 0; i < moves.length; i++) {
      const moveNumber = i + 1;
      const move = moves[i];
      await Move.create(gameId, player1_id, moveNumber, move); 
    }

    res.status(200).json({ message: 'Match saved successfully', gameId });
  } catch (error) {
    console.error('Error saving match:', error);
    res.status(500).json({ message: 'Failed to save match' });
  }
}

const saveBotMove = async (gameId, playerId, move,remainingTime) => {
  try {
    const game = await Game.findById(gameId);
    console.log(`Attempting to save move: ${move}`);

    const moves = await Move.findByGameId(gameId);
    const moveNumber = moves.length + 1;
    const chess = new Chess();

    for (const m of moves) {
      try {
        chess.move(m.move);
      } catch (e) {
        throw new Error(`Invalid move in history (${m.move}): ${e.message}`);
      }
    }

    let moveResult;
    const trimmedMove = move.trim();

    try {
      moveResult = chess.move(trimmedMove);
    } catch (sanError) {
      if (trimmedMove.length >= 4) {
        try {
          moveResult = chess.move({
            from: trimmedMove.slice(0, 2),
            to: trimmedMove.slice(2, 4),
            promotion: trimmedMove[4]?.toLowerCase()
          });
        } catch (uciError) {
          const legalMoves = chess.moves({verbose: true});
          const matchingMove = legalMoves.find(m => 
            m.to === trimmedMove || 
            m.san.toLowerCase().includes(trimmedMove.toLowerCase())
          );
          
          if (matchingMove) {
            moveResult = chess.move(matchingMove.san);
          } else {
            throw new Error(`No legal move matching "${trimmedMove}". Legal moves: ${chess.moves().join(', ')}`);
          }
        }
      }
    }

    if (!moveResult) {
      throw new Error('Failed to make move');
    }
const timeToUse = remainingTime !== undefined ? remainingTime : 180;
    await Move.create(gameId, playerId, moveNumber, moveResult.san,timeToUse);
    console.log(`Successfully saved move: ${moveResult.san}`);
    return moveResult.san;

  } catch (error) {
    console.error(`Move save failed: ${error.message}`);
    throw new Error(`Could not save move "${move}": ${error.message}`);
  }
};

export const getWaitingGames=async (req,res)=>{
  try {
    const waitingGames = await Game.findWaitingGames();
    res.json(waitingGames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const deleteAbandonedGames=async (req,res)=>{
  try {
    // Clean up abandoned games
    await Game.cleanupAbandonedGames();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const resignGame = async (req, res) => {
  const { gameId } = req.params;
  const userId = req.user.id;

  try {
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (userId !== game.player1_id && userId !== game.player2_id) {
      return res.status(403).json({ error: "You are not a player in this game" });
    }

    let winnerId = null;
    if (userId === game.player1_id) {
      winnerId = game.player2_id;
    } else if (userId === game.player2_id) {
      winnerId = game.player1_id;
    }

    await Game.setWinner(gameId, winnerId);
    await Game.updateStatus(gameId, 'resigned');
    await Game.endGame(gameId);

    res.status(200).json({ message: "Game resigned successfully", winnerId });
  } catch (error) {
    res.status(500).json({ error: "Failed to resign game", details: error.message });
  }
};