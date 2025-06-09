import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';

const sections = [
  {
    title: "Objective",
    content: (
      <p>
        The goal of chess is to checkmate your opponent's king. This means the king is in a position to be captured ("in check") and cannot escape.
      </p>
    ),
  },
  {
    title: "Setup",
    content: (
      <>
        <p>
          Each player starts with 16 pieces: one king, one queen, two rooks, two knights, two bishops, and eight pawns. The pieces are arranged as shown below:
        </p>
        <div className="bg-gray-800 p-4 rounded-lg my-4 flex justify-center">
          <img
            src="/chess-setup.jpg"
            alt="Chess Setup"
            className="w-full max-w-md rounded-lg shadow-lg"
          />
        </div>
      </>
    ),
  },
  {
    title: "Basic Rules",
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>Pawns move forward but capture diagonally.</li>
        <li>Rooks move in straight lines horizontally or vertically.</li>
        <li>Knights move in an L-shape and can jump over other pieces.</li>
        <li>Bishops move diagonally.</li>
        <li>The queen can move in any direction.</li>
        <li>The king moves one square in any direction.</li>
      </ul>
    ),
  },
  {
    title: "Special Moves",
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Castling:</strong> A move involving the king and a rook for added safety.
        </li>
        <li>
          <strong>En Passant:</strong> A special pawn capture move.
        </li>
        <li>
          <strong>Promotion:</strong> When a pawn reaches the opposite side, it can be promoted to any other piece (except a king).
        </li>
      </ul>
    ),
  },
  {
    title: "Winning the Game",
    content: (
      <p>
        You win by checkmating your opponent's king. This means the king is under attack and cannot escape. Alternatively, you can win if your opponent resigns or runs out of time (in timed games).
      </p>
    ),
  },
];

function HowToPlay() {
  const [openSection, setOpenSection] = useState(0);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('token');

  const handleStartPlaying = () => {
    if (isLoggedIn) {
      navigate('/multiplayer');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-[#23272f] min-h-screen">
      <NavBar />
      <div className="max-w-4xl mx-auto pt-20 pb-10 px-4">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-lime-400 drop-shadow-lg">
          How to Play Chess
        </h1>
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div key={section.title} className="rounded-lg shadow-lg bg-gray-800">
              <button
                className={`w-full flex justify-between items-center px-6 py-4 text-xl font-semibold transition-colors rounded-t-lg focus:outline-none ${
                  openSection === idx
                    ? 'bg-lime-600 text-white'
                    : 'bg-gray-800 text-lime-400 hover:bg-gray-700'
                }`}
                onClick={() => setOpenSection(openSection === idx ? -1 : idx)}
                aria-expanded={openSection === idx}
              >
                {section.title}
                <span className="ml-2 text-2xl">
                  {openSection === idx ? '−' : '+'}
                </span>
              </button>
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openSection === idx ? 'max-h-96 p-6' : 'max-h-0 p-0'
                } bg-gray-900 text-white`}
                style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
              >
                {openSection === idx && section.content}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button
            className="px-8 py-4 rounded-lg font-bold text-xl bg-lime-500 hover:from-lime-600 hover:bg-lime-800 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
            onClick={handleStartPlaying}
          >
            Start Playing Now
          </button>
          <p className="mt-4 text-gray-400 text-sm">
            {isLoggedIn
              ? "Ready to challenge real players online!"
              : "Log in to play online with others."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default HowToPlay;