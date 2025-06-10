import React from 'react'
import NavBar from '../components/NavBar'
import { useNavigate } from 'react-router-dom'

function MultiPlayer() {
    const navigate=useNavigate();
    function handleNavigation(){
        navigate('/play-online')
    }
    return (
        <>
            <NavBar />
            <div className='bg-[#1a1a1a] text-white h-screen w-screen flex items-center justify-center flex-col'>
                <h1 className='text-4xl font-bold'>Play Online</h1>
                <div className="flex-shrink-0 m-6 relative overflow-hidden bg-green-700 rounded-lg max-w-xs hover:cursor-pointer shadow-lg" onClick={handleNavigation}>
                    <svg className="absolute bottom-0 left-0 mb-8" viewBox="0 0 375 283" fill="none"
                        style={{ transform: 'scale(1.5)', opacity: '0.1' }}>
                        <rect x="159.52" y="175" width="152" height="152" rx="8" transform="rotate(-45 159.52 175)" fill="white" />
                        <rect y="107.48" width="152" height="152" rx="8" transform="rotate(-45 0 107.48)" fill="white" />
                    </svg>
                    <div className="relative pt-10 px-10 flex items-center justify-center">
                        <div className="block absolute w-48 h-48 bottom-0 left-0 -mb-24 ml-3"
                            style={{ background: 'radial-gradient(black, transparent 60%)', transform: 'rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1)', opacity: '0.2' }}>
                        </div>
                        <img className="relative h-40" src="/king.png" alt="" />
                    </div>
                    {/* <div className="relative text-white px-6 pb-6 mt-4">
                        <span className="block opacity-75 -mb-1 text-xl">Users Online:</span>
                    </div> */}
                </div>
            </div>
        </>
    )
}

export default MultiPlayer