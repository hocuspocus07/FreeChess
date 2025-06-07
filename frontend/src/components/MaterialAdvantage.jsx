import React from 'react';

const MaterialAdvantage = ({ capturedPieces, materialAdvantage, isTopPlayer }) => {
  // piece counts
  const whiteCaptures = capturedPieces.white || [];
  const blackCaptures = capturedPieces.black || [];
  const renderCapturedPieces = (pieces) => {
    const pieceCounts = {
      p: 0,
      n: 0,
      b: 0,
      r: 0,
      q: 0
    };

    pieces.forEach(piece => {
      pieceCounts[piece] = (pieceCounts[piece] || 0) + 1;
    });

    return Object.entries(pieceCounts).map(([piece, count]) => {
      if (count === 0) return null;
      
      const pieceSymbol = {
        p: '♟',
        n: '♞',
        b: '♝',
        r: '♜',
        q: '♛'
      }[piece];

      return (
        <span key={piece} className="inline-block mx-0.5">
          {Array(count).fill().map((_, i) => (
            <span key={i} className="text-sm md:text-base">
              {pieceSymbol}
            </span>
          ))}
        </span>
      );
    });
  };

  // advantage direction and color
  const advantageDirection = materialAdvantage > 0 ? 'white' : 'black';
  const advantageColor = isTopPlayer ? 
    (materialAdvantage < 0 ? 'text-red-400' : 'text-green-400') :
    (materialAdvantage > 0 ? 'text-red-400' : 'text-green-400');

  return (
    <div className={`flex items-center justify-between px-2 py-1 bg-gray-800 rounded-md ${isTopPlayer ? 'mb-1' : 'mt-1'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center overflow-x-auto no-scrollbar">
          {isTopPlayer ? (
            <>
              <span className="text-gray-300 text-xs mr-1">▼</span>
              {renderCapturedPieces(whiteCaptures)}
            </>
          ) : (
            <>
              <span className="text-gray-300 text-xs mr-1">▲</span>
              {renderCapturedPieces(blackCaptures)}
            </>
          )}
        </div>
      </div>
      <div className={`text-xs font-mono ${advantageColor} ml-2 whitespace-nowrap`}>
        {Math.abs(materialAdvantage) > 0 && (
          <>
            {advantageDirection === 'white' ? '+' : '-'}
            {Math.abs(materialAdvantage)}
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialAdvantage;