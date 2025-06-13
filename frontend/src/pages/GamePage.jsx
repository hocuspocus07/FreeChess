import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar.jsx';
import ChessBoard from '../components/ChessBoard.jsx';
import { useParams, useLocation } from 'react-router-dom';
import { getGameDetails,getUserDetails } from '../api.js';

function GamePage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { gameId } = useParams();

  const [gameDetails, setGameDetails] = useState(null);
  const [usernames, setUsernames] = useState({ player1: '', player2: '' });
  const isBotGame = queryParams.get('type') === 'bot';
  const botRating = isBotGame ? parseInt(queryParams.get('rating')) : null;
  const timeControl = isBotGame ? parseInt(queryParams.get('time')) * 60 : null;

  useEffect(() => {
    getGameDetails(gameId)
      .then(async data => {
        if (data.game) {
          setGameDetails(data.game);
          // Fetch usernames for both players
              const [user1, user2] = await Promise.all([
                getUserDetails(data.game.player1_id),
                getUserDetails(data.game.player2_id)
          ]);
          setUsernames({
            player1: user1.user?.username || 'Player 1',
            player2: user2.user?.username || 'Player 2'
          });
        }
      })
      .catch(error => console.error("Error fetching game details:", error));
  }, [gameId]);
  return (
    <>
      <NavBar />
      {gameDetails ? (
        <ChessBoard
          gameId={gameId}
          isBotGame={isBotGame}
          botRating={botRating}
          timeControl={timeControl}
          player1_id={gameDetails.player1_id}
          player2_id={gameDetails.player2_id}
          player1_username={usernames.player1}
          player2_username={usernames.player2}
        />
      ) : (
        <p>Loading game details...</p>
      )}
    </>
  );

}

export default GamePage;