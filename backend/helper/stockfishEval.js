async function getStockfishEval(stockfishProcess, fen) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Stockfish timeout')), 10000);

    stockfishProcess.stdin.write(`position fen ${fen}\n`);
    stockfishProcess.stdin.write('go depth 20\n');

    const onData = (data) => {
      output += data.toString();
      if (output.includes('bestmove')) {
        clearTimeout(timeout);
        stockfishProcess.stdout.off('data', onData);
        const scoreMatch = output.match(/score cp (-?\d+)/);
        const evaluation = scoreMatch ? parseInt(scoreMatch[1], 10) / 100 : 0;
        resolve(evaluation);
      }
    };
    stockfishProcess.stdout.on('data', onData);
  });
}

export default getStockfishEval;