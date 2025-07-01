import { useState } from 'react'
import './App.css'
import Landing from './pages/Landing.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import GamePage from './pages/GamePage.jsx';
import UserProfile from './pages/UserProfile.jsx';
import HowToPlay from './pages/HowToPlay.jsx';
import PlayBot from './pages/PlayBot.jsx';
import ReplayGame from './components/ReplayGame.jsx';
import PlayOnline from './pages/PlayOnline.jsx';
import MultiPlayer from './pages/MultiPlayer.jsx';
import ChatComponent from './components/ChatComponent.jsx';
import AuthWrapper from './components/AuthWrapper.jsx';

function App() {

  return (
      <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/login" element={<Login/>} />
        <Route path='/user-info' element={<AuthWrapper><UserDashboard/></AuthWrapper>}/>
        <Route path='/how-to' element={<HowToPlay/>}/>
        <Route path='/game' element={<AuthWrapper><GamePage/></AuthWrapper>}/>
        <Route path="/user/:userId" element={<AuthWrapper><UserProfile /></AuthWrapper>} />
        <Route path="/game/:gameId" element={<AuthWrapper><GamePage /></AuthWrapper>} />
        <Route path="/play-bot" element={<AuthWrapper><PlayBot /></AuthWrapper>} />
        <Route path="/game/bot" element={<AuthWrapper><GamePage /></AuthWrapper>} />
        <Route path="/replay/:gameId" element={<AuthWrapper><ReplayGame /></AuthWrapper>} />
        <Route path='/play-online' element={<AuthWrapper><PlayOnline/></AuthWrapper>}/>
        <Route path='/multiplayer' element={<AuthWrapper><MultiPlayer/></AuthWrapper>}/>
        <Route path='/inbox' element={<AuthWrapper><ChatComponent userId={localStorage.getItem('userId')}/></AuthWrapper>}/>
      </Routes>
    </Router>
  )
}

export default App
