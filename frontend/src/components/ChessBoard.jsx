import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import React, { useRef, useState, useEffect } from 'react';
import { BackwardIcon, ClockIcon, ForwardIcon } from '@heroicons/react/24/outline';

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [moveLog, setMoveLog] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [activePlayer, setActivePlayer] = useState('white');
  const timerRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!gameOver) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [activePlayer, gameOver]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (activePlayer === 'white') {
        setWhiteTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      } else {
        setBlackTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }
    }, 1000);
  };

  const checkGameOver = (gameCopy) => {
    if (gameCopy.isGameOver()) {
      setGameOver(true);
      clearInterval(timerRef.current);
      if (gameCopy.isCheckmate()) {
        alert(`Checkmate! ${activePlayer === 'white' ? 'Black' : 'White'} wins!`);
      } else if (gameCopy.isStalemate()) {
        alert('Stalemate! The game is a draw.');
      } else if (gameCopy.isDraw()) {
        alert('The game is a draw.');
      }
    }
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (currentMoveIndex !== moveLog.length - 1) return false;

    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) return false;

    const newMoveLog = [...moveLog, move.san];
    setMoveLog(newMoveLog);
    setCurrentMoveIndex(newMoveLog.length - 1);

    setGame(gameCopy);
    checkGameOver(gameCopy);
    if (!gameOver) {
      setActivePlayer((prevPlayer) => (prevPlayer === 'white' ? 'black' : 'white'));
    }
    return true;
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex >= 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      const gameCopy = new Chess();
      moveLog.slice(0, currentMoveIndex).forEach((move) => gameCopy.move(move));
      setGame(gameCopy);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < moveLog.length - 1) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      const gameCopy = new Chess();
      moveLog.slice(0, currentMoveIndex + 2).forEach((move) => gameCopy.move(move));
      setGame(gameCopy);
    }
  };

  const formatMoveLog = () => {
    const formattedMoves = [];
    for (let i = 0; i < moveLog.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveLog[i];
      const blackMove = moveLog[i + 1] || '';
      formattedMoves.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    }
    return formattedMoves;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const checkOutMove = (index) => {
    const gameCopy = new Chess();
    moveLog.slice(0, index + 1).forEach((move) => gameCopy.move(move));
    setGame(gameCopy);
    setCurrentMoveIndex(index);
  };
  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-[#2c2c2c] p-4">
      <div className="flex flex-col h-full justify-center items-center lg:flex-row w-full gap-6">
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col mt-10 lg:mt-0">
          <div className="bg-gray-900 rounded-lg mb-3 relative flex items-center text-white">
            <img
              src="user.png"
              alt="Player 1"
              className="w-12 h-12 bg-white mr-3"
            />
            <h2 className="text-xl font-bold">Player 1</h2>
            <p className="text-gray-400 text-xs ml-1">(1500)</p>
            <div className='right-0 absolute h-8 w-20 flex justify-center items-center bg-gray-200 text-black rounded-md'>
              <ClockIcon className='h-5 w-5' />
              <span className='ml-2'>{formatTime(blackTime)}</span>
            </div>
          </div>

          {/* moves logger for mobile phones */}
          <div className='h-6 w-screen flex bg-gray-800 text-white overflow-x-scroll md:hidden'>
            {formatMoveLog().map((movePair, pairIndex) => {
              const moves = movePair.split(" ");
              return (
                <React.Fragment key={pairIndex}>
                  <div
                    className="bg-[#2a2a2a] rounded mx-1 px-1 cursor-default"
                  >
                    <span className="text-gray-500">{moves[0]}</span>
                  </div>
                  {moves.slice(1).map((move, moveOffset) => {
                    const moveIndex = pairIndex * 2 + moveOffset;
                    return (
                      <div
                        key={`${pairIndex}-${moveOffset}`}
                        onClick={() => checkOutMove(moveIndex)}
                        className={`bg-[#3a3a3a] rounded mx-1 px-1 cursor-pointer ${currentMoveIndex === moveIndex ? "border-2 border-yellow-400" : ""
                          }`}
                      >
                        <span className="text-white font-bold">{move}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
          <div className="sm:h-96 sm:w-96 lg:w-96 lg:h-96 md:w-96 md:h-96 h-auto w-screen">
            <Chessboard
              position={game.fen()}
              onPieceDrop={currentMoveIndex === moveLog.length - 1 ? onDrop : undefined}
              arePiecesDraggable={currentMoveIndex === moveLog.length - 1}
            />
          </div>

          <div className="bg-gray-900 rounded-lg mt-3 flex relative items-center text-white">
            <img
              src="user.png"
              alt="Player 2"
              className="w-12 h-12 bg-white mr-3"
            />
            <h2 className="text-xl font-bold">Player 2</h2>
            <p className="text-gray-400 text-xs ml-1">(1600)</p>
            <div className='right-0 absolute h-8 w-20 flex justify-center items-center bg-gray-200 text-black rounded-md'>
              <ClockIcon className='h-5 w-5' />
              <span className='ml-2'>{formatTime(whiteTime)}</span>
            </div>
          </div>
        </div>
        <div className='flex flex-col w-1/4 h-full'>
          <div className="bg-gray-900 rounded-lg p-6 sm:flex flex-col text-white h-full">
            <h3 className="text-lg font-bold mb-4">Move Log</h3>
            <div className="overflow-y-auto h-96 p-2 rounded scrollbar-custom">
              {formatMoveLog().map((movePair, pairIndex) => {
                const moves = movePair.split(" ");
                return (
                  <React.Fragment key={pairIndex}>
                    <div className='flex items-center justify-center m-2 bg-gray-400 p-1 rounded-xl'>
                      <div className="bg-[#2a2a2a] rounded mx-1 px-1 cursor-default">
                        <p className="text-gray-400">{moves[0]}</p>
                      </div>
                      {moves.slice(1).map((move, moveOffset) => {
                        const moveIndex = pairIndex * 2 + moveOffset;
                        return (
                          <div
                            key={`${pairIndex}-${moveOffset}`}
                            onClick={() => checkOutMove(moveIndex)} 
                            className={`bg-[#3a3a3a] rounded mx-1 px-1 cursor-pointer ${currentMoveIndex === moveIndex ? "border-2 border-yellow-400" : ""
                              }`}
                          >
                            <span className="text-white">{move}</span>
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={goToPreviousMove}
              disabled={currentMoveIndex < 0}
              className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <BackwardIcon className='h-6 w-6' />
            </button>
            <button
              onClick={goToNextMove}
              disabled={currentMoveIndex >= moveLog.length - 1}
              className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <ForwardIcon className='h-6 w-6' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;