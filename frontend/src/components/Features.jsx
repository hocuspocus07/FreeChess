import React from 'react';

const features = [
    {
        name: 'Play Online',
        description:
            'Challenge players from around the world in real-time chess matches. Improve your skills by playing against opponents of all levels.',
        icon: <img src='great.png' alt='play' className='h-10 w-10' />,
    },
    {
        name: 'Game Analysis',
        description:
            'Get detailed insights into your games with advanced Stockfish engine. Learn from your mistakes and refine your strategies.',
        icon: <img src='best.png' alt='analyze' className='h-10 w-10' />,
    },
    {
        name: 'Free Reviews',
        description:
            'Access free game reviews as much as you want!',
        icon: <img src='brilliant.png' alt='review' className='h-10 w-10' />,
    },
    {
        name: 'Chat with Friends Only',
        description:
            'Enjoy a safe and private chatting experience. Chat is enabled only between friends, so your conversations stay meaningful and secure.',
        icon: <img src='book.png' alt='chat' className='h-10 w-10' />,
    },
    {
        name: 'Search & Add Friends',
        description:
            'Easily search for usernames and send friend requests. Build your chess network and challenge your friends anytime.',
        icon: <img src='excellent.png' alt='add friend' className='h-10 w-10' />,
    },
    {
        name: 'Play with Bots',
        description:
            'Practice and improve your skills by playing against computer bots of varying difficulty levels.',
        icon: <img src='good.png' alt='bot' className='h-10 w-10' />,
    },
];

export default function Features() {
    return (
        <div className="bg-black py-16 overflow-x-hidden w-screen">
            <div className='px-4'>
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Why Choose FreeChess?</h2>
                    <p className="text-xl text-gray-300 mb-12">
                        FreeChess offers everything you need to master chess, all in one place.
                    </p>
                </div>

                <div className="flex min-h-screen w-full items-center justify-center flex-wrap sm:flex-col-reverse flex-col">
                    {features.map((feature) => (
                        <div
                            key={feature.name}
                            className="bg-gray-800 rounded-lg my-6 p-6 hover:bg-gray-700 transition duration-300 transform hover:scale-105 h-60 w-full md:w-1/2 lg:w-1/3 xl:w-1/4 items-center justify-center flex flex-col"
                        >
                            <div className="text-4xl mb-4 text-blue-500">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.name}</h3>
                            <p className="text-gray-300">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}