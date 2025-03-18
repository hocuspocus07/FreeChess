import Game from "../models/Game.models.js";
import Move from "../models/Move.models.js";
import User from "../models/User.models.js";

export const createGame = async (req, res) => {
    const { player1_id, player2_id } = req.body;
    const userId = req.user.id;
  
    if (userId !== player1_id && userId !== player2_id) {
      return res.status(403).json({ error: 'You are not authorized to create this game.' });
    }
  
    try {
      const gameId = await Game.create(player1_id, player2_id);
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
    const userId = req.user.id;
  
    if (userId !== playerId) {
      return res.status(403).json({ error: 'You are not authorized to make this move.' });
    }
  
    try {
      const existingMove = await Move.findByGameAndMoveNumber(gameId, moveNumber);
      if (existingMove) {
        return res.status(400).json({ error: 'A move with this move number already exists for this game.' });
      }
  
      const moveId = await Move.create(gameId, playerId, moveNumber, move);
      res.status(201).json({ message: 'Move added successfully', moveId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add move', details: error.message });
    }
  };

export const getMoves=async(req,res)=>{
    const {gameId}=req.params;
    try {
        const moves=await Move.findByGameId(gameId);
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
