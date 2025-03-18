import { useState } from 'react';
import React from 'react'
import PopUp from './PopUp.jsx';
import UserProfile from '../pages/UserProfile.jsx';
import { useNavigate } from 'react-router-dom';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const navigate=useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault(); 
    if (!searchQuery) return;
  
    try {
      const response = await fetch(`http://localhost:8000/chess/users/search?query=${searchQuery}`,{method: 'GET',
        credentials: 'include'});
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      const data = await response.json();
      setSearchResults(data.users || []); 
      setIsPopUpOpen(true); 
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]); 
      setIsPopUpOpen(true); 
    }
  };
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
    setIsPopUpOpen(false); // Close the popup
  };
  return (
    <>
<form className="max-w-md mx-auto" onSubmit={handleSearch}>   
    <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
    <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
        </div>
        <input type="search" id="default-search" className="block w-64 p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for a Username" required />
        <button type="submit" className="text-white absolute end-1 bottom-1 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
    </div>
</form>
{isPopUpOpen && (
        <PopUp
          searchResults={searchResults}
          onClose={() => setIsPopUpOpen(false)}
          onUserClick={handleUserClick} // Pass the click handler to PopUp
        />
      )}
</>
  )
}

export default Search