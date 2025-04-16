import React, { useRef, useEffect } from 'react';

const MoveLog = ({ moveHistory, currentMoveIndex, checkOutMove, isMobile = false }) => {
  const moveLogRef = useRef(null);

  useEffect(() => {
    if (moveLogRef.current && !isMobile) {
      moveLogRef.current.scrollTop = moveLogRef.current.scrollHeight;
    }
  }, [moveHistory, isMobile]);

  // Desktop View - Proper highlighting
  const renderDesktopView = () => {
    return (
      <div className="w-full lg:w-64 bg-gray-800 rounded-lg overflow-hidden shadow-lg sm:flex hidden flex-col">
        <div className="p-3 bg-gray-700 border-b border-gray-600">
          <h2 className="font-medium text-white">Move History</h2>
        </div>
        <div ref={moveLogRef} className="h-64 md:h-[28rem] overflow-y-auto p-3 font-mono text-sm">
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
                    className={`border-b border-gray-700 ${
                      (currentMoveIndex === index * 2 && move.white) || 
                      (currentMoveIndex === index * 2 + 1 && move.black) ? 
                      'bg-gray-700' : ''
                    }`}
                  >
                    <td className="py-2 text-gray-400">{move.number}</td>
                    <td 
                      className={`py-2 ${
                        move.white && move.player === localStorage.getItem('userId') ? 
                        'text-indigo-300' : 'text-white'
                      }`}
                      onClick={() => move.white && checkOutMove(index * 2)}
                    >
                      {move.white || '-'}
                    </td>
                    <td 
                      className={`py-2 ${
                        move.black && move.player === localStorage.getItem('userId') ? 
                        'text-indigo-300' : 'text-white'
                      }`}
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

  // Mobile View - Proper highlighting
  const renderMobileView = () => {
    const flatMoves = [];
    moveHistory.forEach(move => {
      if (move.white) flatMoves.push({ san: move.white, index: flatMoves.length });
      if (move.black) flatMoves.push({ san: move.black, index: flatMoves.length });
    });

    return (
      <div className="h-6 w-screen flex bg-gray-800 text-white overflow-x-scroll md:hidden">
        <div className="flex">
          {flatMoves.map((move, i) => (
            <div
              key={i}
              onClick={() => checkOutMove(i)}
              className={`bg-[#3a3a3a] rounded mx-1 px-1 cursor-pointer ${
                currentMoveIndex === i ? "border-2 border-yellow-400" : ""
              }`}
            >
              <span className="text-white font-bold">
                {Math.floor(i / 2) + 1}.{i % 2 === 0 ? '' : '..'} {move.san}
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