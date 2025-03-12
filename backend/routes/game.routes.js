import express,{Router} from 'express'
import { createGame,getGameDetails,addMove,getMoves } from '../controllers/Game.controller.js'
import { verifyJWT } from '../middleware/auth.middleware.js';

const gameRouter=Router();

gameRouter.post('/create', verifyJWT, createGame);

gameRouter.get('/:gameId', getGameDetails);

gameRouter.post('/:gameId/moves', verifyJWT, addMove);

gameRouter.get('/:gameId/moves', getMoves);

export default gameRouter;