import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { analyzeGame } from "../controllers/Analysis.controller.js";

const analyzeRouter=Router();

analyzeRouter.get('/:gameId',verifyJWT,analyzeGame);

export default analyzeRouter;