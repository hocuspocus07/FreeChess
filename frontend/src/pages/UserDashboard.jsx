import React,{useState,useEffect} from 'react';
import NavBar from '../components/NavBar';
import { addCircleOutline, flashOutline, locateOutline, playForwardCircleOutline, removeCircleOutline, reorderTwoOutline, } from 'ionicons/icons';
import { IonIcon } from '@ionic/react'; 
import { getAllGamesByUser, getGameDetails, getUserDetails,getMoves } from '../api.js';
import {jwtDecode} from 'jwt-decode'
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';

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

const resultList = {
  Win: <IonIcon icon={addCircleOutline} />,
  Loss: <IonIcon icon={removeCircleOutline} />,
  Draw: <IonIcon icon={reorderTwoOutline} />, 
};

const timeControlType = [
    { bullet: <IonIcon icon={playForwardCircleOutline} />, color: 'bg-red-600' },
    { blitz: <IonIcon icon={flashOutline} />, color: 'bg-yellow-500' },
    { rapid: <IonIcon icon={locateOutline} />, color: 'bg-lime-500' },
  ];
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

  const getTimeControl = (match) => {
    const startTime = new Date(match.start_time).getTime();
    const endTime = new Date(match.end_time).getTime();
    const durationInSeconds = (endTime - startTime) / 1000;

    if (durationInSeconds < 180) return 'bullet';
    if (durationInSeconds >= 180 && durationInSeconds <= 600) return 'blitz';
    return 'rapid';
  };

  const filteredMatches = selectedTimeControl
    ? recentMatches.filter((match) => getTimeControl(match) === selectedTimeControl)
    : recentMatches;

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

        <div className="flex max-w-4xl h-40 bg-[#1a1a1a] p-4">
          {timeControlType.map((control, index) => {
            const timeControl = Object.keys(control)[0];
            const icon = control[timeControl];
            const color = control.color;

            return (
              <div
                key={index}
                onClick={() => handleTimeControlClick(timeControl)}
                className={`flex-1 flex flex-col items-center justify-center ${color} rounded-lg m-2 shadow-lg hover:brightness-90 transition-all duration-300 cursor-pointer`}
              >
                <div className="text-4xl mb-2 text-white">{icon}</div>
                <div className="text-xl font-bold capitalize text-white">{timeControl}</div>
              </div>
            );
          })}
        </div>

        {selectedTimeControl && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSeeAllGames}
              className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] transition-all duration-300"
            >
              See All Games
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 mx-auto">
  {user.rating && Object.entries(user.rating).map(([timeControl, rating]) => {
    const timeControlData = timeControlType.find((item) => item[timeControl]);
    const icon = timeControlData ? timeControlData[timeControl] : null;
    const color = timeControlData ? timeControlData.color : 'bg-gray-500';

    return (
      <div
        key={timeControl}
        className="bg-[#2c2c2c] h-40 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <div className={`mx-auto text-center w-10 rounded-xl text-4xl ${color}`}>
          {icon} 
        </div>
        <h2 className="text-xl font-bold mb-2 capitalize text-center">{timeControl} Rating</h2>
        <p className="text-3xl text-[#7fa650] text-center">{rating}</p>
      </div>
    );
  })}
</div>

        <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-center text-gray-400">Opponent</th>
                  <th className="px-4 py-3 text-center text-gray-400">Result</th>
                  <th className="px-4 py-3 text-center text-gray-400">Time Control</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match, index) => {
                  const result = match.winner_id === userId ? 'Win' : match.winner_id === -1 ? 'Draw' : 'Loss';
                  const timeControl = getTimeControl(match);
                  const timeControlData = timeControlType.find((item) => item[timeControl]);
                  const timeControlIcon = timeControlData ? timeControlData[timeControl] : null;
                  const timeControlColor = timeControlData ? timeControlData.color : 'bg-gray-500';

                  return (
                    <tr
                      key={index}
                      onClick={() => handleMatchClick(match.id)}
                      className="border-b border-gray-700 hover:bg-[#3a3a3a] transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-center">{match.opponent_username}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xl font-extrabold ${
                            result === 'Win'
                              ? 'bg-[#7fa650] text-white'
                              : result === 'Loss'
                              ? 'bg-[#dc3545] text-white'
                              : 'bg-[#ffc107] text-black'
                          }`}
                        >
                          {resultList[result]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 text-xl font-extrabold rounded-full ${timeControlColor}`}
                        >
                          {timeControlIcon}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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