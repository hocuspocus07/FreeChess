import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { getAllGamesByUser, getGameDetails, getUserDetails, getMoves } from '../api.js';
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import RecentMatchesTable from '../components/RecentMatchesTable.jsx';
import PostGameCard from '../components/PostGameCard.jsx';
import MatchStats from '../components/MatchStats.jsx';
import Loading from '../components/Loading.jsx';
import FriendList from '../components/FriendList.jsx';
import UpdateAvatar from '../components/UpdateAvatar.jsx';
import ProfilePicMenu from '../components/ProfilePicMenu.jsx';
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
    },
    profilePic: '6.png'
  });
  const [showPicModal, setShowPicModal] = useState(false);
  const [avatarUpdateSignal, setAvatarUpdateSignal] = useState(0);
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
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
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
      if (!response || !response.user) {
        throw new Error('Invalid user data received');
      }
      setUser({
        username: response.user.username,
        dateJoined: response.user.created_at,
        rating: response.user.rating || {
          bullet: 0,
          blitz: 0,
          rapid: 0
        },
        profilePic: response.user.profilepic || '6.png'
      });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setError(error.message || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const response = await getAllGamesByUser(userId);
      const games = response?.games || [];
      if (!response || !response.games) {
        throw new Error('No games data received');
      }

      setRecentMatches(games);

      if (games.length === 0) {
        console.log('No recent matches found');
      }

    } catch (error) {
      console.error('Failed to fetch recent matches:', error);
      setError('Failed to fetch recent matches. Please try again later.');
      setRecentMatches([]); // Set to empty array on error
    }
  };

  const handleTimeControlClick = (timeControl) => {
    setSelectedTimeControl(timeControl);
  };

  const handleSeeAllGames = () => {
    setSelectedTimeControl(null); // Reset the filter
  };

  const fetchUsername = async (id) => {
    if (id === -1) return 'ChessBot';
    if (id === userId) return user.username || 'You';
    try {
      const res = await getUserDetails(id);
      return res?.user?.username || 'Opponent';
    } catch {
      return 'Opponent';
    }
  };

  const handleMatchClick = async (gameId) => {
    try {
      const [gameDetailsResponse, movesResponseRaw] = await Promise.all([
        getGameDetails(gameId),
        getMoves(gameId)
      ]);
      const gameDetails = gameDetailsResponse.game;
      if (!gameDetails) {
        throw new Error('Game details not found');
      }
      let movesResponse;
      if (Array.isArray(movesResponseRaw)) {
        movesResponse = { moves: movesResponseRaw };
      } else if (Array.isArray(movesResponseRaw?.moves)) {
        movesResponse = movesResponseRaw;
      } else {
        movesResponse = { moves: [] };
      }
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
        console.log(typeof gameDetails.winner_id, typeof userId)
        return gameDetails.winner_id === userId ? 'Win' : 'Loss';
      };

      const result = determineResult();

      // Determine win type based on game outcome
      const determineWinType = () => {
        if (gameDetails.winner_id === null) return 'Draw';
        const movesArr = movesResponse.moves;

        if (movesArr.length > 0) {
          const lastMove = movesArr[movesArr.length - 1];
          if (lastMove?.checkmate) return 'Checkmate';
          if (lastMove?.resigned) return 'Resignation';
          if (lastMove?.timeout) return 'Timeout';
          if (lastMove?.move && typeof lastMove.move === 'string' && lastMove.move.includes('#')) {
            return 'Checkmate';
          }
        }
        if (
          gameDetails.player2_id === -1 &&
          gameDetails.winner_id === gameDetails.player1_id &&
          movesArr.length > 0
        ) {
          return 'Resignation';
        }

        return 'Standard';
      };

      const isUserPlayer1 = gameDetails.player1_id === userId;

      const [player1Username, player2Username] = await Promise.all([
        fetchUsername(gameDetails.player1_id),
        fetchUsername(gameDetails.player2_id)
      ]);
      const player1Data = {
        id: gameDetails.player1_id,
        username: player1Username,
        profilePic: gameDetails.player1_id === userId ? (user.profilePic || '/6.png') : '/6.png',
        rating: gameDetails.player1_id === userId ? (user.rating?.rapid || 0) : 0,
        result: gameDetails.winner_id === null
          ? 'Draw'
          : gameDetails.winner_id === gameDetails.player1_id
            ? 'Win'
            : 'Loss'
      };

      const player2Data = {
        id: gameDetails.player2_id,
        username: player2Username,
        profilePic: gameDetails.player2_id === userId ? (user.profilePic || '/6.png') : '/6.png',
        rating: gameDetails.player2_id === userId ? (user.rating?.rapid || 0) : 0,
        result: gameDetails.winner_id === null
          ? 'Draw'
          : gameDetails.winner_id === gameDetails.player2_id
            ? 'Win'
            : 'Loss'
      };


      const gameResult = {
        gameId,
        player1: player1Data,
        player2: player2Data,
        timeControl,
        result, // This will be 'Win', 'Loss', or 'Draw' for the current user
        winType: determineWinType(),
        moves: movesResponse.moves || [],
        winnerId: gameDetails.winner_id,
        currentUserId: userId,
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
    return <Loading text='Loading' />;
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
      <NavBar avatarUpdateSignal={avatarUpdateSignal} />
      {showPostGameCard && selectedGameResult && (
        <PostGameCard
          gameResult={selectedGameResult}
          onClose={() => setShowPostGameCard(false)}
        />
      )}
      <div className="max-w-4xl mx-auto mt-11">
        <div className="bg-[#2c2c2c] rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex justify-center items-center mb-2">
            <div className='h-auto w-auto mr-2 sm:mr-4'>
              <ProfilePicMenu
                profilePic={user.profilePic}
                onView={() => setShowPicModal(true)}
                onChange={() => setShowAvatarSelector(true)}
                isOwnProfile={true}
              /></div>
            <div>
              <h1 className="text-3xl font-extrabold mb-2 text-lime-500">{user.username}</h1>
              <p className="text-gray-400">Joined on {new Date(user.dateJoined).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        {showPicModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setShowPicModal(false)}>
            <img src={`/avatar/${user.profilePic}`} alt="Profile" className="w-48 h-48 rounded-full border-4 border-lime-400 bg-white" />
          </div>
        )}
        {showAvatarSelector && (
          <UpdateAvatar
            currentAvatar={user.profilePic}
            userId={userId}
            onUpdate={(newAvatar) => {
              setUser(prev => ({ ...prev, profilePic: newAvatar }));
              setShowAvatarSelector(false);
              setAvatarUpdateSignal(s => s + 1);
            }}
          />
        )}
        <FriendList isOwnProfile={true} userId={userId} />

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