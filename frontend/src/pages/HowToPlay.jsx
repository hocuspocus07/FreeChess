import React from 'react';
import NavBar from '../components/NavBar.jsx';

function HowToPlay() {
  return (
    <div className='bg-[#2c2c2c] mt-10'>
        <NavBar/>
    <div className="min-h-screen p-6" style={{ color: 'white' }}>
      <div className="max-w-4xl mx-auto">
        {/* Page Heading */}
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#7fa650' }}>
          How to Play Chess
        </h1>

        {/* Section 1: Objective */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#7fa650' }}>
            Objective
          </h2>
          <p className="mb-4">
            The goal of chess is to checkmate your opponent's king. This means the king is in a position to be captured ("in check") and cannot escape.
          </p>
        </section>

        {/* Section 2: Setup */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#7fa650' }}>
            Setup
          </h2>
          <p className="mb-4">
            Each player starts with 16 pieces: one king, one queen, two rooks, two knights, two bishops, and eight pawns. The pieces are arranged as shown below:
          </p>
          <div className="bg-gray-800 p-4 rounded-lg">
            <img
              src="/chess-setup.jpg" // Replace with your image path
              alt="Chess Setup"
              className="w-full rounded-lg"
            />
          </div>
        </section>

        {/* Section 3: Basic Rules */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#7fa650' }}>
            Basic Rules
          </h2>
          <ul className="list-disc pl-6">
            <li className="mb-2">Pawns move forward but capture diagonally.</li>
            <li className="mb-2">Rooks move in straight lines horizontally or vertically.</li>
            <li className="mb-2">Knights move in an L-shape and can jump over other pieces.</li>
            <li className="mb-2">Bishops move diagonally.</li>
            <li className="mb-2">The queen can move in any direction.</li>
            <li className="mb-2">The king moves one square in any direction.</li>
          </ul>
        </section>

        {/* Section 4: Special Moves */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#7fa650' }}>
            Special Moves
          </h2>
          <ul className="list-disc pl-6">
            <li className="mb-2">
              <strong>Castling:</strong> A move involving the king and a rook for added safety.
            </li>
            <li className="mb-2">
              <strong>En Passant:</strong> A special pawn capture move.
            </li>
            <li className="mb-2">
              <strong>Promotion:</strong> When a pawn reaches the opposite side, it can be promoted to any other piece (except a king).
            </li>
          </ul>
        </section>

        {/* Section 5: Winning the Game */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#7fa650' }}>
            Winning the Game
          </h2>
          <p className="mb-4">
            You win by checkmating your opponent's king. This means the king is under attack and cannot escape. Alternatively, you can win if your opponent resigns or runs out of time (in timed games).
          </p>
        </section>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button
            className="px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#7fa650', color: 'white' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#6c8a42')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#7fa650')}
          >
            Start Playing Now
          </button>
        </div>
      </div>
    </div></div>
  );
}

export default HowToPlay;