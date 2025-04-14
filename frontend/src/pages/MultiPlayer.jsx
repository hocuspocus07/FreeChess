import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { refreshAccessToken } from '../api.js';

const MultiPlayer = () => {
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


  // Initialize socket connection and game
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
          
          newSocket.emit('joinGame', { gameId });
        });

        newSocket.on('gameReady', ({ gameId, isWhite, opponentId, initialFen }) => {
          console.log('Game ready:', gameId);
          setGameId(gameId);
          setPlayerColor(isWhite ? 'white' : 'black');
          
          // Initialize game with correct position
          const newGame = new Chess(initialFen);
          setGame(newGame);
          setStatus('active');
        });

        newSocket.on('moveMade', ({ move, fen, currentTurn }) => {
      console.log('Received move:', move);
      try {
        const newGame = new Chess(fen);
        setGame(newGame);
        setCurrentTurn(currentTurn);
      } catch (error) {
        console.error('Error updating game:', error);
      }
    });

        newSocket.on('invalidMove', ({ message }) => {
          console.log('Invalid move:', message);
        });

        newSocket.on('gameEnded', ({ winnerId }) => {
          setStatus('ended');
          alert(winnerId === userId ? 'You won!' : 'You lost!');
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

  // Handle piece drops (player moves)
  function onDrop(sourceSquare, targetSquare) {
    if (status !== 'active' || !playerColor) return false;
    
    const isCorrectTurn = (playerColor === 'white' && currentTurn === 'white') || 
                         (playerColor === 'black' && currentTurn === 'black');
    
    if (!isCorrectTurn) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (!move) return false;

      // Optimistic update
      const newGame = new Chess(game.fen());
      setGame(newGame);
      setCurrentTurn(newGame.turn() === 'w' ? 'white' : 'black');

      // Send move to server
      socket.emit('makeMove', {
        gameId,
        move: move.san
      });

      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  }


  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resignGame', { gameId });
      setStatus('ended');
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return <p className="status-message">Connecting to server...</p>;
      case 'waiting':
        return (
          <div className="status-message">
            <p>Waiting for opponent...</p>
            {gameId && <p>Game ID: {gameId}</p>}
          </div>
        );
      case 'active':
        return (
          <div className="game-info">
            <p>You are playing as <strong>{playerColor}</strong></p>
            <p>Current turn: <strong>{currentTurn}</strong></p>
            {opponentId && <p>Opponent: User #{opponentId}</p>}
          </div>
        );
      case 'ended':
        return <p className="status-message">Game ended</p>;
      default:
        return null;
    }
  };

  return (
    <div className="multiplayer-container">
      <h2>Multiplayer Chess</h2>
      
      {renderStatusMessage()}

      <div className="chessboard-container">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          boardOrientation={playerColor || 'white'}
          areArrowsAllowed={true}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>

      {status === 'active' && (
        <button 
          onClick={handleResign}
          className="resign-button"
        >
          Resign
        </button>
      )}

      {status === 'ended' && (
        <div className="game-end-buttons">
          <button 
            onClick={() => window.location.reload()}
            className="play-again-button"
          >
            Play Again
          </button>
          <button 
            onClick={() => navigate('/')}
            className="main-menu-button"
          >
            Main Menu
          </button>
        </div>
      )}

      <style jsx>{`
        .multiplayer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .status-message, .game-info {
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
          width: 100%;
        }
        
        .chessboard-container {
          width: 500px;
          max-width: 100%;
          margin: 20px 0;
        }
        
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
          transition: all 0.3s ease;
        }
        
        .resign-button {
          background: #ff4d4d;
          color: white;
        }
        
        .play-again-button {
          background: #4CAF50;
          color: white;
        }
        
        .main-menu-button {
          background: #2196F3;
          color: white;
        }
        
        button:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        
        .game-end-buttons {
          display: flex;
          justify-content: center;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default MultiPlayer;