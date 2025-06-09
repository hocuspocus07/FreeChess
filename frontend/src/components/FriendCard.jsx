import React from 'react';

function FriendCard({ friend, showRemove, onRemove,onClick }) {
  return (
    <div onClick={() => onClick && onClick(friend.id)} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      <div className="flex flex-col items-center p-6">
        <div className="relative mb-4">
          <img
            className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-lime-400 "
            src={friend.profilePic || "/default-user.png"}
            alt={friend.username}
          />
        </div>
        <h5 className="mb-1 text-xl font-semibold text-gray-900">{friend.username}</h5>
        <span className="text-sm text-gray-500 mb-4">{friend.email}</span>
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