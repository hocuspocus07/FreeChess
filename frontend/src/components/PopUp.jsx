import React,{useState,useEffect} from 'react';
import { getUserProfilePic } from '../api.js';

function PopUp({ searchResults = [], onClose, onUserClick }) {
    const [profilePics, setProfilePics] = useState({});

    useEffect(() => {
        const fetchProfilePics = async () => {
            const pics = {};
            for (const user of searchResults) {
                const pic = await getUserProfilePic(user.id);
                pics[user.id] = pic ? `/avatar/${pic}` : "/avatar/6.png";
            }
            setProfilePics(pics);
        };
        
        if (searchResults.length > 0) {
            fetchProfilePics();
        }
    }, [searchResults]);
    return (
        <>
            <div
                id="select-modal"
                tabIndex="-1"
                aria-hidden="true"
                className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black bg-opacity-50"
            >
                <div className="relative p-4 w-full max-w-md max-h-full m-auto mt-20">
                    <div className="relative bg-[#2c2c2c] rounded-lg shadow-sm text-[#7fa650]">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-200">
                            <h3 className="text-lg font-semibold text-white">Search Results</h3>
                            <button
                                type="button"
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:cursor-pointer rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center"
                                onClick={onClose}
                            >
                                <svg
                                    className="w-3 h-3"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 14 14"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                    />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>
                        <div className="p-4 md:p-5">
                            <ul>
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <div key={user.id} onClick={() => onUserClick(user.id)}  className='flex my-2 border-2 p-1 border-emerald-600 rounded-xl hover:bg-white hover:cursor-pointer hover:text-black'>
                                            <img src={profilePics[user.id] || "/avatar/6.png"}  alt="user profile" className='h-14 rounded-full w-14 mx-2 bg-white' />
                                            <li
                                                className="p-2 rounded font-bold text-lime-500"
                                            >
                                                {user.username}
                                            </li>
                                            </div>
                                    ))
                                ) : (
                                    <li>No users found.</li>
                                )}
                            </ul>
                            <button
                                className="text-white inline-flex w-full justify-center hover:cursor-pointer bg-[#538f0b] hover:bg-[#506338] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PopUp;