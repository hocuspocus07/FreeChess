import React,{useState,useEffect} from 'react';
import { getUserProfilePic } from '../api';

function FriendCard({ friend, showRemove, onRemove,onClick }) {
  const [profilePic, setProfilePic] = useState("/avatar/6.png");
  useEffect(() => {
    const fetchProfilePic = async () => {
      const userId = friend.id;
      if (userId) {
        const pic = await getUserProfilePic(userId);
        setProfilePic(pic ? `/avatar/${pic}` : "/avatar/6.png");
      }
    };
    fetchProfilePic();
  }, []);
  return (
    <div onClick={() => onClick && onClick(friend.id)} className="bg-gray-700 hover:cursor-pointer hover:bg-gray-200 hover:text-black rounded-xl shadow-md overflow-hidden text-lime-500 border border-lime-700 transition-all hover:shadow-lg">
      <div className="flex flex-col items-center p-6">
        <div className="relative mb-4">
          <img
            className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-lime-400 "
  src={profilePic}
            alt={friend.username}
          />
        </div>
        <h5 className="mb-1 text-xl font-semibold">{friend.username}</h5>
        {showRemove && (
          <button
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            onClick={() => onRemove(friend.id)}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default FriendCard;