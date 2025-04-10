import React from 'react';

const EvalBar = ({ evaluation }) => {
    const cappedEval = Math.max(-10, Math.min(10, evaluation));

    const whiteRatio = (cappedEval + 10) / 20; // 0 to 1
const blackRatio = 1 - whiteRatio;

    
    // For vertical layout (desktop)
    const verticalStyles = {
        whiteHeight: `${whiteRatio * 100}%`,
        blackHeight: `${blackRatio * 100}%`
      };
      const horizontalStyles = {
        whiteWidth: `${whiteRatio * 100}%`,
        blackWidth: `${blackRatio * 100}%`
      };
      
  
    const evalText = evaluation > 0 
      ? `+${evaluation.toFixed(1)}` 
      : evaluation.toFixed(1);
  
    return (
      <>
        {/* Vertical (desktop) */}
        <div className="hidden lg:flex flex-col items-center w-8 h-full bg-gray-800 overflow-hidden relative border-2 border-white">
        <div 
        className="w-full bg-gray-900 transition-all duration-300"
        style={{ height: verticalStyles.blackHeight }}
      />
          <div 
            className="w-full bg-gray-100 transition-all duration-300"
            style={{ height: verticalStyles.whiteHeight }}
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
            <span className="text-xs font-bold text-white bg-black bg-opacity-50 px-1 rounded">
              {evalText}
            </span>
          </div>
        </div>
  
        {/* Horizontal (mobile) */}
        <div className="lg:hidden flex items-center w-full h-8 bg-gray-800 overflow-hidden relative border-2 border-white">
          <div 
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: horizontalStyles.blackWidth }}
          />
          <div 
            className="h-full bg-gray-100 transition-all duration-300"
            style={{ width: horizontalStyles.whiteWidth }}
          />
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <span className="text-xs font-bold text-white bg-black bg-opacity-50 px-1 rounded">
              {evalText}
            </span>
          </div>
        </div>
      </>
    );
  };

export default EvalBar;