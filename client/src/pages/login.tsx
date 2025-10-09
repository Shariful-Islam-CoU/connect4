import React, { use } from 'react';
import { useState,useEffect } from 'react';
import '../css/login.css'; 
import { Link ,useNavigate} from 'react-router-dom';
import Signup from './signup.tsx';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from '../../../server/socket.ts';


const Login = () => {

 

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // const navigate = useNavigate();

      const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
         socket.emit('login', { username, password });
    };



    useEffect(() => {
      document.title = 'Log In';
        socket.on('login_response', (data) => {
          console.log("Login response:", data);
            if (data.success) {
                localStorage.setItem('username', data.username);
                window.location.href = '/home';
                window.location.replace('/home');
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        });
    }, []);



  return (

    <div className="login_bg">
        <form className="login-container" method="post">
            <div className="login-title">Log In</div>
            <input type="text" name="username" id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required/><br />
            <input type="password" name="password" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required/><br />
            <button id="loginBtn" type="submit" onClick={handleLogin}>Login</button>
            <div id="alertBox" className="alert">Incorrect username or password.</div>
            <div id="notSignedUp" className="notSignedUp">
                <span>Not signed up? </span>
                <Link to="/signup">Sign Up</Link>
            </div>
        </form>
        <ToastContainer  />
    </div>
  );
};

export default Login;
