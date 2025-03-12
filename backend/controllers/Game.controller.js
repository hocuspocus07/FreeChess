import Game from "../models/Game.models.js";
import Move from "../models/Move.models.js";

export const createGame=async(req,res)=>{
    const {player1_id,player2_id}=req.body;
    try{
        const gameId=await Game.create(player1_id,player2_id);
        res.status(201).json({message:'game created:',gameId});
    }catch(error){
        res.status(500).json({error:'failed to create game',error:error.message});
    }
}

export const getGameDetails=async (req,res)=>{
    const {gameId}=req.body;
    try{
        const game=await Game.findById(gameId);
        if (game){
            res.status(200).json({game});
        }else{
            res.status(404).json({error:'game not found'});
        }
    }catch(error){
        res.status(500).json({error:'game not found'});
    }
}

export const addMove=async(req,res)=>{
    const {gameId,playerId,moveNumber,move}=req.body;
    try{
        const moveId=await Move.create(gameId,playerId,moveNumber,move);
        res.status(200).json({message:'move added successfully',moveId});
    }catch(error){
        res.status(500).json({error:'failed to add move'});
    }
}

export const getMoves=async(req,res)=>{
    const {gameId}=req.params;
    try {
        const moves=await Move.findByGameId(gameId);
        res.status(200).json(moves);
    } catch (error) {
        res.status(500).json({message:'failed to fetch moves',error:error.message})
    }
}