import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import React, { useRef, useState, useEffect } from 'react';
import { BackwardIcon, ClockIcon, ForwardIcon } from '@heroicons/react/24/outline';
import { saveMatch } from '../api.js';
import UserInfo from './UserInfo.jsx';
import MoveLog from './MoveLog.jsx';

const ChessBoard = ({ isBotGame, botRating, timeControl, isViewOnly, gameId, userId, socket,player1_id,player2_id }) => {
  const [game, setGame] = useState(new Chess());
  const queryParams = new URLSearchParams(location.search);
  const isReplay = queryParams.get('replay') === 'true';
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [whiteTime, setWhiteTime] = useState(timeControl || 600);
  const [blackTime, setBlackTime] = useState(timeControl || 600);
  const [activePlayer, setActivePlayer] = useState('w');
  const timerRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [materialAdvantage, setMaterialAdvantage] = useState(0);

  useEffect(() => {
    if (isReplay) {
      fetchGameState(gameId);
    }
  }, [gameId, isReplay]);

  const fetchGameState = async (gameId) => {
    try {
      const response = await fetch(`http://localhost:8000/chess/game/${gameId}/moves`);
      if (!response.ok) throw new Error('Failed to fetch game state');

      const moves = await response.json();
      console.log(moves);
      const gameCopy = new Chess();

      moves.forEach((move) => {
        gameCopy.move(move);
      });

      setGame(gameCopy);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  useEffect(() => {
    if (isBotGame && activePlayer === 'b' && !gameOver) {
      setIsBotThinking(true);

      fetch('http://localhost:8000/chess/game/bot-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: game.fen(), botRating, gameId, playerId: player2_id }),
      })
        .then(response => response.json())
        .then(data => {
          console.log("Bot move received:", data);
          if (!data.move) {
            throw new Error("Invalid bot move received: " + JSON.stringify(data));
          }
          const botMove = data.move;
          const gameCopy = new Chess(game.fen());
          gameCopy.move(botMove);
          setGame(gameCopy);
          setMoveLog((prev) => [...prev, botMove]);
          setCurrentMoveIndex((prev) => prev + 1);
          setActivePlayer("w");
          checkGameOver(gameCopy);
        })
        .catch(error => console.error("Error fetching bot move:", error));
      
    }
  }, [activePlayer, isBotGame, gameOver, game, botRating]);

  useEffect(() => {
    if (socket) {
      socket.on('moveMade', (move) => {
        const gameCopy = new Chess(game.fen());
        gameCopy.move(move);
        setGame(gameCopy);
        setMoveLog((prev) => [...prev, move]);
        setCurrentMoveIndex((prev) => prev + 1);
        setActivePlayer((prev) => (prev === 'w' ? 'b' : 'w'));
        checkGameOver(gameCopy);
      });
    }
  }, [socket, game]);

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
            handleTimerExpired('b');
            return 0;
          }
          return prevTime - 1;
        });
      } else {
        setBlackTime((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(timerRef.current);
            handleTimerExpired('w');
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
console.log(winnerColor,game,player1_id);
let winnerId = winnerColor === 'w' ? player1_id : player2_id;
    if (!winnerId) {
      console.error("Error: Winner ID is undefined!");
      return;
    }
    console.log(`Time expired! Winner ID: ${winnerId}`);
    if (!gameId) {
      console.error('Game ID is undefined');
      return;
    }

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

    alert(`Time's up! ${winnerColor === 'w' ? 'White' : 'Black'} wins!`);
  };

  const checkGameOver = (gameCopy) => {
    if (gameCopy.isGameOver()) {
        setGameOver(true);
        clearInterval(timerRef.current);

        let result;
        let winnerId = null;
        if (gameCopy.isCheckmate()) {
          result = activePlayer === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
          winnerId = activePlayer === 'w' ? -1 : userId; 
        } else if (gameCopy.isStalemate()) {
          result = 'Stalemate';
        } else if (gameCopy.isDraw()) {
          result = 'Draw';
        }
        if (isBotGame) {
          saveMatch(result, winnerId,userId,moveLog);
        }
    }
};


const onDrop = async (sourceSquare, targetSquare) => {
  try {
    if (isReplay) return false; 
    if (isViewOnly) return false; 

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

    if (!move) {
      console.error(`Invalid move: Move is not allowed. Current player: ${activePlayer}`);
      return false; 
    }

    // Update captured pieces and material advantage
    if (move.captured) {
      const capturedPiece = move.captured.toLowerCase();
      const updatedCapturedPieces = { ...capturedPieces };

      if (piece.color === 'w') {
        updatedCapturedPieces.black.push(capturedPiece);
      } else {
        updatedCapturedPieces.white.push(capturedPiece);
      }

      setCapturedPieces(updatedCapturedPieces);

      const pieceValue = getPieceValue(capturedPiece.toLowerCase());
      const advantageChange = piece.color === 'w' ? pieceValue : -pieceValue;
      setMaterialAdvantage((prevAdvantage) => prevAdvantage + advantageChange);
    }

    // Update move log and current move index
    const newMoveLog = [...moveLog, move.san];
    setMoveLog(newMoveLog);
    setCurrentMoveIndex(newMoveLog.length - 1);

    // Prepare move data to save
    const playerId = activePlayer === "w" ? player1_id : player2_id;
    const moveData = {
      playerId,
      moveNumber: newMoveLog.length, 
      move: move.san,
    };

    console.log("🔹 Sending move data:", moveData);

    // Save the move to the backend
    const response = await fetch(`http://localhost:8000/chess/game/${gameId}/moves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(moveData),
    });

    if (!response.ok) throw new Error("Failed to save move");

    console.log("Move saved:", await response.json());

    // Update the game state
    setGame(gameCopy);
    checkGameOver(gameCopy);

    if (!gameOver) {
      setActivePlayer((prevPlayer) => (prevPlayer === 'w' ? 'b' : 'w'));
    }

    return true; // Move was successful
  } catch (error) {
    console.error('Error handling move:', error.message);
    return false; // Move failed
  }
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
        <UserInfo
            playerName="Player 1"
            playerRating="1600"
            capturedPieces={capturedPieces.white}
            materialAdvantage={materialAdvantage < 0 ? -materialAdvantage : 0}
            time={blackTime}
            isBot={isBotGame}
            botRating={botRating}
          />
          <div className='h-6 w-screen flex bg-gray-800 text-white overflow-x-scroll md:hidden'>
          <MoveLog
            moveLog={moveLog}
            currentMoveIndex={currentMoveIndex}
            checkOutMove={checkOutMove}
            isMobile={true}
          />
          </div>
          <div className="sm:h-96 sm:w-96 lg:w-96 lg:h-96 md:w-96 md:h-96 h-auto w-screen">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              arePiecesDraggable={!isViewOnly && !gameOver && currentMoveIndex === moveLog.length - 1}
            />
          </div>
          <UserInfo
            playerName="Player 2"
            playerRating="1600"
            capturedPieces={capturedPieces.black}
            materialAdvantage={materialAdvantage > 0 ? materialAdvantage : 0}
            time={whiteTime}
            isBot={false}
          />
        </div>
        <div className='flex flex-col w-1/4 h-full'>
        <MoveLog
            moveLog={moveLog}
            currentMoveIndex={currentMoveIndex}
            checkOutMove={checkOutMove}
            isMobile={false}
          />
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