import { Chess } from 'chess.js';
import { exec } from 'child_process';

const STOCKFISH_PATH = 'C:/Users/Lenovo/Desktop/coding/FreeChess/backend/stockfish/stockfish.exe';

const analyzeMove = async (fen, move) => {
  const chess = new Chess(fen);
  const moveObj = chess.move(move);
  if (!moveObj) {
    throw new Error(`Invalid move: ${move} for FEN: ${fen}`);
  }

  return new Promise((resolve, reject) => {
    const engine = exec(STOCKFISH_PATH);
    
    let outputBuffer = '';
    const timeout = setTimeout(() => {
      engine.kill();
      reject(new Error('Stockfish timeout'));
    }, 10000); // 10 second timeout

    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`go depth 15\n`);

    engine.stdout.on('data', (data) => {
      outputBuffer += data.toString();
      
      // Check for complete analysis
      if (outputBuffer.includes('bestmove')) {
        clearTimeout(timeout);
        
        const bestMove = outputBuffer.match(/bestmove (\w+)/)?.[1];
        const scoreMatch = outputBuffer.match(/score cp (-?\d+)/);
        const evaluation = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
        
        engine.kill();
        
        if (bestMove && evaluation !== null) {
          resolve({
            bestMove,
            evaluation,
            isMistake: evaluation < -200, // Example threshold
            // Add other analysis flags
          });
        } else {
          reject(new Error('Incomplete analysis'));
        }
      }
    });

    engine.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    engine.on('exit', (code) => {
      console.log(`Stockfish exited with code ${code}`);
    });
  });
};
export default analyzeMove;