import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import React, { useState } from 'react';

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [moveLog, setMoveLog] = useState([]); // To store move history
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // Track current move index

  const onDrop = (sourceSquare, targetSquare) => {
    // Only allow moves if the current state is the latest game state
    if (currentMoveIndex !== moveLog.length - 1) return false;

    // Create a copy of the current game state
    const gameCopy = new Chess(game.fen());

    // Attempt to make the move
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to a queen for simplicity
    });

    // If the move is invalid, return false
    if (move === null) return false;

    // Update the move log
    const newMoveLog = [...moveLog, move.san]; // Store move in standard algebraic notation (SAN)
    setMoveLog(newMoveLog);
    setCurrentMoveIndex(newMoveLog.length - 1); // Update current move index

    // Update the game state with the new position
    setGame(gameCopy);
    return true;
  };

  // Navigate to previous move
  const goToPreviousMove = () => {
    if (currentMoveIndex >= 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      const gameCopy = new Chess();
      moveLog.slice(0, currentMoveIndex).forEach((move) => gameCopy.move(move));
      setGame(gameCopy);
    }
  };

  // Navigate to next move
  const goToNextMove = () => {
    if (currentMoveIndex < moveLog.length - 1) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      const gameCopy = new Chess();
      moveLog.slice(0, currentMoveIndex + 2).forEach((move) => gameCopy.move(move));
      setGame(gameCopy);
    }
  };

  // Format move log in pairs (e.g., "1. e4 e5")
  const formatMoveLog = () => {
    const formattedMoves = [];
    for (let i = 0; i < moveLog.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveLog[i];
      const blackMove = moveLog[i + 1] || ''; // Handle odd number of moves
      formattedMoves.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    }
    return formattedMoves;
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden bg-[#2c2c2c] p-4">
      <div className="flex flex-col h-full justify-center items-center lg:flex-row w-full gap-6">
        {/* Left Section: Chessboard and Player Data */}
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col">
          {/* Player 1 Info (Top) */}
          <div className="bg-gray-900 rounded-lg mb-3 flex text-white">
            <img
              src="user.png" // Replace with actual profile picture
              alt="Player 1"
              className="w-12 h-12 bg-white mr-3"
            />
            <h2 className="text-xl font-bold">Player 1</h2>
            <p className="text-gray-400 text-xs ml-1">(1500)</p>
          </div>

          {/* Chessboard */}
          <div className="sm:h-96 sm:w-96 lg:w-96 lg:h-96 md:w-96 md:h-96">
            <Chessboard
              position={game.fen()}
              onPieceDrop={currentMoveIndex === moveLog.length - 1 ? onDrop : undefined} // Disable moves if not in latest state
            />
          </div>

          {/* Player 2 Info (Bottom) */}
          <div className="bg-gray-900 rounded-lg mt-3 flex text-white">
            <img
              src="user.png"
              alt="Player 2"
              className="w-12 h-12 bg-white mr-3"
            />
            <h2 className="text-xl font-bold">Player 2</h2>
            <p className="text-gray-400 text-xs ml-1">(1600)</p>
          </div>
        </div>

        {/* Right Section: Move Log and Navigation Buttons */}
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col text-white w-80">
          <h3 className="text-lg font-bold mb-4">Move Log</h3>
          <div className="overflow-y-auto bg-gray-500 p-2 rounded mb-4">
            {formatMoveLog().map((move, index) => (
              <div key={index} className="bg-[#3a3a3a] p-2 rounded mb-2">
                <span className="text-white">{move}</span>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={goToPreviousMove}
              disabled={currentMoveIndex < 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={goToNextMove}
              disabled={currentMoveIndex >= moveLog.length - 1}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;