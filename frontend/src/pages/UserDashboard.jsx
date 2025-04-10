import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { getAllGamesByUser, getGameDetails, getUserDetails, getMoves } from '../api.js';
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import RecentMatchesTable from '../components/RecentMatchesTable.jsx';
import PostGameCard from '../components/PostGameCard.jsx';
import MatchStats from '../components/MatchStats.jsx';

const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded._id;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export default function UserDashboard() {
  const [user, setUser] = useState({
    username: '',
    dateJoined: '',
    rating: {
      bullet: 0,
      blitz: 0,
      rapid: 0
    }
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [game, setGame] = useState(new Chess());
  const [selectedTimeControl, setSelectedTimeControl] = useState(null);
  const [showPostGameCard, setShowPostGameCard] = useState(false);
  const [selectedGameResult, setSelectedGameResult] = useState(null);
  const userId = getUserIdFromToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    fetchUserDetails();
    fetchRecentMatches();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await getUserDetails(userId);
      console.log(response);
      setUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setError('Failed to fetch user details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const response = await getAllGamesByUser(userId);
      setRecentMatches(response.games);
    } catch (error) {
      console.error('Failed to fetch recent matches:', error);
      setError('Failed to fetch recent matches. Please try again later.');
    }
  };

  const handleTimeControlClick = (timeControl) => {
    setSelectedTimeControl(timeControl);
  };

  const handleSeeAllGames = () => {
    setSelectedTimeControl(null); // Reset the filter
  };

  const handleMatchClick = async (gameId) => {
    try {
      const [gameDetails, movesResponse] = await Promise.all([
        getGameDetails(gameId),
        getMoves(gameId)
      ]);
  
      console.log('Game details:', gameDetails);
  
      // Calculate time control from game duration
      const timeControl = (() => {
        const duration = (new Date(gameDetails.end_time) - new Date(gameDetails.start_time)) / 1000;
        if (duration < 180) return 'Bullet';
        if (duration <= 600) return 'Blitz';
        return 'Rapid';
      })();
  
      // Determine actual result based on status and winner_id
      const determineResult = () => {
        if (gameDetails.status === 'draw') return 'Draw';
        if (gameDetails.winner_id === null) return 'Draw';
        console.log(typeof gameDetails.winner_id,typeof userId)
        return gameDetails.winner_id === userId ? 'Win' : 'Loss';
      };
  
      const result = determineResult();
  
      // Determine win type based on game outcome
      const determineWinType = () => {
        if (result === 'Draw') return 'Draw';
        if (!gameDetails.moves?.length) return 'Standard';
        // Add logic here to detect checkmate, timeout, etc. if available
        return 'Standard'; // Default if no specific win type detected
      };
  
      const player1Data = {
        id: userId,
        username: user.username || 'You',
        profilePic: user.profilePic || '/default-user.png',
        rating: user.rating?.rapid || 0,
        result: result
      };
  
      const player2Data = gameDetails.player2_id === -1 ? {
        id: -1,
        username: 'ChessBot',
        profilePic: '/bot-icon.png',
        rating: 1200,
        result: result === 'Win' ? 'Loss' : result === 'Loss' ? 'Win' : 'Draw'
      } : {
        id: gameDetails.player2_id,
        username: gameDetails.opponent_username || 'Opponent',
        profilePic: '/default-user.png',
        rating: 0,
        result: result === 'Win' ? 'Loss' : result === 'Loss' ? 'Win' : 'Draw'
      };
  
      const gameResult = {
        gameId,
        player1: player1Data,
        player2: player2Data,
        timeControl,
        result, // This will be 'Win', 'Loss', or 'Draw'
        winType: determineWinType(),
        moves: movesResponse.moves || [],
        winnerId: gameDetails.winner_id
      };
  
      console.log('Processed game result:', gameResult);
  
      setSelectedGameResult(gameResult);
      setMoves(movesResponse.moves || []);
      setCurrentMoveIndex(-1);
      setGame(new Chess());
      setSelectedGame(gameId);
      setShowPostGameCard(true);
  
    } catch (error) {
      console.error('Failed to load game details:', error);
      setError('Failed to load game details. Please try again.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
        <NavBar />
        <div className="max-w-4xl mx-auto mt-9 p-6 bg-[#2c2c2c] rounded-lg shadow-lg">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <NavBar />
      {showPostGameCard && selectedGameResult && (
        <PostGameCard
          gameResult={selectedGameResult}
          onClose={() => setShowPostGameCard(false)}
        />
      )}
      <div className="max-w-4xl mx-auto mt-9">
        <div className="bg-[#2c2c2c] rounded-lg p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-extrabold mb-2">Welcome, {user.username}</h1>
          <p className="text-gray-400">Joined on {new Date(user.created_at).toLocaleDateString()}</p>
        </div>


        <RecentMatchesTable
          matches={recentMatches}
          selectedTimeControl={selectedTimeControl}
          onTimeControlClick={handleTimeControlClick}
          onMatchClick={handleMatchClick}
          profileUserId={userId}
          onSeeAllGames={handleSeeAllGames}
        />

        <MatchStats recentMatches={recentMatches} userId={userId} />
      </div>
    </div>
  );
}