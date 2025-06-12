import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import RecentMatchesTable from '../components/RecentMatchesTable.jsx';
import MatchStats from '../components/MatchStats.jsx';
import FriendList from '../components/FriendList.jsx';
import { sendFriendRequest, getFriendshipStatus } from '../api.js';
import PostGameCard from '../components/PostGameCard.jsx';
import { getGameDetails, getMoves, getUserDetails,getAllGamesByUser } from '../api.js';
import { Chess } from 'chess.js'; 
import ProfilePicMenu from '../components/ProfilePicMenu.jsx';
import Loading from '../components/Loading.jsx';
const UserProfile = () => {
  const { userId } = useParams(); // Get userId from the URL
  const [user, setUser] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeControl, setSelectedTimeControl] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendRequestError, setFriendRequestError] = useState('');
  const signedInUserId = localStorage.getItem('userId');
  const [friendshipStatus, setFriendshipStatus] = useState('loading');
const [showPostGameCard, setShowPostGameCard] = useState(false);
  const [selectedGameResult, setSelectedGameResult] = useState(null);
  const [moves, setMoves] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [game, setGame] = useState(new Chess());
      const [selectedGame, setSelectedGame] = useState(null);
      const [showPicModal, setShowPicModal] = useState(false);
  
  useEffect(() => {
    if (userId !== signedInUserId) {
      getFriendshipStatus(userId).then(setFriendshipStatus);
    }
  }, [userId, signedInUserId]);

  const handleAddFriend = async () => {
    try {
      await sendFriendRequest(user.id);
      setFriendRequestSent(true);
      setFriendRequestError('');
      setFriendshipStatus('pending');
    } catch (err) {
      setFriendRequestError(err.message || 'Failed to send friend request');
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await getUserDetails(userId);
        setUser(userResponse.user);

        const matchesResponse = await getAllGamesByUser(userId);
        setRecentMatches(matchesResponse.games || []);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleTimeControlClick = (timeControl) => {
    setSelectedTimeControl(timeControl);
  };

  const handleSeeAllGames = () => {
    setSelectedTimeControl(null); // Reset the filter
  };

  const handleChallenge = () => {
    console.log(`Challenging user: ${user.username}`);
    // Implement challenge logic here
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
        console.log('Game details:', gameDetails);
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
          console.log(typeof gameDetails.winner_id,typeof userId)
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
  
            const [player1Username, player2Username,player1Pic,player2Pic] = await Promise.all([
        fetchUsername(gameDetails.player1_id),
        fetchUsername(gameDetails.player2_id),
        fetchProfilePic(gameDetails.player1_id),
      fetchProfilePic(gameDetails.player2_id),
      ]);
        const player1Data = {
        id: gameDetails.player1_id,
        username: player1Username,
        profilePic: player1Pic,
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
        profilePic: player2Pic,
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

    const fetchProfilePic = async (id) => {
  if (id === -1) return '6.png'; // Bot or default
  try {
    const res = await getUserDetails(id);
    return res?.user?.profilepic || '6.png';
  } catch {
    return '6.png';
  }
};

  if (loading) return <Loading text="Loading"/>
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className='min-h-screen min-w-screen bg-[#2c2c2c]'>
      <NavBar />
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
              profilePic={user.profilepic}
              onView={() => setShowPicModal(true)}
              onChange={() => setShowAvatarSelector(true)}
              isOwnProfile={false}
            /></div>
            <div>
          <h1 className="text-3xl font-extrabold mb-2 text-lime-500">{user.username}</h1>
          <p className="text-gray-400">Joined on {new Date(user.created_at).toLocaleDateString()}</p></div>
          </div>
          {showPicModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setShowPicModal(false)}>
            <img src={`/avatar/${user.profilepic}`} alt="Profile" className="w-48 h-48 rounded-full border-4 border-lime-400 bg-white" />
          </div>
        )}
          <FriendList isOwnProfile={userId === signedInUserId} userId={userId} />
          {userId !== signedInUserId && (
            <>
              {friendshipStatus === 'none' && (
                <button className='bg-lime-500 text-white font-bold text-sm rounded-lg p-1' onClick={handleAddFriend}>Add Friend</button>
              )}
              {friendshipStatus === 'pending' && (
                <button className='bg-lime-300 text-white font-light text-sm p-1 rounded-lg' disabled>Request Sent</button>
              )}
              {friendshipStatus === 'accepted' && (
                <span className="text-green-500 font-bold"> You're friends with {user.username}</span>
              )}
              {friendRequestError && <div className="text-red-400">{friendRequestError}</div>}
            </>
          )}
        </div>
        <RecentMatchesTable
          matches={recentMatches}
          selectedTimeControl={selectedTimeControl}
          onTimeControlClick={handleTimeControlClick}
          onMatchClick={handleMatchClick}
          onSeeAllGames={handleSeeAllGames}
          profileUserId={userId}
        />
        <MatchStats recentMatches={recentMatches} userId={userId} />
      </div>
    </div>
  );
};

export default UserProfile;