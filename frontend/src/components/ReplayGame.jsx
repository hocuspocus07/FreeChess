import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getMoves, analyzeGame } from '../api.js';
import NavBar from './NavBar.jsx';
import MoveLog from './MoveLog.jsx';
import UserInfo from './UserInfo.jsx';
import EvalBar from './EvalBar.jsx';
import Loading from './Loading.jsx';

import { BackwardIcon, ForwardIcon } from '@heroicons/react/24/outline';

const ReplayGame = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const analysisMode = searchParams.get('analysis') === 'true';

  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [game, setGame] = useState(new Chess());
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] }); // Track captured pieces
  const [materialAdvantage, setMaterialAdvantage] = useState(0); // Track material advantage
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMoveType, setCurrentMoveType] = useState(null);
  const [moveTypePosition, setMoveTypePosition] = useState(null);

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        setLoading(true);
        const movesResponse = await getMoves(gameId);
        setMoves(movesResponse);
        setCurrentMoveIndex(-1);
        setGame(new Chess());
        if (analysisMode) {
          try {
            const analysisData = await analyzeGame(gameId);
            // Handle both possible response formats
            const analysis = analysisData.analysisResults || analysisData;
            if (!analysis) {
              throw new Error('No analysis data received');
            }
            setAnalysis(analysis);
          } catch (analysisError) {
            console.error('Analysis failed:', analysisError);
            // Continue with just the moves
          }
        }
      } catch (error) {
        console.error('Failed to fetch moves:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMoves();
  }, [gameId, analysisMode]);

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      replayMoves(newIndex);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < moves.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      replayMoves(newIndex);
    }
  };

  const replayMoves = (index) => {
    const gameCopy = new Chess();
    let lastMoveToSquare = null;
    const updatedCapturedPieces = { white: [], black: [] };
    let materialAdvantage = 0;

    for (let i = 0; i <= index; i++) {
      const move = gameCopy.move(moves[i].move);
      if (i === index) {
        lastMoveToSquare = move.to;
      }
      if (move.captured) {
        const capturedPiece = move.captured.toLowerCase();
        if (move.color === 'w') {
          updatedCapturedPieces.black.push(capturedPiece);
          materialAdvantage += getPieceValue(capturedPiece);
        } else {
          updatedCapturedPieces.white.push(capturedPiece);
          materialAdvantage -= getPieceValue(capturedPiece);
        }
      }
    }

    setCapturedPieces(updatedCapturedPieces);
    setMaterialAdvantage(materialAdvantage);
    setGame(gameCopy);

    if (analysisMode && analysis && index >= 0) {
      const moveAnalysis = analysis.find(a => a.moveId === moves[index].id);
      console.log("move analysis", moveAnalysis);
      let moveType = null;

      if (moveAnalysis) {
        if (moveAnalysis.isBlunder) moveType = 'blunder';
        else if (moveAnalysis.isMistake) moveType = 'mistake';
        else if (moveAnalysis.isInaccuracy) moveType = 'inaccuracy';
        else if (moveAnalysis.isBestMove) moveType = 'bestmove';
        else if (moveAnalysis.isGreatMove) moveType = 'greatmove';
        else if (moveAnalysis.isExcellent) moveType = 'excellent';
        else if (moveAnalysis.isGood) moveType = 'good';
        else if (moveAnalysis.isBook) moveType = 'book';
        else if (moveAnalysis.isMiss) moveType = 'miss';
      }
      console.log(`Move ${index + 1}: ${moves[index].move} | Type: ${moveType} | Square: ${lastMoveToSquare}`);
      setCurrentMoveType(moveType);
      setMoveTypePosition(lastMoveToSquare);
    } else {
      setCurrentMoveType(null);
      setMoveTypePosition(null);
    }
  };

  const checkOutMove = (index) => {
    setCurrentMoveIndex(index);
    replayMoves(index);
  };

  const highlightMoveSquares = () => {
    const styles = {};

    if (currentMoveIndex >= 0 && moveTypePosition) {
      let imageUrl = null;

      switch (currentMoveType) {
        case "bestmove":
          imageUrl = "/best.png";
          break;
        case "greatmove":
          imageUrl = "/great.png";
          break;
        case "blunder":
          imageUrl = "/blunder.png";
          break;
        case "mistake":
          imageUrl = "/mistake.png";
          break;
        case "inaccuracy":
          imageUrl = "/inaccuracy.png";
          break;
        default:
          imageUrl = null;
      }

      if (imageUrl) {
        styles[moveTypePosition] = {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        };
      }
    }

    return styles;
  };



  const getPieceValue = (piece) => {
    switch (piece) {
      case 'p': return 1;
      case 'n': return 3;
      case 'b': return 3;
      case 'r': return 5;
      case 'q': return 9;
      default: return 0;
    }
  };
  if (loading) {
    return <Loading text='Analysing'/>;
  }
  const currentEvaluation = analysisMode && analysis && currentMoveIndex >= 0
    ? analysis.find(a => a.moveId === moves[currentMoveIndex]?.id)?.evaluation || materialAdvantage
    : materialAdvantage;
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-9 p-6 bg-[#2c2c2c] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold">
          {analysisMode ? 'Game Analysis' : 'Game Replay'}
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 bg-gray-900 p-5 rounded-lg">
          <div className="lg:hidden flex justify-center mb-4">
            <div className="w-full max-w-[400px]"> {/* Horizontal bar for mobile */}
              <EvalBar evaluation={currentEvaluation} />
            </div>
          </div>
          <div className="flex justify-center flex-col sm:w-1/2 sm:h-auto">
            <div className='w-full overflow-y-scroll'>
              <MoveLog
                moveLog={moves.map((move) => move.move)} // Pass the move log as an array of moves
                currentMoveIndex={currentMoveIndex}
                checkOutMove={checkOutMove}
                isMobile={true}
              />
            </div>

            <UserInfo
              playerName="Player 1"
              playerRating="1600"
              capturedPieces={capturedPieces.white}
              materialAdvantage={materialAdvantage < 0 ? -materialAdvantage : 0}
              isBot={false}
            />

            <div className="flex items-stretch">
              <div className="hidden lg:block"> {/* Desktop EvalBar */}
                <EvalBar evaluation={currentEvaluation} />
              </div>
              <div className="flex-1">
                <Chessboard
                  position={game.fen()}
                  arePiecesDraggable={false}
                  customSquareStyles={highlightMoveSquares()}
                />
              </div>
            </div>


            <UserInfo
              playerName="Player 2"
              playerRating="1600"
              capturedPieces={capturedPieces.black}
              materialAdvantage={materialAdvantage > 0 ? materialAdvantage : 0}
              isBot={false}
            />
          </div>

          <div className="flex flex-col lg:w-1/2">
            <MoveLog
              moveLog={moves.map((move) => move.move)}
              currentMoveIndex={currentMoveIndex}
              checkOutMove={checkOutMove}
              isMobile={false}
            />
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={goToPreviousMove}
            disabled={currentMoveIndex < 0}
            className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <BackwardIcon className='h-6 w-6' />
          </button>
          <button
            onClick={goToNextMove}
            disabled={currentMoveIndex >= moves.length - 1}
            className="bg-[#7fa650] text-white px-4 py-2 rounded-lg hover:bg-[#8cf906] hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <ForwardIcon className='h-6 w-6' />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReplayGame;