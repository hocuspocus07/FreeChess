import express,{Router} from 'express'
import { createGame,getGameDetails,addMove,getMoves, resignGame,getGamesByUser,endGame,botMove, saveBotGame, getWaitingGames, deleteAbandonedGames } from '../controllers/Game.controller.js'
import { verifyJWT } from '../middleware/auth.middleware.js';

const gameRouter=Router();

gameRouter.post('/create', verifyJWT, createGame);

gameRouter.get('/:gameId', getGameDetails);

gameRouter.post('/:gameId/moves', verifyJWT, addMove);

gameRouter.get('/:gameId/moves', getMoves);

gameRouter.get('/user/:userId', getGamesByUser);

gameRouter.post('/:gameId/end', endGame);

gameRouter.post('/:gameId/resign', verifyJWT, resignGame);

gameRouter.post('/bot-move',botMove);

gameRouter.post('/save-bot-match',saveBotGame);

gameRouter.get('/game/waiting',getWaitingGames);

gameRouter.post('/game/cleanup',deleteAbandonedGames);
export default gameRouter;