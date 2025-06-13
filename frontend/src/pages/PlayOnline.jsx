import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, refreshAccessToken } from '../api.js';
import MoveLog from '../components/MoveLog.jsx';
import MaterialAdvantage from '../components/MaterialAdvantage.jsx';
import UserInfo from '../components/UserInfo.jsx';
import { getUserProfilePic, getUserDetails, endGame } from '../api.js';
import Loading from '../components/Loading.jsx';
import PostGameCard from '../components/PostGameCard.jsx';
import { NavigationPrompt } from '../components/NavigationPrompt.jsx';

const PlayOnline = () => {
  const [game, setGame] = useState(new Chess());
  const [socket, setSocket] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [currentTurn, setCurrentTurn] = useState('white');
  const [opponentId, setOpponentId] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const gameInstance = useRef(new Chess());
  const boardRef = useRef(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [showWaitingModal, setShowWaitingModal] = useState(true);
  const gameEndedRef = useRef(false);
  const [whiteTime, setWhiteTime] = useState(10 * 60);
  const [blackTime, setBlackTime] = useState(10 * 60);
  const [lastMoveTime, setLastMoveTime] = useState(Date.now());
  const [timerInterval, setTimerInterval] = useState(null);
  const [hasJoinedQueue, setHasJoinedQueue] = useState(false);
  const [myUsername, setMyUsername] = useState('');
  const [opponentUsername, setOpponentUsername] = useState('');
  const [myProfilePic, setMyProfilePic] = useState('');
  const [opponentProfilePic, setOpponentProfilePic] = useState('');
  const [gameResult, setGameResult] = useState(null);

  const handleGameEnd = async ({ winnerId }) => {
  if (gameEndedRef.current) return;
  gameEndedRef.current = true;

  try {
    setStatus('ended');

    // Get final game state to verify winner
    const gameState = getGameState(game);
    let finalWinnerId = winnerId;

    if (gameState.isCheckmate) {
      const winnerColor = gameState.turn === 'w' ? 'black' : 'white';
      finalWinnerId = winnerColor === playerColor ? userId : opponentId;
    } else if (gameState.isDraw) {
      finalWinnerId = null;
    }

    if (moveHistory.length === 0) {
      return;
    }

    setTimeout(() => {
      setGameResult({
        player1: { id: userId, username: myUsername, profilePic: myProfilePic },
        player2: { id: opponentId, username: opponentUsername, profilePic: opponentProfilePic },
        timeControl: 600,
        result: finalWinnerId === userId ? 'Win' : finalWinnerId === opponentId ? 'Loss' : 'Draw',
        winType: gameState.isCheckmate ? 'Checkmate' : gameState.isDraw ? 'Draw' : 'Resignation',
        gameId,
        winnerId: finalWinnerId,
        currentUserId: userId,
      });
    }, 1000);

    const data = await endGame(gameId, finalWinnerId, finalWinnerId ? 'completed' : 'draw');
    if (data.message && data.message !== 'Game ended successfully') {
      throw new Error(data.message || 'Failed to save game result');
    }

    const resultMessage = finalWinnerId
      ? (finalWinnerId === userId ? 'You won!' : 'You lost!')
      : 'Game ended in a draw!';

    setTimeout(() => {
      alert(resultMessage);
    }, 1000);
  } catch (error) {
    console.error('Error ending game:', error);
  }
};

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      getUserDetails(userId).then(data => setMyUsername(data.user?.username || 'You'));
      getUserProfilePic(userId).then(pic => setMyProfilePic(pic ? `/avatar/${pic}` : "/avatar/6.png"));
    }
  }, []);

  // Fetch opponent username when assigned:
  useEffect(() => {
    if (opponentId) {
      getUserDetails(opponentId).then(data => setOpponentUsername(data.user?.username || 'Opponent'));
      getUserProfilePic(opponentId).then(pic => setOpponentProfilePic(pic ? `/avatar/${pic}` : "/avatar/6.png"));
    }
  }, [opponentId]);
  useEffect(() => {
    if (!socket) return;

    if (hasJoinedQueue) {
      socket.emit('joinMatchmaking');
      setStatus('waiting');
      setShowWaitingModal(true);
    }
  }, [socket, hasJoinedQueue]);

  useEffect(() => {
  if (!socket) return;

  socket.on('gameOver', handleGameEnd);
  socket.on('opponentResigned', () => {
    console.log('Opponent resigned event received');
    handleGameEnd({ winnerId: userId });
  });

  return () => {
    socket.off('gameOver', handleGameEnd);
    socket.off('opponentResigned');
  };
}, [socket, gameId, userId, game, playerColor, opponentId, moveHistory, myUsername, opponentUsername, myProfilePic, opponentProfilePic]);

  useEffect(() => {
    if (status !== 'active') {
      if (timerInterval) clearInterval(timerInterval);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000); // Convert to seconds

      if (elapsedSeconds <= 0) return; // No time elapsed

      if (game.turn() === 'w') {
        setWhiteTime(prev => Math.max(0, prev - elapsedSeconds));
      } else {
        setBlackTime(prev => Math.max(0, prev - elapsedSeconds));
      }

      setLastMoveTime(now);

      if (whiteTime <= 0 || blackTime <= 0) {
        clearInterval(interval);
        const winnerId = whiteTime <= 0 ? opponentId : userId;
        socket.emit('gameOver', {
          gameId,
          winnerId,
          reason: 'timeout'
        });
        setStatus('ended');
      }
    }, 1000);

    setTimerInterval(interval);
    return () => clearInterval(interval);
  }, [status, game, lastMoveTime, whiteTime, blackTime]);

  const checkOutMove = (flatIndex) => {
    const gameCopy = new Chess();
    let moveList = [];
    moveHistory.forEach((entry) => {
      if (entry.white) moveList.push(entry.white);
      if (entry.black) moveList.push(entry.black);
    });
    moveList.slice(0, flatIndex + 1).forEach((move) => {
      gameCopy.move(move);
    });
    setGame(gameCopy);
    setCurrentMoveIndex(flatIndex);
  };
  useEffect(() => {
    if (status === 'active') {
      gameEndedRef.current = false;
    }
  }, [status]);

  const getGameState = (game) => {
    return {
      isGameOver: game.isGameOver(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
      isStalemate: game.isStalemate(),
      isThreefoldRepetition: game.isThreefoldRepetition(),
      isInsufficientMaterial: game.isInsufficientMaterial(),
      fen: game.fen(),
      turn: game.turn(),
      moves: game.history({ verbose: true }),
    };
  };
  useEffect(() => {
    if (!socket) return;

    const handleMoveMade = ({ move, fen, currentTurn, moveHistory: serverMoveHistory, timeRemaining }) => {
      try {
        const newGame = new Chess(fen);
        setGame(newGame);
        setCurrentTurn(currentTurn === 'w' ? 'white' : 'black');

        if (timeRemaining) {
          setWhiteTime(timeRemaining.white);
          setBlackTime(timeRemaining.black);
          setLastMoveTime(Date.now());
        }

        let updatedMoveHistory = [];
        const moves = Array.isArray(serverMoveHistory) ? serverMoveHistory : newGame.history();
        for (let i = 0; i < moves.length; i += 2) {
          updatedMoveHistory.push({
            number: Math.floor(i / 2) + 1,
            white: typeof moves[i] === 'string' ? moves[i] : moves[i]?.white || '',
            black: typeof moves[i + 1] === 'string' ? moves[i + 1] : moves[i + 1]?.black || '',
          });
        }
        setMoveHistory(updatedMoveHistory);
        let flatMoveCount = 0;
        updatedMoveHistory.forEach(entry => {
          if (entry.white) flatMoveCount++;
          if (entry.black) flatMoveCount++;
        });
        setCurrentMoveIndex(flatMoveCount - 1);

        const gameState = getGameState(newGame);
      } catch (error) {
        console.error('Error updating game:', error);
        socket.emit('moveHistoryError', {
          message: 'Failed to process move history',
          gameId
        });
      }
    };

    socket.on('moveMade', handleMoveMade);
    return () => {
      socket.off('moveMade', handleMoveMade);
    };
  }, [socket, gameId, userId, opponentId]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('leaveMatchmaking');
        socket.disconnect();
      }
    };
  }, [socket]);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const newSocket = io(API_BASE_URL, {
          auth: { token },
          reconnectionAttempts: 3,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
          console.log('Socket connected');
          setStatus('waiting');
          setShowWaitingModal(true);
        });

        newSocket.on('gameAssigned', ({ gameId, isWhite, opponentId, initialFen }) => {
          console.log(`Game assigned: ${gameId}, Color: ${isWhite ? 'white' : 'black'}`);
          setGameId(gameId);
          setPlayerColor(isWhite ? 'white' : 'black');
          setOpponentId(opponentId);

          const newGame = new Chess(initialFen);
          gameInstance.current = newGame;
          setGame(newGame);
          setCurrentTurn(newGame.turn() === 'w' ? 'white' : 'black');
          setStatus('active');
          setShowWaitingModal(false);
          setMoveHistory([]);
          setCurrentMoveIndex(-1);

          setWhiteTime(10 * 60);
          setBlackTime(10 * 60);
          setLastMoveTime(Date.now());
          newSocket.emit('joinGame', { gameId });
        });

        newSocket.on('gameOver', ({ winnerId }) => {
          console.log('Received gameOver event from server');
          handleGameEnd({ winnerId });
        });

        newSocket.on('gameReady', ({ gameId, isWhite, opponentId, initialFen }) => {
          console.log('Game ready:', gameId);
          setGameId(gameId);
          setPlayerColor(isWhite ? 'white' : 'black');
          setOpponentId(opponentId);

          const newGame = new Chess(initialFen);
          setGame(newGame);
          setStatus('active');
          setMoveHistory([]);
          setCurrentMoveIndex(-1);
        });

        newSocket.on('invalidMove', ({ message }) => {
          console.log('Invalid move:', message);
        });

        newSocket.on('error', (error) => {
          console.error('Socket error:', error);
          if (error.message === 'Authentication error') {
            handleTokenRefresh(newSocket);
          } else {
            alert(`Error: ${error.message}`);
          }
        });

        newSocket.emit('joinMatchmaking');

      } catch (error) {
        console.error('Connection error:', error);
        setStatus('ended');
        alert('Failed to connect. Please try again.');
      }
    };

    const handleTokenRefresh = async (socket) => {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          localStorage.setItem('token', newToken);
          socket.auth = { token: newToken };
          socket.connect();
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };

    initializeConnection();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId, navigate]);

  function onDrop(sourceSquare, targetSquare) {
    if (status !== 'active' || !playerColor) return false;

    const isCorrectTurn = (playerColor === 'white' && game.turn() === 'w') ||
      (playerColor === 'black' && game.turn() === 'b');

    if (!isCorrectTurn) {
      console.log(`Not your turn! Current turn: ${game.turn()}, Your color: ${playerColor}`);
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (!move) return false;

      const newGame = new Chess(game.fen());
      setGame(newGame);

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000);

      if (move.color === 'w') {
        setBlackTime(prev => Math.max(0, prev - elapsedSeconds));
      } else {
        setWhiteTime(prev => Math.max(0, prev - elapsedSeconds));
      }

      setLastMoveTime(now);
      const totalMoves = newGame.history().length;
      const moveNumber = Math.ceil((totalMoves) / 2);

      setCurrentTurn(newGame.turn());
      setCurrentMoveIndex(totalMoves - 1);

      const newMoveHistory = [...moveHistory];

      const lastEntry = newMoveHistory[newMoveHistory.length - 1];
      const isLastEntryValidObject = typeof lastEntry === 'object' && lastEntry !== null;

      if (move.color === 'w') {
        if (isLastEntryValidObject && !lastEntry.white) {
          lastEntry.white = move.san;
          lastEntry.player = userId;
          lastEntry.color = 'white';
        } else {
          newMoveHistory.push({
            number: moveNumber,
            white: move.san,
            black: '',
            player: userId,
            color: 'white'
          });
        }
      } else {
        if (isLastEntryValidObject && !lastEntry.black) {
          lastEntry.black = move.san;
          lastEntry.player = userId;
          lastEntry.color = 'black';
        } else {
          newMoveHistory.push({
            number: moveNumber,
            white: '',
            black: move.san,
            player: userId,
            color: 'black'
          });
        }
      }

      setMoveHistory(newMoveHistory);

      console.log('Move made:', move.san);
      const gameState = getGameState(newGame);
      console.log('New game state:', gameState);

      // Emit move to server
      socket.emit('makeMove', {
        gameId,
        move: move.san,
        moveHistory: newMoveHistory,
        fen: newGame.fen(),
        currentTurn: newGame.turn(),
        timeRemaining: {
          white: whiteTime,
          black: blackTime
        }
      });
      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  }

  useEffect(() => {
    console.log('Game state updated:', getGameState(game), 'Status:', status);
  }, [game, status]);

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resignGame', {
        gameId,
        resignerId: userId
      });
      setStatus('ended');
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return (
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium"
            onClick={() => setHasJoinedQueue(true)}
          >
            Find Opponent
          </button>
        );
      case 'waiting':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center max-w-md w-full">
            <p className="text-lg font-medium text-white">Waiting for opponent...</p>
            <div className="mt-2 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            {gameId && <p className="mt-2 text-sm text-gray-400">Game ID: {gameId}</p>}
          </div>
        );
      case 'active':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-sm text-gray-300">Playing as <span className={`font-bold ${playerColor === 'white' ? 'text-gray-100' : 'text-gray-900 bg-gray-300 px-1 rounded'}`}>{playerColor}</span></p>
            <p className="text-sm text-gray-300">Turn: <span className={`font-bold ${currentTurn === 'white' ? 'text-gray-100' : 'text-gray-900 bg-gray-300 px-1 rounded'}`}>{currentTurn}</span></p>
            {opponentId && <p className="text-xs text-gray-400 mt-1">vs. Player #{opponentId}</p>}
          </div>
        );
      case 'ended':
        return <p className="text-gray-300">Game ended</p>;
      default:
        return null;
    }
  };
  useEffect(() => {
    if (status === 'waiting') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [status]);

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white font-sans flex items-center justify-center">
        <Loading text="Waiting" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      {status === 'ended' && gameResult && (
        <PostGameCard
          gameResult={gameResult}
          onClose={() => setGameResult(null)}
        />
      )}
      <div className="max-w-4xl mx-auto p-6 bg-[#2c2c2c] rounded-lg shadow-lg">
        <header className="flex justify-between items-center mb-6">
          {status === 'ended' && (
            <button
              onClick={() => navigate('/multiplayer')}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {/* ...svg... */}
              <span className="font-medium">Back</span>
            </button>
          )}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Online Chess
          </h1>
          <div className="w-5"></div>
        </header>
        <div className="flex flex-col lg:flex-row gap-6 bg-gray-900 p-5 rounded-lg">
          <div className="flex flex-col justify-center sm:w-1/2 sm:h-auto">
            <div className="w-full overflow-y-scroll mb-2">
              <MoveLog
                moveHistory={moveHistory}
                currentMoveIndex={currentMoveIndex}
                checkOutMove={checkOutMove}
                isMobile={true}
              />
            </div>
            <UserInfo
              playerName={opponentUsername}
              playerRating="1600"
              timeRemaining={playerColor === 'white' ? blackTime : whiteTime}
              isBot={false}
              isCurrentTurn={currentTurn !== playerColor}
              userId={opponentId}
            />
            <MaterialAdvantage
              capturedPieces={{
                white: [],
                black: []
              }}
              materialAdvantage={0}
              isTopPlayer={true}
            />
            <div className="flex items-stretch mt-2">
              <div className="flex-1">
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  boardOrientation={playerColor || 'white'}
                />
              </div>
            </div>
            <MaterialAdvantage
              capturedPieces={{
                white: [],
                black: []
              }}
              materialAdvantage={0}
              isTopPlayer={false}
            />
            <UserInfo
              playerName={myUsername}
              playerRating="1600"
              timeRemaining={playerColor === 'white' ? whiteTime : blackTime}
              isBot={false}
              isCurrentTurn={currentTurn === playerColor}
              userId={userId}
            />
            {status === 'active' && (
              <button
                onClick={handleResign}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                Resign
              </button>
            )}
            {status === 'ended' && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                  Play Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                  Main Menu
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col lg:w-1/2">
            <MoveLog
              moveHistory={moveHistory}
              currentMoveIndex={currentMoveIndex}
              checkOutMove={checkOutMove}
              isMobile={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayOnline;