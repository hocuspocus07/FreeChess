import React, { useRef, useEffect } from 'react';

const MoveLog = ({ moveHistory = [], currentMoveIndex, checkOutMove, isMobile = false }) => {
  const moveLogRef = useRef(null);

  useEffect(() => {
    if (!isMobile && moveLogRef.current) {
      const activeEl = moveLogRef.current.querySelector('.highlighted');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentMoveIndex, isMobile]);

  const renderDesktopView = () => {
    return (
      <div className="w-full lg:w-64 bg-gray-800 rounded-lg overflow-hidden shadow-lg sm:flex hidden flex-col">
        <div className="p-3 bg-gray-700 border-b border-gray-600">
          <h2 className="font-medium text-white">Move History</h2>
        </div>
        <div ref={moveLogRef} className="h-64 md:h-[28rem] overflow-y-auto p-3 font-mono text-sm scrollbar-custom">
          {moveHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No moves yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-1">#</th>
                  <th className="text-left pb-1">White</th>
                  <th className="text-left pb-1">Black</th>
                </tr>
              </thead>
              <tbody>
                {moveHistory.map((move, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-700 ${(currentMoveIndex === index * 2 && move.white) ||
                      (currentMoveIndex === index * 2 + 1 && move.black) ?
                      'bg-gray-700' : ''
                      }`}
                  >
                    <td className="py-2 text-gray-400">{move.number}</td>
                    <td
                      className={`py-2 cursor-pointer ${currentMoveIndex === index * 2 ? 'bg-yellow-500 text-black highlighted' : ''
                        } ${move.white && move.player === localStorage.getItem('userId') ?
                          'text-indigo-300' : 'text-white'}`}
                      onClick={() => move.white && checkOutMove(index * 2)}
                    >
                      {move.white || '-'}
                    </td>
{console.log('Move at index', index, move)}
                    <td
                      className={`py-2 cursor-pointer ${currentMoveIndex === index * 2 + 1 ? 'bg-yellow-500 text-black highlighted' : ''
                        } ${move.black && move.player === localStorage.getItem('userId') ?
                          'text-indigo-300' : 'text-white'}`}
                      onClick={() => move.black && checkOutMove(index * 2 + 1)}
                    >
                      {move.black || '-'}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderMobileView = () => {
    const pairs = [];

    moveHistory.forEach((move, i) => {
      pairs.push({
        number: move.number,
        white: move.white,
        black: move.black,
        whiteIndex: i * 2,
        blackIndex: i * 2 + 1
      });
    });
    
useEffect(() => {
  if (moveLogRef.current) {
    moveLogRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}, [currentMoveIndex]);

    return (
      <div className="h-12 w-screen flex bg-gray-800 text-white overflow-x-auto md:hidden p-2">
        <div className="flex gap-4">
          {pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-400">{pair.number}.</span>
              <span
                ref={currentMoveIndex === pair.whiteIndex ? moveLogRef : null}
                onClick={() => pair.white && checkOutMove(pair.whiteIndex)}
                className={`cursor-pointer px-1 rounded ${currentMoveIndex === pair.whiteIndex ? "bg-yellow-500 text-black" : ""
                  }`}
              >
                {pair.white || '-'}
              </span>

              <span
                ref={currentMoveIndex === pair.blackIndex ? moveLogRef : null}
                onClick={() => pair.black && checkOutMove(pair.blackIndex)}
                className={`cursor-pointer px-1 rounded ${currentMoveIndex === pair.blackIndex ? "bg-yellow-500 text-black" : ""
                  }`}
              >
                {pair.black || '-'}
              </span>

            </div>
          ))}
        </div>
      </div>
    );
  };


  return isMobile ? renderMobileView() : renderDesktopView();
};

export default MoveLog;