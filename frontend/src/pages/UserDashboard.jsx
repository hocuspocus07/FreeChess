import React from 'react';
import NavBar from '../components/NavBar';
import { addCircleOutline, flashOutline, locateOutline, playForwardCircleOutline, removeCircleOutline, reorderTwoOutline, } from 'ionicons/icons';
import { IonIcon } from '@ionic/react'; // Import IonIcon component
import PopUp from '../components/PopUp';

const user = {
  username: 'ChessMaster123',
  dateJoined: 'January 1, 2023',
  rating: {
    bullet: 1500,
    blitz: 1600,
    rapid: 1700,
  },
  recentMatches: [
    { opponent: 'PlayerA', result: 'Win', date: '2023-10-01', timeControl: 'bullet' },
    { opponent: 'PlayerB', result: 'Loss', date: '2023-10-02', timeControl: 'blitz' },
    { opponent: 'PlayerC', result: 'Draw', date: '2023-10-03', timeControl: 'rapid' },
  ],
};

const resultList = {
  Win: <IonIcon icon={addCircleOutline} />, // Icon for Win
  Loss: <IonIcon icon={removeCircleOutline} />, // Icon for Loss
  Draw: <IonIcon icon={reorderTwoOutline} />, // Icon for Draw
};

const timeControlType = [
    { bullet: <IonIcon icon={playForwardCircleOutline} />, color: 'bg-red-600' },
    { blitz: <IonIcon icon={flashOutline} />, color: 'bg-yellow-500' },
    { rapid: <IonIcon icon={locateOutline} />, color: 'bg-lime-500' },
  ];
export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-9">
        {/* User Info Section */}
        <div className="bg-[#2c2c2c] rounded-lg p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-extrabold mb-2">Welcome, {user.username}</h1>
          <p className="text-gray-400">Joined on {user.dateJoined}</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 mx-auto">
  {Object.entries(user.rating).map(([timeControl, rating]) => {
    const timeControlData = timeControlType.find((item) => item[timeControl]);
    const icon = timeControlData ? timeControlData[timeControl] : null;
    const color = timeControlData ? timeControlData.color : 'bg-gray-500';

    return (
      <div
        key={timeControl}
        className="bg-[#2c2c2c] h-40 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        {/* Time Control Icon */}
        <div className={`mx-auto text-center w-10 rounded-xl text-4xl ${color}`}>
          {icon} {/* Render the icon based on the time control type */}
        </div>
        <h2 className="text-xl font-bold mb-2 capitalize text-center">{timeControl} Rating</h2>
        <p className="text-3xl text-[#7fa650] text-center">{rating}</p>
      </div>
    );
  })}
</div>

        {/* Recent Matches Section */}
        <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-center text-gray-400">Opponent</th>
                  <th className="px-4 py-3 text-center text-gray-400">Result</th>
                  <th className="px-4 py-3 text-center text-gray-400">Date</th>
                  <th className="px-4 py-3 text-center text-gray-400">Time Control</th>
                </tr>
              </thead>
              <tbody>
                {user.recentMatches.map((match, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-[#3a3a3a] transition-colors duration-200">
                  <td className="px-4 py-3">{match.opponent}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xl font-extrabold ${
                        match.result === 'Win'
                          ? 'bg-[#7fa650] text-white'
                          : match.result === 'Loss'
                          ? 'bg-[#dc3545] text-white'
                          : 'bg-[#ffc107] text-black'
                      }`}
                    >
                      {resultList[match.result]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{match.date}</td>
                  <td className="px-4 py-3">
  <span className={`px-3 py-1 text-xl font-extrabold rounded-full ${timeControlType.find((item) => item[match.timeControl])?.color}`}>
    {timeControlType.find((item) => item[match.timeControl])?.[match.timeControl]}
  </span>
</td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Win/Loss Ratio</h2>
            <div className="h-40 bg-[#3a3a3a] rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-[#7fa650]">65% Wins</span>
            </div>
          </div>
          <div className="bg-[#2c2c2c] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Total Games Played</h2>
            <div className="h-40 bg-[#3a3a3a] rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-[#7fa650]">1,234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}