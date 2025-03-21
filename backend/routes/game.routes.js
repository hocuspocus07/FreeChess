import express,{Router} from 'express'
import { createGame,getGameDetails,addMove,getMoves,getGamesByUser,endGame,botMove, saveBotGame } from '../controllers/Game.controller.js'
import { verifyJWT } from '../middleware/auth.middleware.js';

const gameRouter=Router();

gameRouter.post('/create', verifyJWT, createGame);

gameRouter.get('/:gameId', getGameDetails);

gameRouter.post('/:gameId/moves', verifyJWT, addMove);

gameRouter.get('/:gameId/moves', getMoves);

gameRouter.get('/user/:userId', getGamesByUser);

gameRouter.post('/:gameId/end', endGame);

gameRouter.post('/bot-move',botMove);

gameRouter.post('/save-bot-match',saveBotGame);

export default gameRouter;