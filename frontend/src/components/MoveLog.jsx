import React from 'react';

const MoveLog = ({ moveLog, currentMoveIndex, checkOutMove, isMobile }) => {
  const formatMoveLog = () => {
    const formattedMoves = [];
    for (let i = 0; i < moveLog.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveLog[i];
      const blackMove = moveLog[i + 1] || '';
      formattedMoves.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    }
    return formattedMoves;
  };

  return (
    <div className={`${isMobile ? 'h-6 w-screen flex bg-gray-800 text-white overflow-x-scroll md:hidden' : 'bg-gray-900 rounded-lg p-6 sm:flex hidden flex-col text-white h-full'}`}>
      {!isMobile && <h3 className="text-lg font-bold mb-4">Move Log</h3>}
      <div className={`${isMobile ? 'flex' : 'overflow-y-auto h-96 p-2 rounded scrollbar-custom'}`}>
        {formatMoveLog().map((movePair, pairIndex) => {
          const moves = movePair.split(" ");
          return (
            <React.Fragment key={pairIndex}>
              {!isMobile && (
                <div className='flex items-center justify-center m-2 bg-gray-400 p-1 rounded-xl'>
                  <div className="bg-[#2a2a2a] rounded mx-1 px-1 cursor-default">
                    <p className="text-gray-400">{moves[0]}</p>
                  </div>
                  {moves.slice(1).map((move, moveOffset) => {
                    const moveIndex = pairIndex * 2 + moveOffset;
                    return (
                      <div
                        key={`${pairIndex}-${moveOffset}`}
                        onClick={() => checkOutMove(moveIndex)}
                        className={`bg-[#3a3a3a] rounded mx-1 px-1 cursor-pointer ${currentMoveIndex === moveIndex ? "border-2 border-yellow-400" : ""}`}
                      >
                        <span className="text-white">{move}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {isMobile && (
                <div className="bg-[#2a2a2a] rounded mx-1 px-1 cursor-default">
                  <span className="text-gray-500">{moves[0]}</span>
                </div>
              )}
              {isMobile &&
                moves.slice(1).map((move, moveOffset) => {
                  const moveIndex = pairIndex * 2 + moveOffset;
                  return (
                    <div
                      key={`${pairIndex}-${moveOffset}`}
                      onClick={() => checkOutMove(moveIndex)}
                      className={`bg-[#3a3a3a] rounded mx-1 px-1 cursor-pointer ${currentMoveIndex === moveIndex ? "border-2 border-yellow-400" : ""}`}
                    >
                      <span className="text-white font-bold">{move}</span>
                    </div>
                  );
                })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MoveLog;