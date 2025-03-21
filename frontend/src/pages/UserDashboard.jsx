import React,{useState,useEffect} from 'react';
import NavBar from '../components/NavBar';
import { getAllGamesByUser, getGameDetails, getUserDetails,getMoves } from '../api.js';
import {jwtDecode} from 'jwt-decode'
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import RecentMatchesTable from '../components/RecentMatchesTable.jsx';

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
  const userId = getUserIdFromToken();
  const navigate=useNavigate();

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

  const calculateWinLossRatio = () => {
    if (!recentMatches.length) return '0% Wins';
    const wins = recentMatches.filter((match) => match.result === 'Win').length;
    const ratio = ((wins / recentMatches.length) * 100).toFixed(0);
    return `${ratio}% Wins`;
  };

  const handleMatchClick = async (gameId) => {
    try {
      const movesResponse = await getMoves(gameId);
      setMoves(movesResponse);
      setCurrentMoveIndex(-1); // Reset move index
      setGame(new Chess()); // Reset the chess game
      setSelectedGame(gameId); // Set the selected game
      navigate(`/replay/${gameId}`);
    } catch (error) {
      console.error('Failed to fetch moves:', error);
      setError('Failed to fetch moves for the selected game.');
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
          userId={userId}
          onSeeAllGames={handleSeeAllGames}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Win/Loss Ratio</h2>
            <div className="h-40 bg-[#3a3a3a] rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-[#7fa650]">{calculateWinLossRatio()}</span>
            </div>
          </div>
          <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Total Games Played</h2>
            <div className="h-40 bg-[#3a3a3a] rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-[#7fa650]">{recentMatches.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}