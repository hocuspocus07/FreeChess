// UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

const UserProfile = () => {
  const { userId } = useParams(); // Get userId from the URL
  const [user, setUser] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate=useNavigate();

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

  const handleChallenge = () => {
    console.log(`Challenging user: ${user.username}`);
    // Implement challenge logic here
  };
  const handleMatchClick = (gameId) => {
    navigate(`/game/${gameId}`); // Navigate to the GameBoard page
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className='min-h-screen min-w-screen bg-[#2c2c2c]'>
        <NavBar/>
    <div className=" mx-auto shadow-lg rounded-lg mt-15 ">
      <h2 className="text-3xl font-bold text-[#7fa650] mt-15 sm:mt-0">{user.username}</h2>
      <p className="text-gray-600">Joined: {new Date(user.created_at).toLocaleDateString()}</p>

      <h3 className="text-2xl text-white font-extrabold mt-6">Recent Matches</h3>
      {recentMatches.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {recentMatches.map((match, index) => (
            <li onClick={() => handleMatchClick(match.id)} key={index} className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">{match.opponent_username}</span> -{' '}
                {match.status === 'ongoing' ? 'Ongoing' : `Result: ${match.winner_id === user.id ? 'Won' : 'Lost'}`}
              </p>
              <p className="text-sm text-gray-500">Started: {new Date(match.start_time).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex w-screen h-auto justify-center items-center flex-col">
    <p className="text-gray-600 text-2xl text-center mb-4">
      Zero games played. Are they even trying?
    </p>
    <div className="flex justify-center items-center">
      <img src="/point.png" className="h-10 w-10" alt="point" />
      <img src="/cat-laugh.png" className="h-10 w-10" alt="cat laugh" />
    </div>
  </div>
      )}

      <button
        onClick={handleChallenge}
        className="mt-6 bg-[#7fa650] text-white text-xl font-bold px-6 py-2 rounded-lg hover:bg-[#7ac96e] transition-colors"
      >
        Challenge {user.username}
      </button>
    </div>
    </div>
  );
};

export default UserProfile;