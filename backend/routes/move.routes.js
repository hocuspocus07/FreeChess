import express,{Router} from 'express';
import { getNextMove, getPreviousMove } from '../controllers/Move.controller.js';

const moveRouter = Router();

// Get the next move in a game
moveRouter.get('/:gameId/next/:moveNumber', getNextMove);

// Get the previous move in a game
moveRouter.get('/:gameId/previous/:moveNumber', getPreviousMove);

export default moveRouter;