import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getMoves } from '../api.js';
import NavBar from './NavBar.jsx';
import MoveLog from './MoveLog.jsx';
import UserInfo from './UserInfo.jsx'; 
import { BackwardIcon, ForwardIcon } from '@heroicons/react/24/outline';

const ReplayGame = () => {
  const { gameId } = useParams();
  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [game, setGame] = useState(new Chess());
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] }); // Track captured pieces
  const [materialAdvantage, setMaterialAdvantage] = useState(0); // Track material advantage

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const movesResponse = await getMoves(gameId);
        setMoves(movesResponse);
        setCurrentMoveIndex(-1);
        setGame(new Chess());
      } catch (error) {
        console.error('Failed to fetch moves:', error);
      }
    };

    fetchMoves();
  }, [gameId]);

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      replayMoves(newIndex);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < moves.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      replayMoves(newIndex);
    }
  };

  const replayMoves = (index) => {
    const gameCopy = new Chess();
    const updatedCapturedPieces = { white: [], black: [] };
    let materialAdvantage = 0;

    for (let i = 0; i <= index; i++) {
      const move = gameCopy.move(moves[i].move);
      if (move.captured) {
        const capturedPiece = move.captured.toLowerCase();
        if (move.color === 'w') {
          updatedCapturedPieces.black.push(capturedPiece);
          materialAdvantage += getPieceValue(capturedPiece);
        } else {
          updatedCapturedPieces.white.push(capturedPiece);
          materialAdvantage -= getPieceValue(capturedPiece);
        }
      }
    }

    setCapturedPieces(updatedCapturedPieces);
    setMaterialAdvantage(materialAdvantage);
    setGame(gameCopy);
  };

  const checkOutMove = (index) => {
    setCurrentMoveIndex(index);
    replayMoves(index);
  };

  const getPieceValue = (piece) => {
    switch (piece) {
      case 'p': return 1;
      case 'n': return 3;
      case 'b': return 3;
      case 'r': return 5;
      case 'q': return 9;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-9 p-6 bg-[#2c2c2c] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Replay Game</h2>
        <div className="flex flex-col lg:flex-row gap-6 bg-gray-900 p-5 rounded-lg">
          <div className="flex justify-center flex-col sm:w-1/2 sm:h-auto">
            <div className='w-full overflow-y-scroll'>
              <MoveLog
                moveLog={moves.map((move) => move.move)} // Pass the move log as an array of moves
                currentMoveIndex={currentMoveIndex}
                checkOutMove={checkOutMove}
                isMobile={true} 
              />
            </div>

            <UserInfo
              playerName="Player 1"
              playerRating="1600"
              capturedPieces={capturedPieces.white}
              materialAdvantage={materialAdvantage < 0 ? -materialAdvantage : 0}
              isBot={false}
            />

            <Chessboard
              position={game.fen()}
              arePiecesDraggable={false}
            />

            <UserInfo
              playerName="Player 2"
              playerRating="1600"
              capturedPieces={capturedPieces.black}
              materialAdvantage={materialAdvantage > 0 ? materialAdvantage : 0}
              isBot={false} 
            />
          </div>

          <div className="flex flex-col lg:w-1/2">
            <MoveLog
              moveLog={moves.map((move) => move.move)} 
              currentMoveIndex={currentMoveIndex}
              checkOutMove={checkOutMove}
              isMobile={false} 
            />
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
                        onClick={goToPreviousMove}
                        disabled={currentMoveIndex < 0}
                        className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        <BackwardIcon className='h-6 w-6' />
                      </button>
                      <button
                        onClick={goToNextMove}
                        disabled={currentMoveIndex >= moves.length - 1}
                        className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        <ForwardIcon className='h-6 w-6' />
                      </button>
        </div>
      </div>
    </div>
  );
};

export default ReplayGame;