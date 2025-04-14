import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';
import ChessBoard from '../components/ChessBoard.jsx';
import { useSocket } from '../socketContext.jsx';
import { createGame } from '../api.js';

function MultiPlayer() {
    const { gameId: urlGameId } = useParams();
    const socket = useSocket();
    const navigate = useNavigate();
    const [userId, setUserId] = useState(localStorage.getItem('userId'));
    const [playerColor, setPlayerColor] = useState(null);
    const [gameReady, setGameReady] = useState(false);
    const [inputGameId, setInputGameId] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
      if (!hasJoined && socket?.connected && urlGameId) {
        socket.emit('joinGame', {
          gameId: urlGameId,
          userId: localStorage.getItem('userId')
        }, (response) => {
          if (response?.error) {
            console.error('Join game error:', response.error);
          } else {
            setHasJoined(true); // Set to true once the player joins
          }
        });
      }
    }, [urlGameId, socket, hasJoined]);
    
    useEffect(() => {
      if (!socket) return; // If socket is null or undefined, exit early
  
      // Now it's safe to subscribe to socket events
      socket.on('connect', () => {
          console.log('Connected:', socket.id);
          setConnectionStatus('connected');
      });
  
      socket.on('disconnect', (reason) => {
          console.log('Disconnected:', reason);
          setConnectionStatus('disconnected');
      });
  
      socket.on('joinGame', (data) => {
          if (socket.rooms.has(data.gameId)) {
              return; // Already in the room
          }
          socket.join(data.gameId);
          // Notify players or send initial game data
      });
  
      socket.on('connect_error', (err) => {
          console.error('Connection error:', err);
          setConnectionStatus('error');
      });
  
      socket.on('playerColor', (color) => {
          setPlayerColor(color);
      });
  
      socket.on('gameReady', () => {
          setGameReady(true);
      });
  
      socket.on('error', (err) => {
          console.error('Socket error:', err);
          if (err === 'Authentication error') {
              localStorage.removeItem('token');
              navigate('/login');
          }
      });
  
      return () => {
          // Clean up socket event listeners
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('playerColor');
          socket.off('gameReady');
          socket.off('error');
      };
  }, [socket]);
  
    

    useEffect(() => {
      if (socket?.connected && urlGameId && !gameReady) {
        // Check if already connected to the game
        socket.emit('joinGame', { 
          gameId: urlGameId,
          userId: localStorage.getItem('userId')
        }, (response) => {
          if (response?.error) {
            console.error('Join game error:', response.error);
          }
        });
      }
    }, [urlGameId, socket, gameReady]);
    

const handleCreateGame = async () => {
  try {
    const gameData = {
      player1_id: localStorage.getItem('userId'), // required by your backend
      timeControl: 300, // example: 5 minutes
      status: 'waiting',
    };

    const response = await createGame(gameData);
    const gameId = response.gameId;

    if (gameId) {
      navigate(`/game/${gameId}`);
    } else {
      console.error("No gameId returned");
    }
  } catch (error) {
    console.error("Game creation failed:", error);
  }
};

    
    

    const joinGame = () => {
        if (inputGameId) {
            navigate(`/game/${inputGameId}`);
        }
    };

    if (urlGameId) {
        return (
            <div className="game-container">
                {!gameReady ? (
                    <div className="waiting-screen">
                        <p>Waiting for opponent to join...</p>
                        <p>Your color: {playerColor || 'not assigned yet'}</p>
                    </div>
                ) : (
                    <ChessBoard 
                        isBotGame={false}
                        gameId={urlGameId}
                        userId={userId}
                        socket={socket}
                        playerColor={playerColor}
                    />
                )}
            </div>
        );
    }

    return (
        <>
            <NavBar />
            <div className="lobby">
                <h1>Chess Lobby</h1>
                <button onClick={handleCreateGame}>Create New Game</button>
                <div className="join-game">
                    <input 
                        value={inputGameId}
                        onChange={(e) => setInputGameId(e.target.value)}
                        placeholder="Enter Game ID"
                    />
                    <button onClick={joinGame}>Join Game</button>
                </div>
            </div>
        </>
    );
}

export default MultiPlayer;
