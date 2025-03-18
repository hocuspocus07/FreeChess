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

function App() {

  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/login" element={<Login/>} />
        <Route path='/user-info' element={<UserDashboard/>}/>
        <Route path='/how-to' element={<HowToPlay/>}/>
        <Route path='/game' element={<GamePage/>}/>
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
