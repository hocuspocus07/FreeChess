import React, { useState } from 'react';
import { Slider, Select, MenuItem, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import NavBar from '../components/NavBar.jsx';
import { refreshAccessToken } from '../api.js';

const PlayBot = () => {
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
  
      const response = await fetch('http://localhost:8000/chess/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          player1_id: userId,
          player2_id: -1,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === 'TOKEN EXPIRED') {
          token = await refreshAccessToken();
          return handleStartGame(); // Retry with new token
        }
        throw new Error(errorData.message || 'Failed to create game');
      }
  
      const data = await response.json();
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
      <NavBar/>
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
          <Select
            value={timeControl}
            onChange={handleTimeControlChange}
            className="w-full bg-lime-500 text-white"
          >
            <MenuItem value={1}>1 Minute</MenuItem>
            <MenuItem value={3}>3 Minutes</MenuItem>
            <MenuItem value={10}>10 Minutes</MenuItem>
          </Select>
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