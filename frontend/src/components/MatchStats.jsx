import React from 'react';

const calculateWinStats = (recentMatches, userId) => {
  if (!recentMatches.length) return { wins: 0, losses: 0, draws: 0, total: 0 };
  
  const userWins = recentMatches.filter(match => 
    match.winner_id && match.winner_id.toString() === userId.toString()
  ).length;

  const userLosses = recentMatches.filter(match => 
    match.winner_id && match.winner_id.toString() !== userId.toString()
  ).length;

  const draws = recentMatches.length - userWins - userLosses;

  return {
    wins: userWins,
    losses: userLosses,
    draws: draws,
    total: recentMatches.length
  };
};

const CircularProgressBar = ({ wins, losses, draws, total }) => {
  if (total === 0) {
    return (
      <div className="h-40 w-40 rounded-full border-4 border-gray-500 flex items-center justify-center">
        <span className="text-gray-400">No games</span>
      </div>
    );
  }

  const winPercentage = (wins / total) * 100;
  const lossPercentage = (losses / total) * 100;
  const drawPercentage = (draws / total) * 100;

  const winDash = (251 * winPercentage) / 100;
  const lossDash = (251 * lossPercentage) / 100;
  const drawDash = (251 * drawPercentage) / 100;

  return (
    <div className="relative h-40 w-40">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3a3a3a" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#6b7280"
          strokeWidth="8"
          strokeDasharray={`${drawDash} 251`}
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#dc3545"
          strokeWidth="8"
          strokeDasharray={`${lossDash} 251`}
          strokeDashoffset={`-${drawDash}`}
          transform="rotate(-90 50 50)"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#7fa650"
          strokeWidth="8"
          strokeDasharray={`${winDash} 251`}
          strokeDashoffset={`-${drawDash + lossDash}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#7fa650]">
          {Math.round(winPercentage)}%
        </span>
        <span className="text-sm text-gray-400">
          {wins}W {losses}L {draws}D
        </span>
      </div>
    </div>
  );
};

const MatchStats = ({ recentMatches, userId }) => {
  const stats = calculateWinStats(recentMatches, userId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
      <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Win/Loss Ratio</h2>
        <div className="flex items-center justify-center">
          <CircularProgressBar {...stats} />
        </div>
      </div>
      <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Total Games Played</h2>
        <div className="h-40 bg-[#3a3a3a] rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-[#7fa650]">
            {recentMatches.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchStats;