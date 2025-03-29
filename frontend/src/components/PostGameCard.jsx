import React from 'react';
import { useNavigate } from 'react-router-dom';

function PostGameCard({ gameResult }) {
  const navigate=useNavigate();
  const closeGameCard=async()=>{
    navigate('/play-bot');
  }
  const { player1, player2, timeControl, result, winType } = gameResult;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2c2c] rounded-lg shadow-lg p-6 max-w-md w-full text-white">
        <h2 className="text-2xl font-bold text-center mb-4">Game Result</h2>

        {/* Player vs Player Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img
              src={player1.profilePic || "user.png"} // Fallback to a default image if no profile picture is provided
              alt={player1.username}
              className="w-12 h-12 rounded-full mr-3"
            />
            <span className="text-lg font-semibold">{player1.username}</span>
          </div>
          <span className="text-xl mx-4">vs</span>
          <div className="flex items-center">
            <img
              src={player2.profilePic || "default-pfp.png"} // Fallback to a default image if no profile picture is provided
              alt={player2.username}
              className="w-12 h-12 rounded-full mr-3"
            />
            <span className="text-lg font-semibold">{player2.username}</span>
          </div>
        </div>

        {/* Game Details Section */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Time Control:</span>
            <span className="font-semibold">{timeControl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Result:</span>
            <span
              className={`font-semibold ${
                result === "Win"
                  ? "text-[#7fa650]"
                  : result === "Loss"
                  ? "text-[#dc3545]"
                  : "text-[#ffc107]"
              }`}
            >
              {result}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Win Type:</span>
            <span className="font-semibold capitalize">{winType}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          className="mt-6 w-full bg-[#7fa650] text-white py-2 rounded-lg hover:bg-[#8cf906] transition-all duration-300"
          onClick={closeGameCard}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default PostGameCard;