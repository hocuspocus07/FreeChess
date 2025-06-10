import React, { useRef, useEffect, useState } from 'react';

const ProfilePicMenu = ({ profilePic, onView, onChange,isOwnProfile=true }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block">
      <img
        src={profilePic ? `/avatar/${profilePic}` : "/avatar/6.png"}
        alt="Profile"
        className="w-24 h-24 rounded-full cursor-pointer border-2 border-lime-400 inline"
        onClick={() => setOpen(o => !o)}
      />
      {open && (
        <div ref={menuRef} className="absolute z-50 right-0 mt-2 w-40 bg-black text-white rounded-sm shadow-lg">
          <button
            className="block w-full text-left px-4 py-2 rounded-sm hover:bg-gray-100 hover:text-black hover:cursor-pointer"
            onClick={() => { setOpen(false); onView(); }}
          >
            View Profile Pic
          </button>
          {isOwnProfile && (<button
            className="block w-full text-left px-4 py-2 rounded-sm hover:bg-gray-100 hover:text-black hover:cursor-pointer"
            onClick={() => { setOpen(false); onChange(); }}
          >
            Change Profile Pic
          </button>)}
        </div>
      )}
    </div>
  );
};

export default ProfilePicMenu;