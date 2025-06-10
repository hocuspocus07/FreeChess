import React, { useState } from 'react';
import { updateUserAvatar } from '../api.js';

const avatars = Array.from({ length: 12 }, (_, i) => `${i + 1}.png`);

const UpdateAvatar = ({ currentAvatar, userId, onUpdate }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleAvatarSelect = async (avatar) => {
    try {
      await updateUserAvatar(userId, avatar);
      setSelectedAvatar(avatar);
      onUpdate(avatar);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  return (
    <div className="bg-[#2c2c2c] p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-3">Choose Your Avatar</h3>
      <div className="grid grid-cols-4 gap-x-0.5">
        {avatars.map((avatar) => (
          <div 
            key={avatar}
            onClick={() => handleAvatarSelect(avatar)}
            className={`h-max w-max cursor-pointer p-1 rounded-full ${selectedAvatar === avatar ? 'ring-2 ring-blue-500' : ''}`}
          >
            <img 
              src={`/avatar/${avatar}`} 
              alt="Avatar" 
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpdateAvatar;