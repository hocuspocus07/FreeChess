import { Chess } from 'chess.js';
import { exec } from 'child_process';

const STOCKFISH_PATH = 'C:/Users/Lenovo/Desktop/coding/FreeChess/backend/stockfish/stockfish.exe';

const analyzeMove = async (fen, move) => {
  const chess = new Chess(fen);
  chess.move(move);

  return new Promise((resolve, reject) => {
    const engine = exec(STOCKFISH_PATH, (error) => {
      if (error) {
        console.error('Failed to start Stockfish:', error);
        reject(`Failed to start Stockfish: ${error.message}`);
      }
    });

    console.log('Stockfish process started');

    let bestMove = null;
    let evaluation = null;

    engine.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Stockfish output:', output); 

      if (output.startsWith('bestmove')) {
        bestMove = output.split(' ')[1];
      }

      if (output.includes('score cp')) {
        const scoreMatch = output.match(/score cp (-?\d+)/);
        if (scoreMatch) {
          evaluation = parseInt(scoreMatch[1], 10);
        }
      }

      if (bestMove && evaluation !== null) {
        console.log('Analysis complete:', { bestMove, evaluation });
        resolve({
          bestMove,
          evaluation,
          isMistake: isMistake(evaluation),
        });
        engine.kill();
      }
    });

    engine.stdin.write(`position fen ${chess.fen()}\n`);
    engine.stdin.write('go depth 15\n');
  });
};
export default analyzeMove;