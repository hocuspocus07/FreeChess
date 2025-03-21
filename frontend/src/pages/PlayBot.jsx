import React, { useState } from 'react';
import { Slider, Select, MenuItem, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import NavBar from '../components/NavBar.jsx';

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
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
  
    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }
  
    if (!token) {
      alert('You are not logged in. Please log in to start a game.');
      return;
    }
  
    console.log('Token:', token);
    console.log('User ID:', userId);
  
    try {
      const decodedToken = jwtDecode(token);
      const tokenUserId = decodedToken._id; 
  
      console.log('User ID from token:', tokenUserId);
  
      if (parseInt(userId, 10) !== tokenUserId) {
        alert('User ID mismatch. Please log in again.');
        return;
      }
  
      const response = await fetch('http://localhost:8000/chess/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          player1_id: parseInt(userId, 10), 
          player2_id: -1, 
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating game:', errorData);
        throw new Error('Failed to create game');
      }
  
      const data = await response.json();
      const gameId = data.gameId;
      console.log(data);
  
      // Navigate to the game page with gameId, bot rating, and time control
      navigate(`/game/${gameId}?type=bot&rating=${botRating}&time=${timeControl}`);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to start the game. Please try again.');
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