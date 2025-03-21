import React from 'react';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <div className="min-h-screen flex w-screen items-center justify-center hero-bg text-white">
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Play Chess. Analyze Games. Improve Your Skills.
        </h1>
        <h3 className="text-2xl text-gray-400 mb-8">
          As simple as that. <span className="text-blue-500">No paid stuff.</span>
        </h3>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join <span className="font-semibold text-blue-500">FreeChess</span>, or chess on steroids. Get free, detailed reviews for every game you play and level up your skills like never before!
        </p>
        <div className="space-x-4">
          <Link
            to="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Hero;