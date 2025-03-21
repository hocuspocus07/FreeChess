import React,{useState,useEffect} from 'react';
import NavBar from '../components/NavBar.jsx';
import ChessBoard from '../components/ChessBoard.jsx';
import { useParams, useLocation } from 'react-router-dom';

function GamePage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { gameId } = useParams();

  const [gameDetails, setGameDetails] = useState(null);
  const isBotGame = queryParams.get('type') === 'bot';
  const botRating = isBotGame ? parseInt(queryParams.get('rating')) : null;
  const timeControl = isBotGame ? parseInt(queryParams.get('time')) * 60 : null;

  useEffect(() => {
    fetch(`http://localhost:8000/chess/game/${gameId}`)
        .then(response => response.json())
        .then(data => {
            if (data.game) {
                setGameDetails(data.game);
                console.log("game data:",data);
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
      />
    ) : (
      <p>Loading game details...</p>
    )}
  </>
);

}

export default GamePage;