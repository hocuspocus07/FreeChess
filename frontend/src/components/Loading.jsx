import React from 'react';

function Loading({text}) {
  return (
    <div className='w-screen h-screen overflow-hidden flex justify-center items-center bg-[#1a1a1a]'>
    <div className="border border-gray-700 bg-[#1a1a1a] text-green-400 font-mono text-base p-6 w-48 shadow-lg rounded-md relative overflow-hidden box-border">
      {/* Terminal header */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gray-700 rounded-t-md px-2 box-border">
        <div className="float-left leading-6 text-gray-200">Status</div>
        <div className="float-right">
          <span className="inline-block w-2 h-2 ml-2 rounded-full bg-red-500"></span>
          <span className="inline-block w-2 h-2 ml-2 rounded-full bg-yellow-400"></span>
          <span className="inline-block w-2 h-2 ml-2 rounded-full bg-green-500"></span>
        </div>
      </div>
      
      {/* Animated text */}
      <div className="inline-block whitespace-nowrap overflow-hidden border-r-2 border-green-400 mt-6 animate-[typing_4s_steps(11)_infinite,blink_0.5s_step-end_infinite_alternate]">
        {text}...
      </div>
    </div></div>
  );
}

export default Loading;