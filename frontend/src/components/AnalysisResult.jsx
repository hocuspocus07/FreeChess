import React from 'react'

function AnalysisResult({analysisResults=[]}) {
      console.log("Analysis results data:", analysisResults);
    const moveTypeCountsP1 = {
    'Brilliant': 0, 'Great Move': 0, 'Best Move': 0, 'Excellent': 0, 'Good': 0, 'Book': 0,
    'Inaccuracy': 0, 'Mistake': 0, 'Miss': 0, 'Blunder': 0, 'Neutral': 0,
  };
  const moveTypeCountsP2 = { ...moveTypeCountsP1 };

  analysisResults.forEach((move, idx) => {
    // If you have a player field, use it. Otherwise, alternate moves.
    const isP1 = move.player === 1 || (!move.player && idx % 2 === 0);
    const moveType = move.moveType;
    if (isP1) moveTypeCountsP1[moveType] = (moveTypeCountsP1[moveType] || 0) + 1;
    else moveTypeCountsP2[moveType] = (moveTypeCountsP2[moveType] || 0) + 1;
  });
  
    const moveTypes = [
        { id: 1, name: 'Brilliant', color: 'text-[#00b2ff]', icon: 'brilliant.png' },
        { id: 2, name: 'Great Move', color: 'text-[#6d9eeb]', icon: 'great.png' },
        { id: 3, name: 'Best Move',  color: 'text-[#48c774]', icon: 'best.png' },
        { id: 4, name: 'Excellent', color: 'text-[#96be4b]', icon: 'excellent.png' },
        { id: 5, name: 'Good', color: 'text-[#96b08d]', icon: 'good.png' },
        { id: 6, name: 'Book', color: 'text-[#a3a3a3]', icon: 'book.png' },
        { id: 7, name: 'Inaccuracy', color: 'text-[#f7d775]', icon: 'inaccuracy.png' },
        { id: 8, name: 'Mistake', color: 'text-[#f7a15c]', icon: 'mistake.png' },
        { id: 9, name: 'Miss', color: 'text-[#eb6f57]', icon: 'miss.png' },
        { id: 10, name: 'Blunder', color: 'text-[#bb3c36]', icon: 'blunder.png' }
    ];

    return (
        <div className='bg-[#1a1a1a] h-full w-full text-white p-4'>
            <h1 className='text-xl font-bold mb-4'>Analysis Results</h1>
            <div className='flex flex-col'>
                <div className='grid grid-cols-3 gap-2'>
                    {moveTypes.map((move) => (
                        <React.Fragment key={move.id}>
                            {/* Player 1 count */}
              <p className={`${move.color}`}>{moveTypeCountsP1[move.name] || 0}</p>
              {/* Move type name and icon */}
              <p className={`flex items-center ${move.color}`}>
                <img
                  src={`/${move.icon}`}
                  className='h-5 w-5 mr-2'
                  alt={move.name}
                />
                {move.name}
              </p>
              {/* Player 2 count */}
              <p className={`${move.color}`}>{moveTypeCountsP2[move.name] || 0}</p>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AnalysisResult;