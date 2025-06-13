import React, { useState } from 'react';
import { Slider, Select, MenuItem, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import NavBar from '../components/NavBar.jsx';
import { refreshAccessToken, createGame } from '../api.js';

const PlayBot = () => {
  const TIME_CONTROLS = {
    '1min': 60,
    '3min': 180,
    '10min': 600
  };
  const [selectedTimeControl, setSelectedTimeControl] = useState('3min');
  const [botRating, setBotRating] = useState(1500);
  const [timeControl, setTimeControl] = useState(3);
  const navigate = useNavigate();

  // Handle bot rating change
  const handleRatingChange = (event, newValue) => {
    setBotRating(newValue);
  };

  // Handle time control change
  const handleTimeControlChange = (event) => {
    setTimeControl(event.target.value);
  };

  const handleStartGame = async () => {
    try {
      let token = localStorage.getItem('token');

      // Verify token is still valid
      try {
        jwtDecode(token);
      } catch (decodeError) {
        console.log('Token invalid, attempting refresh...');
        token = await refreshAccessToken();
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken._id;

      const data = await createGame({
        player1_id: userId,
        player2_id: -1,
        time_control: TIME_CONTROLS[selectedTimeControl]
      });

      if (data.message === 'TOKEN EXPIRED') {
        token = await refreshAccessToken();
        return handleStartGame(); // Retry with new token
      }
      if (!data.gameId) {
        throw new Error(data.message || 'Failed to create game');
      }
      navigate(`/game/${data.gameId}?type=bot&rating=${botRating}&time=${timeControl}`);
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('401') || error.message.includes('TOKEN')) {
        // Redirect to login if token issues persist
        window.location.href = '/login';
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <NavBar />
      <div className="max-w-4xl mx-auto p-5">
        <h1 className="text-3xl font-bold mb-6 mt-11">Play a Bot</h1>

        <div className="bg-[#2c2c2c] rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-white">Set Bot Rating</h2>
          <div className="flex items-center">
            <span className="mr-4 text-lime-500">Rating: {botRating}</span>
            <Slider
              value={botRating}
              onChange={handleRatingChange}
              min={250}
              max={2500}
              step={100}
              valueLabelDisplay="auto"
              className="text-[#7fa650]"
            />
          </div>
        </div>

        {/* Time Control Dropdown */}
        <div className="bg-[#2c2c2c] rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Time Control</h2>
          <div className="flex space-x-4">
            {Object.keys(TIME_CONTROLS).map((control) => (
              <button
                key={control}
                onClick={() => setSelectedTimeControl(control)}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedTimeControl === control
                    ? 'bg-[#7fa650] text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                {control}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <div className="text-center">
          <Button
            onClick={handleStartGame}
            className="bg-[#7fa650] text-white px-6 py-2 rounded-lg hover:bg-[#8cf906] transition-colors"
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayBot;