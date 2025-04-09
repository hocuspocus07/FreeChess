// UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import RecentMatchesTable from '../components/RecentMatchesTable.jsx';
import MatchStats from '../components/MatchStats.jsx';

const UserProfile = () => {
  const { userId } = useParams(); // Get userId from the URL
  const [user, setUser] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeControl, setSelectedTimeControl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user details
        const userResponse = await fetch(`http://localhost:8000/chess/users/${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user details');
        const userData = await userResponse.json();
        setUser(userData.user);

        // Fetch recent matches
        const matchesResponse = await fetch(`http://localhost:8000/chess/game/user/${userId}`);
        if (matchesResponse.status === 404) {
          // Handle 404 as "no games found"
          setRecentMatches([]);
        } else if (!matchesResponse.ok) {
          throw new Error('Failed to fetch recent matches');
        } else {
          const matchesData = await matchesResponse.json();
          setRecentMatches(matchesData.games || []); // Ensure it's an array even if games is undefined
        }

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
  const handleMatchClick = (gameId) => {
    try {
      navigate(`/replay/${gameId}`);
    } catch (error) {
      console.error('Failed to navigate to replay page:', error);
      setError('Failed to navigate to replay page.');
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className='min-h-screen min-w-screen bg-[#2c2c2c]'>
      <NavBar />
      <div className="max-w-4xl mx-auto mt-9">
        <div className="bg-[#2c2c2c] rounded-lg p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-extrabold mb-2 text-lime-500">{user.username}</h1>
          <p className="text-gray-400">Joined on {new Date(user.created_at).toLocaleDateString()}</p>
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