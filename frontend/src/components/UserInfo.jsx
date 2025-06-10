import React,{useEffect,useState} from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { getUserProfilePic } from '../api.js';
const UserInfo = ({ 
  playerName, 
  playerRating, 
  timeRemaining,  // Changed from 'time' to 'timeRemaining' (in milliseconds)
  isBot, 
  botRating,
  isTopPlayer,
  isCurrentTurn,
  userId
}) => {

   const [profilePic, setProfilePic] = useState("/avatar/6.png");

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!isBot && userId) { 
        try {
          const pic = await getUserProfilePic(userId);
          setProfilePic(pic ? `/avatar/${pic}` : "/avatar/6.png");
        } catch (error) {
          console.error("Error fetching profile picture:", error);
          setProfilePic("/avatar/6.png");
        }
      }
    };

    fetchProfilePic();
  }, [userId, isBot]);

  const formatTime = (seconds) => {
  if (seconds === undefined || seconds === null) return '--:--';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const isCritical = seconds < 30;
  const isWarning = seconds < 60 && !isCritical;
  
  return (
    <span className={`${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-500' : 'text-black'}`}>
      {`${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`}
    </span>
  );
};

  return (
    <div className={`bg-gray-900 p-3 relative flex ites-center text-white ${
      isCurrentTurn ? 'ring-2 ring-blue-500' : ''
    }`}>
      <img
        src={isBot ? "/bot.png" : profilePic}
        alt={isBot ? "Bot" : "Player"}
        className="w-12 h-12 bg-white mr-3 rounded-full"
      />
      <div className='flex flex-col flex-grow'>
        <div className='flex ites-baseline'>
          <h2 className="text-xl font-bold">
            {isBot ? "Bot" : playerName || 'Opponent'}
          </h2>
          <p className="text-gray-400 text-xs ml-2">
            ({isBot ? botRating : playerRating || '?'})
          </p>
        </div>
        {isBot && (
          <p className="text-xs text-gray-400 mt-1">AI Level: {botRating}</p>
        )}
      </div>
      <div className={`absolute right-4 h-8 w-24 flex justify-center ites-center ${
        isCurrentTurn ? 'bg-blue-100' : 'bg-gray-200'
      } text-black rounded-md px-2`}>
        <ClockIcon className='h-5 w-5' />
        <span className='ml-2 font-mono font-medium'>
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
};

export default UserInfo;