import Move from "../models/Move.models.js";

export const getNextMove=async(req,res)=>{
    const {gameId,moveNumber}=req.body;
    try {
        const nextMove=await Move.findNextMove(gameId,moveNumber);
        if(nextMove){
            res.status(200).json({nextMove});
        }else{
            res.status(404).json({error:'no more moves'});
        }
    } catch (error) {
        res.status(500).json({error:'failed to fetch next move'});
    }
}

export const getPreviousMove= async(req,res)=>{
    const {gameId,moveNumber}=req.body;
    try {
        const prevMove=await Move.findPreviousMove(gameId,moveNumber);
        if(prevMove){
            res.status(200).json({prevMove});
        }else{
            res.status(404).json({error:'no more moves'});
        }
    } catch (error) {
        res.status(500).json({error:'failed to fetch previous move'});
    }
}