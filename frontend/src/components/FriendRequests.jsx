import React, { useEffect, useRef, Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getFriendRequests, acceptFriendRequest, removeFriend } from '../api';
import { getUserProfilePic } from '../api.js';

function FriendRequests({ show, onClose,onFriendChange }) {
  const [friendRequests, setFriendRequests] = useState([]);
  const requestsRef = useRef();
  const [profilePics, setProfilePics] = useState("/avatar/6.png");

  const fetchFriendRequests = async () => {
    try {
      const data = await getFriendRequests();
      setFriendRequests(data);
      const pics = {};
      for (const req of data) {
        const pic = await getUserProfilePic(req.user_id);
        pics[req.user_id] = pic ? `/avatar/${pic}` : "/avatar/6.png";
      }
      setProfilePics(pics);
    } catch {
      setFriendRequests([]);
      setProfilePics({});
    }
  };

  useEffect(() => {
    if (show) fetchFriendRequests();
  }, [show]);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (show && requestsRef.current && !requestsRef.current.contains(event.target)) {
        onClose && onClose();
      }
    }
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  const handleAccept = async (friendId) => {
    await acceptFriendRequest(friendId);
    if (onFriendChange) onFriendChange();
    fetchFriendRequests();
  };

  const handleDeny = async (friendId) => {
    await removeFriend(friendId);
    if (onFriendChange) onFriendChange();
    fetchFriendRequests();
  };

  return (
    <Transition
      as={Fragment}
      show={show}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div
        ref={requestsRef}
        className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border-3 border-black z-50 p-4"
        style={{ top: '2.5rem' }}
      >
        <h3 className="text-lg font-semibold mb-2 text-white">Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <div className="text-gray-500 text-sm">No friend requests.</div>
        ) : (
          <ul>
            {friendRequests.map(req => (
              <li key={req.user_id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  <img
                    src={profilePics[req.user_id] || "/avatar/6.png"}
                    alt={req.username}
                    className="w-8 h-8 rounded-full mr-2 bg-gray-200 border-1 border-white"
                  />
                  <span className="text-lime-500 font-bold">{req.username}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-1 rounded-full bg-green-100 hover:bg-green-200"
                    onClick={() => handleAccept(req.user_id)}
                    title="Accept"
                  >
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  </button>
                  <button
                    className="p-1 rounded-full bg-red-100 hover:bg-red-200"
                    onClick={() => handleDeny(req.user_id)}
                    title="Deny"
                  >
                    <XMarkIcon className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Transition>
  );
}

export default FriendRequests;