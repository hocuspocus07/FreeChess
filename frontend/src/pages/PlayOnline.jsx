import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { refreshAccessToken } from '../api.js';
import MoveLog from '../components/MoveLog.jsx';

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

  const checkOutMove = (index) => {
      const gameCopy = new Chess();
      moveHistory.slice(0, index + 1).forEach((move) => gameCopy.move(move));
      setGame(gameCopy);
      setCurrentMoveIndex(index);
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

    const handleMoveMade = ({ move, fen, currentTurn, moveHistory: serverMoveHistory }) => {
      try {
        const newGame = new Chess(fen);
        setGame(newGame);
        setCurrentTurn(currentTurn === 'w' ? 'white' : 'black');
    
        if (serverMoveHistory) {
          setMoveHistory(serverMoveHistory);
          const totalMoves = newGame.history().length;
      setCurrentMoveIndex(totalMoves - 1);
        } else {
          console.warn('No move history from server, reconstructing locally');
          const moveObj = newGame.history({ verbose: true }).pop();
          if (moveObj) {
            setMoveHistory(prev => {
              const newHistory = [...prev];
              const moveNumber = Math.ceil((newHistory.length + 1) / 2);
              
              if (moveObj.color === 'w') {
                if (newHistory.length > 0 && !newHistory[newHistory.length - 1].white) {
                  newHistory[newHistory.length - 1].white = moveObj.san;
                  newHistory[newHistory.length - 1].player = opponentId;
                  newHistory[newHistory.length - 1].color = 'white';
                } else {
                  newHistory.push({
                    number: moveNumber,
                    white: moveObj.san,
                    black: '',
                    player: opponentId,
                    color: 'white'
                  });
                }
              } else {
                if (newHistory.length > 0 && !newHistory[newHistory.length - 1].black) {
                  newHistory[newHistory.length - 1].black = moveObj.san;
                  newHistory[newHistory.length - 1].player = opponentId;
                  newHistory[newHistory.length - 1].color = 'black';
                } else {
                  newHistory.push({
                    number: moveNumber,
                    white: '',
                    black: moveObj.san,
                    player: opponentId,
                    color: 'black'
                  });
                }
              }
              
              setCurrentMoveIndex(newHistory.length - 1);
              return newHistory;
            });
          }
        }
    
        const gameState = getGameState(newGame);
        if (gameState.isGameOver) {
          const winnerId = gameState.isCheckmate 
            ? (gameState.turn === 'w' ? opponentId : userId)
            : 'draw';
          socket.emit('gameOver', { 
            gameId, 
            winnerId,
            moveHistory: serverMoveHistory || moveHistory 
          });
          setStatus('ended');
        }
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
    const initializeConnection = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const newSocket = io('http://localhost:8000', {
          auth: { token },
          reconnectionAttempts: 3,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
          console.log('Socket connected');
          setStatus('waiting');
          setShowWaitingModal(true);
          newSocket.emit('joinMatchmaking');
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

          // Initialize game
          const newGame = new Chess(initialFen);
          setGame(newGame);
          setStatus('active');
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

      const newMoveHistory = [...moveHistory];
      const moveNumber = Math.ceil((newMoveHistory.length + 1) / 2);
const totalMoves = newGame.history().length;
    setCurrentMoveIndex(totalMoves - 1);
      setGame(newGame);
      setCurrentTurn(newGame.turn());
      setMoveHistory(newMoveHistory);
    setCurrentMoveIndex(newMoveHistory.length - 1);
      
      if (move.color === 'w') {
        if (newMoveHistory.length > 0 && !newMoveHistory[newMoveHistory.length - 1].white) {
          newMoveHistory[newMoveHistory.length - 1].white = move.san;
          newMoveHistory[newMoveHistory.length - 1].player = userId;
          newMoveHistory[newMoveHistory.length - 1].color = 'white';
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
        if (newMoveHistory.length > 0 && !newMoveHistory[newMoveHistory.length - 1].black) {
          newMoveHistory[newMoveHistory.length - 1].black = move.san;
          newMoveHistory[newMoveHistory.length - 1].player = userId;
          newMoveHistory[newMoveHistory.length - 1].color = 'black';
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
      if (gameState.isGameOver) {
        console.log('GAME OVER DETECTED');
        const winnerId = gameState.isCheckmate
          ? (gameState.turn === 'w' ? opponentId : userId)
          : 'draw';

        console.log('Emitting gameOver with:', { gameId, winnerId });
        socket.emit('gameOver', { gameId, winnerId });
        setStatus('ended');
      }

      //send move to server
      socket.emit('makeMove', {
        gameId,
        move: move.san,
        moveHistory:newMoveHistory,
        fen: newGame.fen(),
      currentTurn: newGame.turn(),
      });
      if (gameState.isGameOver) {
        const winnerColor = gameState.turn === 'w' ? 'black' : 'white';
        const winnerId = winnerColor === playerColor ? userId : opponentId;
        
        console.log('Emitting gameOver with:', { gameId, winnerId });
        socket.emit('gameOver', { 
          gameId, 
          winnerId,
          moveHistory: newMoveHistory
        });
        setStatus('ended');
      }
      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  }

  useEffect(() => {
    if (!socket) return;

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
    
        const response = await fetch(`http://localhost:8000/chess/game/${gameId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            winnerId: finalWinnerId,
            status: finalWinnerId ? 'completed' : 'draw'
          })
        });
    
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to save game result');
    
        const resultMessage = finalWinnerId 
          ? (finalWinnerId === userId ? 'You won!' : 'You lost!')
          : 'Game ended in a draw!';
        
        alert(resultMessage);
      } catch (error) {
        console.error('Error ending game:', error);
      }
    };


    socket.on('gameEnded', handleGameEnd);
    socket.on('opponentResigned', () => {
      console.log('Opponent resigned event received');
      handleGameEnd({ winnerId: userId });
    });

    return () => {
      socket.off('gameEnded', handleGameEnd);
      socket.off('opponentResigned');
    };
  }, [socket, gameId, userId]);

  useEffect(() => {
    console.log('Game state updated:', getGameState(game), 'Status:', status);
  }, [game, status]);

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resignGame', { gameId });
      setStatus('ended');
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return <p className="text-gray-300 animate-pulse">Connecting to server...</p>;
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/multiplayer')}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Online Chess
          </h1>
          <div className="w-5"></div> 
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center">
            {renderStatusMessage()}
            <div className='w-full'><MoveLog isMobile={true} moveHistory={moveHistory} currentMoveIndex={currentMoveIndex} checkOutMove={checkOutMove}/></div>
            <div className="w-full max-w-md aspect-square mt-4">
              <Chessboard 
                position={game.fen()} 
                onPieceDrop={onDrop}
                boardOrientation={playerColor || 'white'}
                areArrowsAllowed={true}
                customBoardStyle={{
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                customDarkSquareStyle={{ backgroundColor: '#4b5563' }}
                customLightSquareStyle={{ backgroundColor: '#e5e7eb' }}
              />
            </div>

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

          <MoveLog 
  moveHistory={moveHistory}
  currentMoveIndex={currentMoveIndex}
  checkOutMove={checkOutMove}
/>
        </div>
      </div>
    </div>
  );
};

export default PlayOnline;