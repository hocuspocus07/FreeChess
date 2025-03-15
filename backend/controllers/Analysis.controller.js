import Analysis from '../models/Analysis.models.js';
import Move from '../models/Move.models.js';
import { Chess } from 'chess.js';
import analyzeMove from '../config/Analysemove.js';

export const analyzeGame = async (req, res) => {
  const { gameId } = req.params;

  try {
    const moves = await Move.findByGameId(gameId);
    if (!moves || moves.length === 0) {
      throw new Error('No moves found for the game');
    }

    const chess = new Chess();
    const analysisResults = [];

    for (const move of moves) {
      try {
        const fen = chess.fen();
        console.log('Analyzing move:', move.move, 'FEN:', fen);
        const analysis = await analyzeMove(fen, move.move);

        const analysisId = await Analysis.create(
          move.id,
          analysis.bestMove,
          analysis.evaluation,
          analysis.isGreatMove,
          analysis.isBestMove,
          analysis.isExcellent,
          analysis.isGood,
          analysis.isBook,
          analysis.isInaccuracy,
          analysis.isMistake,
          analysis.isMiss,
          analysis.isBlunder
        );

        analysisResults.push({ moveId: move.id, analysisId });
        chess.move(move.move);
      } catch (error) {
        console.error('Error analyzing move:', move.move, error);
      }
    }

    res.status(200).json({ message: 'Game analyzed successfully', analysisResults });
  } catch (error) {
    console.error('Failed to analyze game:', error);
    res.status(500).json({ error: 'Failed to analyze game', details: error.message });
  }
};