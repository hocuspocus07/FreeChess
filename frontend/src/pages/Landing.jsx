import React from 'react'
import NavBar from '../components/NavBar.jsx'
import Hero from '../components/Hero.jsx'
import Features from '../components/Features.jsx'

function Landing() {
  return (
    <div className='w-screen overflow-x-hidden'>
    <NavBar/>
    <Hero/>
    <Features/>
    </div>
  )
}

export default Landing