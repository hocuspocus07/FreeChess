import React from 'react';
import { useNavigate } from 'react-router-dom';

function PostGameCard({ gameResult, onClose }) {
  const navigate = useNavigate();
  // Destructure with sensible defaults
  const {
    player1 = { username: 'Player 1', profilePic: '6.png', id: null },
    player2 = { username: 'Player 2', profilePic: '6.png', id: null },
    timeControl = 'Unknown',
    result = 'Unknown',
    winType = '',
    gameId,
    winnerId,
    currentUserId, 
  } = gameResult || {};

  if (!gameId) {
    console.error("Game ID is missing in gameResult:", gameResult);
    return null;
  }

  let player1Result = '';
  let player2Result = '';
  if (winnerId === null || winnerId === undefined) {
    player1Result = player2Result = 'Draw';
  } else if (winnerId === player1.id) {
    player1Result = 'Win';
    player2Result = 'Loss';
  } else if (winnerId === player2.id) {
    player1Result = 'Loss';
    player2Result = 'Win';
  } else {
    player1Result = player2Result = 'Unknown';
  }

  const displayName = (player) =>
    currentUserId && player.id === currentUserId
      ? `${player.username} (You)`
      : player.username;

  const navigateToReplay = () => {
    onClose();
    navigate(`/replay/${gameId}`);
  };

  const navigateToAnalysis = () => {
    onClose();
    navigate(`/replay/${gameId}?analysis=true`);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2c2c] rounded-lg shadow-lg p-6 max-w-md w-full text-white relative">
        <div className='absolute top-4 right-6 h-10 w-auto text-white font-light hover:font-medium hover:cursor-pointer hover:text-lime-500' onClick={onClose}>✕</div>
        <h2 className="text-2xl font-bold text-center mb-4">Game Result</h2>

        {/* Player vs Player Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img
              src={
    player1.profilePic
      ? `/avatar/${player1.profilePic}`
      : player1.avatar
        ? `/avatar/${player1.avatar}`
        : "/avatar/6.png"
  }
              alt={player1.username}
              className="w-12 h-12 rounded-full mr-3"
            />
              <span className="text-lg font-semibold">{displayName(player1)}</span>
          </div>
          <span className="text-xl mx-4">vs</span>
          <div className="flex items-center">
            <img
              src={
    player2.profilePic
      ? `/avatar/${player2.profilePic}`
      : player2.avatar
        ? `/avatar/${player2.avatar}`
        : "/avatar/6.png"
  }
              alt={player2.username}
              className="w-12 h-12 rounded-full mr-3"
            />
              <span className="text-lg font-semibold">{displayName(player2)}</span>
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
                winnerId === null || winnerId === undefined
                  ? "text-[#ffc107]"
                  : winnerId === player1.id
                  ? "text-[#7fa650]"
                  : "text-[#dc3545]"
              }`}
            >
              {winnerId === null || winnerId === undefined
                ? "Draw"
                : winnerId === player1.id
                ? `${displayName(player1)} wins`
                : `${displayName(player2)} wins`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Win Type:</span>
            <span className="font-semibold capitalize">{winType || '—'}</span>
          </div>
        </div>

        <button
          className="mt-6 w-full bg-[#7fa650] text-white py-2 rounded-lg hover:bg-[#8cf906] transition-all duration-300"
          onClick={navigateToReplay}
        >
          Replay Game
        </button>

        <button
          className="mt-2 w-full bg-[#7fa650] text-white py-2 rounded-lg hover:bg-[#8cf906] transition-all duration-300"
          onClick={navigateToAnalysis}
        >
          Analyse Game
        </button>
      </div>
    </div>
  );
}

export default PostGameCard;