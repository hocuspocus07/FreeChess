import Move from '../models/Move.models.js';
import { Chess } from 'chess.js';
import { spawn } from 'child_process';

export const analyzeGame = async (req, res) => {
  const { gameId } = req.params;
  const STOCKFISH_PATH = "C:/Users/Lenovo/Desktop/coding/FreeChess/backend/stockfish/stockfish.exe";

  try {
    const moves = await Move.findByGameId(gameId);
    if (!moves?.length) return res.status(404).json({ error: 'No moves found' });

    const chess = new Chess();
    const results = [];
    const analyzedMoveIds = new Set();
    let stockfishProcess = null;
    let stockfishKilled = false;

    const cleanup = () => {
      if (!stockfishKilled && stockfishProcess) {
        try {
          stockfishProcess.stdin.write('quit\n');
          stockfishProcess.kill('SIGTERM');
          stockfishKilled = true;
        } catch (e) {
          console.error('Error killing Stockfish:', e);
        }
      }
    };

    try {
      stockfishProcess = spawn(STOCKFISH_PATH);
      stockfishProcess.stdin.write('setoption name Threads value 4\n');
      stockfishProcess.stdin.write('setoption name Hash value 256\n');

      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        if (analyzedMoveIds.has(move.id)) continue;

        const startTime = Date.now();
        
        try {
          const fenBefore = chess.fen();
          if (!chess.move(move.move, { sloppy: true })) {
            throw new Error('Invalid move');
          }

          if (chess.isCheckmate()) {
            results.push({
              moveId: move.id,
              status: 'checkmate',
              isCheckmate: true
            });
            continue;
          }

          const analysis = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              cleanup();
              reject(new Error('Stockfish timeout'));
            }, 10000);

            stockfishProcess.stdin.write(`position fen ${fenBefore}\n`);
            stockfishProcess.stdin.write(`go depth 18 movetime 8000\n`);

            let output = '';
            const onData = (data) => {
              output += data.toString();
              if (output.includes('bestmove')) {
                clearTimeout(timeout);
                stockfishProcess.stdout.off('data', onData);
                
                const bestMove = output.match(/bestmove (\w+)/)?.[1];
                const scoreMatch = output.match(/score cp (-?\d+)/);
                const evaluation = scoreMatch ? parseInt(scoreMatch[1]) / 100 : null;

                if (bestMove && evaluation !== null) {
                  let moveCategory = {
                    isBestMove: bestMove === move.move.toLowerCase(),
                    isGreatMove: evaluation >= 1.5,
                    isExcellent: evaluation >= 1.0 && evaluation < 1.5,
                    isGood: evaluation >= 0.5 && evaluation < 1.0,
                    isBook: evaluation === 0,  // Assuming book moves have 0 evaluation change
                    isInaccuracy: evaluation <= -0.5 && evaluation > -1.0,
                    isMistake: evaluation <= -1.0 && evaluation > -2.0,
                    isMiss: evaluation <= -2.0 && evaluation > -3.0,
                    isBlunder: evaluation <= -3.0
                  };
                  
                  // Ensure at least one category is assigned
                  const moveType = Object.keys(moveCategory).find(key => moveCategory[key]) || "neutral"; 
                  

                  resolve({
                    bestMove,
                    evaluation,
                    ...moveCategory
                  });
                } else {
                  reject(new Error('Incomplete analysis'));
                }
              }
            };

            stockfishProcess.stdout.on('data', onData);
          });


          results.push({
            moveId: move.id,
            status: 'success',
            timeTaken: Date.now() - startTime,
            ...analysis,
          });

          analyzedMoveIds.add(move.id);

        } catch (err) {
          console.error(`Error on move ${i+1}/${moves.length}:`, err);
          results.push({
            moveId: move.id,
            status: 'failed',
            error: err.message
          });
        }
      }

      // In your Analysis.controller.js
      res.json({
        success: true,
        analysisResults: results.filter(r => r.status === 'success').map(result => ({
          moveId: result.moveId,
          bestMove: result.bestMove,
          evaluation: result.evaluation,
          isGreatMove: result.isGreatMove,
          isBestMove: result.isBestMove,
          isExcellent: result.isExcellent,
          isGood: result.isGood,
          isBook: result.isBook,
          isInaccuracy: result.isInaccuracy,
          isMistake: result.isMistake,
          isMiss: result.isMiss,
          isBlunder: result.isBlunder,
          moveType: result.moveType || 'neutral',
        })),
        analyzed: results.filter(r => r.status === 'success').length,
        totalMoves: moves.length
      });
      

    } finally {
      cleanup();
    }

  } catch (error) {
    console.error('Game analysis failed:', error);
    res.status(500).json({
      error: 'Game analysis failed',
      message: error.message
    });
  }
};