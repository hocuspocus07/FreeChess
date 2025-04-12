import Analysis from '../models/Analysis.models.js';
import Move from '../models/Move.models.js';
import { Chess } from 'chess.js';
import { spawn } from 'child_process';

// export const analyzeGame = async (req, res) => {
//   const { gameId } = req.params;
//   const analyzedMoveIds = new Set();
//   const STOCKFISH_PATH="C:/Users/Lenovo/Desktop/coding/FreeChess/backend/stockfish/stockfish.exe"

//   try {
//     // Get all moves for the game
//     const moves = await Move.findByGameId(gameId);
//     if (!moves || moves.length === 0) {
//       return res.status(404).json({ error: 'No moves found for the game' });
//     }

//     const chess = new Chess();
//     const results = [];
//     let stockfishProcess = null;

//     try {
//       // Initialize Stockfish process
//       stockfishProcess = spawn(STOCKFISH_PATH);
      
//       // Configure Stockfish
//       stockfishProcess.stdin.write('setoption name Threads value 2\n');
//       stockfishProcess.stdin.write('setoption name Hash value 128\n');
      
//       // Process moves sequentially
//       for (let i = 0; i < moves.length; i++) {
//         const move = moves[i];
//         if (chess.isCheckmate()) {
//           results.push({
//             moveId: move.id,
//             move: move.move,
//             status: 'checkmate',
//             isCheckmate: true
//           });
//           continue; // Skip analysis for checkmate moves
//         }
//         const startTime = Date.now();
        
//         try {
//           if (analyzedMoveIds.has(move.id)) {
//             continue; // Skip already analyzed moves
//           }
//           const fenBefore = chess.fen();
          
//           // Validate and make the move
//           const moveResult = chess.move(move.move, { sloppy: true });
//           if (!moveResult) {
//             throw new Error('Invalid move');
//           }

//           const fenAfter = chess.fen();
          
//           // Analyze with Stockfish with timeout
//           const analysis = await new Promise((resolve, reject) => {
//             let analysisTimeout = setTimeout(() => {
//               reject(new Error('Stockfish timeout'));
//             }, 10000); // 2 seconds per move analysis
            
//             stockfishProcess.stdin.write(`position fen ${fenBefore}\n`);
//             stockfishProcess.stdin.write(`go depth 18 movetime 8000\n`); // 1.5 seconds max
            
//             let bestMove = null;
//             let evaluation = null;
            
//             const onData = (data) => {
//               const str = data.toString();
              
//               if (str.includes('bestmove')) {
//                 bestMove = str.split('bestmove ')[1].split(' ')[0];
//               }
              
//               if (str.includes('cp ')) {
//                 const cpMatch = str.match(/cp (-?\d+)/);
//                 if (cpMatch) evaluation = parseInt(cpMatch[1]) / 100;
//               }
              
//               if (bestMove && evaluation !== null) {
//                 clearTimeout(analysisTimeout);
//                 stockfishProcess.stdout.off('data', onData);
//                 resolve({
//                   bestMove,
//                   evaluation,
//                   // Simplified analysis categories for faster processing
//                   isBestMove: bestMove === move.move.toLowerCase(),
//                   isMistake: false, // You'd implement real logic here
//                   isBlunder: false
//                 });
//               }
//             };
            
//             analyzedMoveIds.add(move.id);
//             stockfishProcess.stdout.on('data', onData);
//           });

//           // Save analysis to database
//           const analysisId = await Analysis.create(
//             move.id,
//             analysis.bestMove,
//             analysis.evaluation,
//             false, // isGreatMove
//             analysis.isBestMove,
//             false, // isExcellent
//             false, // isGood
//             false, // isBook
//             false, // isInaccuracy
//             analysis.isMistake,
//             false, // isMiss
//             analysis.isBlunder
//           );

//           results.push({
//             moveId: move.id,
//             move: move.move,
//             status: 'success',
//             analysisId,
//             bestMove: analysis.bestMove,
//             evaluation: analysis.evaluation,
//             timeTaken: Date.now() - startTime
//           });

//         } catch (err) {
//           console.error(`Error on move ${i+1}/${moves.length} (${move.move}):`, err);
//           results.push({
//             moveId: move.id,
//             move: move.move,
//             status: 'failed',
//             error: err.message
//           });
//         }
        
//         // Small delay between moves if not last move
//         if (i < moves.length - 1) {
//           await new Promise(resolve => setTimeout(resolve, 100));
//         }
//       }

//       res.json({
//         success: true,
//         totalMoves: moves.length,
//         analyzed: results.filter(r => r.status === 'success').length,
//         failed: results.filter(r => r.status === 'failed').length,
//         results
//       });

//     } finally {
//       // Clean up Stockfish process
//       if (stockfishProcess) {
//         stockfishProcess.stdin.write('quit\n');
//         stockfishProcess.kill();
//       }
//     }

//   } catch (error) {
//     console.error('Game analysis failed:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Game analysis failed',
//       message: error.message
//     });
//   }
// };

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