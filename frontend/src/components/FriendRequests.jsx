import React, { useEffect, useRef, Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getFriendRequests, acceptFriendRequest, removeFriend } from '../api';

function FriendRequests({ show, onClose }) {
  const [friendRequests, setFriendRequests] = useState([]);
  const requestsRef = useRef();

  const fetchFriendRequests = async () => {
    try {
      const data = await getFriendRequests();
      setFriendRequests(data);
    } catch {
      setFriendRequests([]);
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
if (props.onFriendChange) props.onFriendChange();
    fetchFriendRequests();
  };

  const handleDeny = async (friendId) => {
    await removeFriend(friendId);
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
        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 p-4"
        style={{ top: '2.5rem' }}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <div className="text-gray-500 text-sm">No friend requests.</div>
        ) : (
          <ul>
            {friendRequests.map(req => (
              <li key={req.user_id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span className="text-gray-700">{req.username}</span>
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