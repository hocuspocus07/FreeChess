import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  playForwardCircleOutline,
  flashOutline,
  locateOutline,
  addCircleOutline,
  removeCircleOutline,
  reorderTwoOutline,
} from 'ionicons/icons';
import { getGameDetails } from '../api.js';

const RecentMatchesTable = ({
  matches = [],
  selectedTimeControl,
  onTimeControlClick,
  onMatchClick,
  profileUserId,
  onSeeAllGames,
}) => {
  const [visibleMatches, setVisibleMatches] = useState(5); // State to control the number of visible matches
  const resultList = {
    Win: <IonIcon icon={addCircleOutline} />,
    Loss: <IonIcon icon={removeCircleOutline} />,
    Draw: <IonIcon icon={reorderTwoOutline} />,
  };

  const timeControlType = [
    { bullet: <IonIcon icon={playForwardCircleOutline} />, color: 'bg-red-600' },
    { blitz: <IonIcon icon={flashOutline} />, color: 'bg-yellow-500' },
    { rapid: <IonIcon icon={locateOutline} />, color: 'bg-lime-500' },
  ];

  const getTimeControl = (match) => {
  const durationInSeconds = match.time_control;
  if (durationInSeconds === 60) return 'bullet';
  if (durationInSeconds === 180) return 'blitz';
  return 'rapid';
};


  const filteredMatches = selectedTimeControl
    ? matches.filter((match) => getTimeControl(match) === selectedTimeControl)
    : matches.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));;

  const handleSeeMore = () => {
    setVisibleMatches(filteredMatches.length); // Show all matches
  };

  return (
    <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
      <div className="flex max-w-4xl h-40 bg-[#1a1a1a] p-4 mb-6">
        {timeControlType.map((control, index) => {
          const timeControl = Object.keys(control)[0];
          const icon = control[timeControl];
          const color = control.color;

          return (
            <div
              key={index}
              onClick={() => onTimeControlClick(timeControl)}
              className={`flex-1 flex flex-col items-center justify-center ${color} rounded-lg m-2 shadow-lg hover:brightness-90 transition-all duration-300 cursor-pointer`}
            >
              <div className="text-4xl mb-2 text-white">{icon}</div>
              <div className="text-xl font-bold capitalize text-white">{timeControl}</div>
            </div>
          );
        })}
      </div>

      {/* "See All Games" Button */}
      {selectedTimeControl && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onSeeAllGames}
            className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] transition-all duration-300"
          >
            See All Games
          </button>
        </div>
      )}

      {/* Recent Matches Table */}
      <h2 className="text-2xl font-bold mb-4 text-lime-500">Recent Matches</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-center text-gray-400">Opponent</th>
              <th className="px-4 py-3 text-center text-gray-400">Result</th>
              <th className="px-4 py-3 text-center text-gray-400">Time Control</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.slice(0, visibleMatches).map((match, index) => {
              const result =
                match.status === 'draw' || match.result === 'Draw'
                  ? 'Draw'
                  : match.winner_id === null
                    ? 'Draw'
                    : (typeof match.winner_id === 'object'
                      ? match.winner_id.id
                      : match.winner_id).toString() === profileUserId.toString()
                      ? 'Win'
                      : 'Loss';
              const timeControl = getTimeControl(match);
              const timeControlData = timeControlType.find((item) => item[timeControl]);
              const timeControlIcon = timeControlData ? timeControlData[timeControl] : null;
              const timeControlColor = timeControlData ? timeControlData.color : 'bg-gray-500';

              return (
                <tr
                  key={index}
                  onClick={() => onMatchClick(match.id)}
                  className="border-b border-gray-700 hover:cursor-pointer hover:bg-[#3a3a3a] transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-center text-lime-500">{match.opponent_username}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xl font-extrabold ${result === 'Win'
                        ? 'bg-[#7fa650] text-white'
                        : result === 'Loss'
                          ? 'bg-[#dc3545] text-white'
                          : 'bg-[#ffc107] text-black'
                        }`}
                    >
                      {resultList[result]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 text-xl font-extrabold rounded-full ${timeControlColor}`}
                    >
                      {timeControlIcon}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* "See More" Button */}
      {filteredMatches.length > visibleMatches && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSeeMore}
            className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] transition-all duration-300"
          >
            See More
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentMatchesTable;