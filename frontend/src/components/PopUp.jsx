import React from 'react';

function PopUp({ searchResults = [], onClose }) {
    return (
      <>
        <div
          id="select-modal"
          tabIndex="-1"
          aria-hidden="true"
          className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black bg-opacity-50"
        >
          <div className="relative p-4 w-full max-w-md max-h-full m-auto mt-20">
            <div className="relative bg-[#2c2c2c] rounded-lg shadow-sm dark:bg-gray-700 text-[#7fa650]">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-lg font-semibold text-white dark:text-white">Search Results</h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:cursor-pointer rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
                <ul className="space-y-4 mb-4">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <li key={result.id}>
                        <div className="inline-flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-500">
                          <div className="flex justify-center items-center">
                            <img src="user.png" alt="user profile" className='h-14 w-14 mr-4 bg-white' />
                            <div className="w-full text-lg font-semibold">{result.username}</div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No results found.</p>
                  )}
                </ul>
                <button
                  className="text-white inline-flex w-full justify-center hover:cursor-pointer bg-[#538f0b] hover:bg-[#506338] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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