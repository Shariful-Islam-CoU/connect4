import { useState } from 'react'
import Header from './header/header'
import './App.css'
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Login from '../src/pages/login.tsx';
import Signup from '../src/pages/signup.tsx';
import Game from '../src/pages/game.tsx';
import Home from '../src/pages/home.tsx';
import socket from '../../server/socket.ts';

function App() {

  const playerName = localStorage.getItem('username');

  return (
    <div className='container'>
      <Header />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={playerName ? <Navigate to="/home" /> : <Login />} />
          <Route path="/signup" element={playerName ? <Navigate to="/home" /> : <Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
