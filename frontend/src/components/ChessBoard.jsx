import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import React, { useRef, useState, useEffect } from 'react';
import { BackwardIcon, ClockIcon, ForwardIcon } from '@heroicons/react/24/outline';
import { getMoves, saveMatch,getBotMove,endGame, addMove,resignGame,getUserDetails } from '../api.js';
import UserInfo from './UserInfo.jsx';
import MoveLog from './MoveLog.jsx';
import PostGameCard from './PostGameCard.jsx';
import MaterialAdvantage from './MaterialAdvantage.jsx';
import { useLocation } from 'react-router-dom';

const ChessBoard = ({ isBotGame, botRating, timeControl, isViewOnly, gameId, userId, socket, player1_id, player2_id, player1_username = "Player 1", player2_username = "Player 2" }) => {
  const [game, setGame] = useState(new Chess());
const location = useLocation();
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
  const [showPostGameCard, setShowPostGameCard] = useState(false);
  const [gameResultDisplay, setGameResultDisplay] = useState(null);
  const [player1_profilePic, setPlayer1ProfilePic] = useState(null);
const [player2_profilePic, setPlayer2ProfilePic] = useState(null);

useEffect(() => {
  const fetchProfilePics = async () => {
    if (player1_id) {
      try {
        const res1 = await getUserDetails(player1_id);
        setPlayer1ProfilePic(res1?.user?.profilepic || "6.png");
      } catch {
        setPlayer1ProfilePic("6.png");
      }
    }
    if (player2_id && player2_id !== -1) {
      try {
        const res2 = await getUserDetails(player2_id);
        setPlayer2ProfilePic(res2?.user?.profilepic || "6.png");
      } catch {
        setPlayer2ProfilePic("6.png");
      }
    } else if (player2_id === -1) {
      setPlayer2ProfilePic("bot.png");
    }
  };
  fetchProfilePics();
}, [player1_id, player2_id]);

  const [postGameResult, setPostGameResult] = useState(null);
  useEffect(() => {
    if (isReplay) {
      fetchGameState(gameId);
    }
  }, [gameId, isReplay]);

  const fetchGameState = async (gameId) => {
    try {
      const moves = await getMoves(gameId);
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
      console.log(botRating);
(async () => {
        try {
          const data = await getBotMove({ fen: game.fen(), botRating, gameId, playerId: player2_id });
          if (!data.move) throw new Error("Invalid bot move received: " + JSON.stringify(data));
          const botMove = data.move;
          const gameCopy = new Chess(game.fen());
          gameCopy.move(botMove);
          setGame(gameCopy);
          setMoveLog((prev) => [...prev, botMove]);
          setCurrentMoveIndex((prev) => prev + 1);
          setActivePlayer("w");
          checkGameOver(gameCopy);
        } catch (error) {
          console.error("Error fetching bot move:", error);
        }
      })();
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

  const handleResign = async () => {
    if (!gameId || !userId) return;
    if (!window.confirm("Are you sure you want to resign?")) return;

    try {
      await resignGame(gameId);
      setGameOver(true);
      setGameResultDisplay({
        result: "resigned",
        winnerId: userId === player1_id ? player2_id : player1_id,
        winType: "Resignation",
        gameId,
      });
      setShowPostGameCard(true);
    } catch (error) {
      alert('Error resigning game: ' + error.message);
    }
  };

  const handleTimerExpired = async (winnerColor) => {
    setGameOver(true);
    clearInterval(timerRef.current);

    const winnerId = winnerColor === 'w' ? player1_id : player2_id;

    if (!winnerId) {
      console.error("Error: Winner ID is undefined!");
      return;
    }

    const gameResult = {
      player1: {
        id: player1_id,
        username: player1_username,
        profilePic: player1_profilePic || "6.png",
        result: winnerColor === 'w' ? 'Win' : 'Loss'
      },
      player2: {
        id: player2_id,
        username: player2_username,
    profilePic: isBotGame ? "bot.png" : (player2_profilePic || "6.png"),
        result: winnerColor === 'b' ? 'Win' : 'Loss'
      },
      timeControl: timeControl,
      winnerId: winnerId,
      winType: 'Time Out',
      moves: moveHistoryPairs,
      gameId: gameId
    };

    setGameResultDisplay(gameResult);
    setShowPostGameCard(true);

    try {
      await endGame(gameId, winnerId, 'completed');
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  const checkGameOver = async (gameCopy) => {
    if (gameCopy.isGameOver()) {
      setGameOver(true);
      clearInterval(timerRef.current);

      let result;
      let winnerId = null;
      let winType = '';

      if (gameCopy.isCheckmate()) {
        winType = 'Checkmate';
        if (gameCopy.turn() === 'w') {
          // Black delivered checkmate
          winnerId = player2_id;
          result = {
            player1: 'Loss',
            player2: 'Win'
          };
        } else {
          // White delivered checkmate
          winnerId = player1_id;
          result = {
            player1: 'Win',
            player2: 'Loss'
          };
        }
      } else if (gameCopy.isDraw() || gameCopy.isStalemate()) {
        winType = gameCopy.isStalemate() ? 'Stalemate' : 'Draw';
        result = {
          player1: 'Draw',
          player2: 'Draw'
        };
      }

      const gameResult = {
        player1: {
          id: player1_id,
          username: player1_username,
          profilePic: player1_profilePic || "6.png",
          result: result.player1
        },
        player2: {
          id: player2_id,
          username: isBotGame ? "Bot" : player2_username,
          profilePic: isBotGame ? "bot.png" : (player2_profilePic || "default-pfp.png"),
          result: result.player2
        },
        timeControl: timeControl,
        winnerId: winnerId,
        winType: winType,
        moves: moveHistoryPairs,
        gameId: gameId,
      };

      setPostGameResult(gameResult);
      setGameResultDisplay(gameResult);
      setShowPostGameCard(true);

      if (isBotGame) {
        const resultStatus = winnerId ? 'completed' : 'draw';
        const saveData = {
          status: resultStatus,
          winnerId: winnerId,
          result: winType.toLowerCase(),
          moves: moveLog
        };
        try {
          await endGame(gameId, winnerId, resultStatus);
        } catch (error) {
          console.error('Error updating game status:', error);
        }
      }
    }
  };

  const handleClosePostGameCard = () => {
    setPostGameResult(null);
  };


  const onDrop = async (sourceSquare, targetSquare) => {
    try {
      if (isReplay) return false;
      if (isViewOnly) return false;

      const piece = game.get(sourceSquare);
      if (!piece || piece.color !== activePlayer || currentMoveIndex !== moveLog.length - 1) {
        return false;
      }
      const currentRemainingTime = activePlayer === 'w' ? whiteTime : blackTime;
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
      setGame(gameCopy);
      const newMoveLog = [...moveLog, move.san];
      setMoveLog(newMoveLog);
      setCurrentMoveIndex(newMoveLog.length - 1);

      // Prepare move data to save
      const playerId = activePlayer === "w" ? player1_id : player2_id;
      const moveData = {
        playerId,
        moveNumber: newMoveLog.length,
        move: move.san,
        remainingTime: currentRemainingTime,
      };

      console.log("🔹 Sending move data:", moveData);

      // Save the move to the backend
      await addMove(gameId, moveData);

      // Update the game state
      await checkGameOver(gameCopy);

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

  const moveHistoryPairs = [];
  for (let i = 0; i < moveLog.length; i += 2) {
    moveHistoryPairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveLog[i] || '',
      black: moveLog[i + 1] || ''
    });
  }
  return (
    <div className="flex justify-center items-center min-h-screen w-full overflow-x-hidden bg-[#2c2c2c] p-4">
      {showPostGameCard && gameResultDisplay && (
        <PostGameCard
          gameResult={gameResultDisplay}
          onClose={() => setShowPostGameCard(false)}
        />
      )}
      <div className="flex flex-col h-full justify-center items-center lg:flex-row w-full gap-6">
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col mt-10 lg:mt-0">
          <UserInfo
            playerName={isBotGame ? "Bot" : player2_username}
            playerRating={isBotGame ? botRating : "1600"}
            isTopPlayer={true}
            isBot={isBotGame}
            botRating={isBotGame ? botRating : undefined}
            timeRemaining={blackTime}
            userId={player2_id}
          />
          <MaterialAdvantage
            capturedPieces={capturedPieces}
            materialAdvantage={materialAdvantage < 0 ? -materialAdvantage : 0}
            isTopPlayer={true}
          />

          <div className='h-6 w-screen flex bg-gray-800 text-white overflow-x-scroll md:hidden'>
            <MoveLog
              moveHistory={moveHistoryPairs}
              currentMoveIndex={currentMoveIndex}
              checkOutMove={checkOutMove}
              isMobile={true}
            />
          </div>
          <div className="sm:h-96 sm:w-96 lg:w-96 lg:h-96 md:w-96 md:h-96 h-auto w-full">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              arePiecesDraggable={!isViewOnly && !gameOver && currentMoveIndex === moveLog.length - 1}
            />
          </div>
          <MaterialAdvantage
            capturedPieces={capturedPieces}
            materialAdvantage={materialAdvantage > 0 ? materialAdvantage : 0}
            isTopPlayer={false}
          />
          <UserInfo
            playerName={player1_username}
            playerRating="1600"
            isTopPlayer={false}
            isBot={false}
            timeRemaining={whiteTime}
            userId={player1_id}
          />
        </div>
        <div className='flex flex-col w-1/4 h-full'>
          <MoveLog
            moveHistory={moveHistoryPairs}
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
            <button
              onClick={handleResign}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 ml-4"
              disabled={gameOver}
            >
              Resign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;