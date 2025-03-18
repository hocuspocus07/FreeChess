import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import React, { useRef, useState, useEffect } from 'react';
import { BackwardIcon, ClockIcon, ForwardIcon } from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom';

const ChessBoard = () => {
  const gameId=useParams();
  const [game, setGame] = useState(new Chess());
  const [moveLog, setMoveLog] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [activePlayer, setActivePlayer] = useState('w');
  const timerRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [materialAdvantage, setMaterialAdvantage] = useState(0);
  const [isViewOnly,setIsViewOnly]=useState(true);
  const userId=localStorage.getItem('userId');
  
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const gameResponse = await fetch(`http://localhost:8000/chess/game/${gameId}`);
        if (!gameResponse.ok) throw new Error('Failed to fetch game details');
        const gameData = await gameResponse.json();

        const isGameOver=gameData.status!=='ongoing';

        const isParticipant = userId === gameData.player1_id || userId === gameData.player2_id;

        setIsViewOnly(isGameOver || !isParticipant);

        const movesResponse = await fetch(`http://localhost:8000/chess/game/${gameId}/moves`);
        if (!movesResponse.ok) throw new Error('Failed to fetch move history');
        const movesData = await movesResponse.json();
        setMoveLog(movesData.moves || []);

        // Replay all moves to set the current game state
        const gameCopy = new Chess();
        movesData.moves.forEach((move) => gameCopy.move(move));
        setGame(gameCopy);
        setCurrentMoveIndex(movesData.moves.length - 1);
      } catch (error) {
        console.error('Error fetching move history:', error);
      }
    };
    fetchGameDetails();
  }, [gameId,userId]);

  const logMove = async (move) => {
    if (isViewOnly) return; // Disable move logging in view-only mode

    try {
      const response = await fetch(`http://localhost:8000/chess/game/${gameId}/moves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          playerId: activePlayer === 'w' ? game.player1_id : game.player2_id,
          moveNumber: moveLog.length + 1,
          move: move.san,
        }),
      });
      if (!response.ok) throw new Error('Failed to log move');
    } catch (error) {
      console.error('Error logging move:', error);
    }
  };
  useEffect(() => {
    if (!gameOver) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [activePlayer, gameOver]);

  const startTimer = () => {
  clearInterval(timerRef.current);
  timerRef.current = setInterval(() => {
    if (activePlayer === 'w') {
      setWhiteTime((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerRef.current);
          handleTimerExpired('b'); // Black wins
          return 0;
        }
        return prevTime - 1;
      });
    } else {
      setBlackTime((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerRef.current);
          handleTimerExpired('w'); // White wins
          return 0;
        }
        return prevTime - 1;
      });
    }
  }, 1000);
};

const handleTimerExpired = async (winnerColor) => {
  setGameOver(true);
  clearInterval(timerRef.current);

  // Determine the winner's ID based on the color
  const winnerId = winnerColor === 'w' ? game.player1_id : game.player2_id;

  // Update the game status in the backend
  try {
    const response = await fetch(`http://localhost:8000/chess/game/${gameId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        winnerId,
        status: 'completed',
      }),
    });

    if (!response.ok) throw new Error('Failed to update game status');
  } catch (error) {
    console.error('Error updating game status:', error);
  }

  // Notify the user
  alert(`Time's up! ${winnerColor === 'w' ? 'White' : 'Black'} wins!`);
};

  const checkGameOver = (gameCopy) => {
    if (gameCopy.isGameOver()) {
      setGameOver(true);
      clearInterval(timerRef.current);
      if (gameCopy.isCheckmate()) {
        alert(`Checkmate! ${activePlayer === 'w' ? 'Black' : 'White'} wins!`);
      } else if (gameCopy.isStalemate()) {
        alert('Stalemate! The game is a draw.');
      } else if (gameCopy.isDraw()) {
        alert('The game is a draw.');
      }
    }
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (isViewOnly) return false;
    console.log("Attempting to move from:", sourceSquare, "to:", targetSquare);

    const piece = game.get(sourceSquare);
    if (!piece || piece.color !== activePlayer || currentMoveIndex !== moveLog.length - 1) {
      return false; 
    }


    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) {
      console.log("Invalid move: Move is null.");
      return false;
    }
    logMove(move);

    console.log("Move successful:", move.san);

    if (move.captured) {
      const capturedPiece = move.captured;
      const updatedCapturedPieces = { ...capturedPieces };

      if (piece.color === 'w') {
        updatedCapturedPieces.white.push(capturedPiece);
      } else {
        updatedCapturedPieces.black.push(capturedPiece);
      }

      setCapturedPieces(updatedCapturedPieces);

      const pieceValue = getPieceValue(capturedPiece);
      const advantageChange = piece.color === 'w' ? pieceValue : -pieceValue;
      setMaterialAdvantage((prevAdvantage) => prevAdvantage + advantageChange);
    }

    const newMoveLog = [...moveLog, move.san];
    setMoveLog(newMoveLog);
    setCurrentMoveIndex(newMoveLog.length - 1);

    setGame(gameCopy);
    checkGameOver(gameCopy);

    if (!gameOver) {
      setActivePlayer((prevPlayer) => (prevPlayer === 'w' ? 'b' : 'w'));
    }

    return true;
  };

  const pieceIcons = {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
  };

  const getPieceValue = (piece) => {
    switch (piece) {
      case 'p': return 1;
      case 'n': return 3;
      case 'b': return 3;
      case 'r': return 5;
      case 'q': return 9;
      default: return 0;
    }
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
            /><div className='flex flex-col'>
            <div className='flex'>
            <h2 className="text-xl font-bold">Player 1</h2>
            <p className="text-gray-400 text-xs">(1600)</p></div>
            <div className="flex items-center">
            <div className="flex flex-wrap">
              {capturedPieces.black.map((piece, index) => (
                <span key={index} className="text-white text-xl mr-0.5">
                  {pieceIcons[piece]}
                </span>
              ))}
            </div>
              {materialAdvantage < 0 && (
              <span className="text-green-500 text-sm ml-1">
                +{-materialAdvantage}
              </span>
            )}
            </div>
          </div>
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
              onPieceDrop={onDrop}
              arePiecesDraggable={!isViewOnly && !gameOver && currentMoveIndex === moveLog.length - 1}
            />
          </div>

          <div className="bg-gray-900 rounded-lg mt-3 flex relative items-center text-white">
            <img
              src="user.png"
              alt="Player 2"
              className="w-12 h-12 bg-white mr-3"
            />
            <div className='flex flex-col'>
              <div className='flex'>
              <h2 className="text-xl font-bold">Player 2</h2>
              <p className="text-gray-400 text-xs">(1600)</p></div>
              <div className="flex items-center">
                <div className="flex flex-wrap">
                  {capturedPieces.white.map((piece, index) => (
                    <span key={index} className="text-black text-xl mr-0.5">
                      {pieceIcons[piece]}
                    </span>
                  ))}
                </div>
                {materialAdvantage > 0 && (
                  <span className="text-green-500 text-sm ml-1">
                    +{materialAdvantage}
                  </span>
                )}
              </div>
            </div>
            <div className='right-0 absolute h-8 w-20 flex justify-center items-center bg-gray-200 text-black rounded-md'>
              <ClockIcon className='h-5 w-5' />
              <span className='ml-2'>{formatTime(whiteTime)}</span>
            </div>
          </div>
        </div>
        <div className='flex flex-col w-1/4 h-full'>
          <div className="bg-gray-900 rounded-lg p-6 sm:flex hidden flex-col text-white h-full">
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