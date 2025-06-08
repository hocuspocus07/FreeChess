import React, { useEffect, useState } from 'react';
import FriendCard from './FriendCard.jsx';
import { getFriends, removeFriend } from '../api.js';
import { useNavigate } from 'react-router-dom';

function FriendList({ isOwnProfile = true, userId }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleCardClick = (friendId) => {
    navigate(`/user/${friendId}`);
  };
  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriends(userId);
      console.log("friends", data);
      setFriends(data);
    } catch (err) {
      setFriends([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleRemove = async (friendId) => {
    await removeFriend(friendId);
    fetchFriends();
  };

  if (loading) return <div className="text-gray-400">Loading friends...</div>;
  if (!friends.length) return <div className="text-gray-400">No friends yet.</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-lime-500 font-bold text-2xl mb-6">Friends</h1>
      {/* mobile  */}
      <div className="flex gap-4 overflow-x-auto pb-2 sm:hidden">
        {friends.map(friend => (
          <div key={friend.id} className="min-w-[50vw] max-w-[80vw] flex-shrink-0">
            <FriendCard
              friend={friend}
              showRemove={isOwnProfile}
              onRemove={handleRemove}
              onClick={handleCardClick}
            />
          </div>
        ))}
      </div>
      {/* desktop */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {friends.map(friend => (
          <FriendCard
            key={friend.id}
            friend={friend}
            showRemove={isOwnProfile}
            onRemove={handleRemove}
            onClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}

export default FriendList;