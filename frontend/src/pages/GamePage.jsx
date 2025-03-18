import React from 'react'
import NavBar from '../components/NavBar.jsx'
import ChessBoard from '../components/ChessBoard.jsx'
import { useParams } from 'react-router-dom';
function GamePage() {
  const { gameId } = useParams(); // Get gameId from the URL
  const isViewOnly = true;
  return (
    <>
    <NavBar/>
    <ChessBoard gameId={gameId} isViewOnly={isViewOnly} />
    </>
  )
}

export default GamePage