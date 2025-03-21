import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const UserInfo = ({ playerName, playerRating, capturedPieces, materialAdvantage, time, isBot, botRating }) => {
  const pieceIcons = {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="bg-gray-900 p-3 relative flex items-center text-white">
      <img
        src={isBot ? "/bot.png" : "/user.png"}
        alt={isBot ? "Bot" : "Player"}
        className="w-12 h-12 bg-white mr-3"
      />
      <div className='flex flex-col'>
        <div className='flex'>
          <h2 className="text-xl font-bold">
            {isBot ? "Bot" : playerName}
          </h2>
          <p className="text-gray-400 text-xs">
            ({isBot ? botRating : playerRating})
          </p>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap">
            {capturedPieces.map((piece, index) => (
              <span key={index} className="text-white text-xl mr-0.5">
                {pieceIcons[piece]}
              </span>
            ))}
          </div>
          {materialAdvantage !== 0 && (
            <span className={`text-green-500 text-sm ml-1`}>
              {materialAdvantage > 0 ? `+${materialAdvantage}` : `+${-materialAdvantage}`}
            </span>
          )}
        </div>
      </div>
      <div className='right-4 absolute h-8 w-20 flex justify-center items-center bg-gray-200 text-black rounded-md'>
        <ClockIcon className='h-5 w-5' />
        <span className='ml-2'>{formatTime(time)}</span>
      </div>
    </div>
  );
};

export default UserInfo;