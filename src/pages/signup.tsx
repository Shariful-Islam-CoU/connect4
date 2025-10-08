
import '../css/signup.css';
import { useState, useEffect } from 'react';
import { ToastContainer,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {Link,useNavigate} from 'react-router-dom';

import socket from '../../socket';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Sign Up';
        console.log("Socket connection status:", socket.connected);

        socket.on('signup_response', (response) => {
            
            if (response.success) {
                toast.success(response.message);
                navigate('/home', { state: { username: response.username } });
                localStorage.setItem('username', response.username);
                window.location.replace('/home');
            } else {
                console.log("Signup error:", response);
                toast.error(response.message);
            }
        });


        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('signup_response');
        };
    }, []);


    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Username:', username,password,confirmPassword);
        if(!username || !password || !confirmPassword) {
            console.log('All fields are required.');
           toast.error('All fields are required.');
            return;
        }
        if (password !== confirmPassword) {
            console.log('Passwords do not match.');
            toast.error('Passwords do not match.');
            return
        } 
        

        socket.emit('signup', { username, password });
        // socket.emit('user_signup_notice_send', username);



    };

  return (
    <div className="signup_bg">
        <div className="signin-container">
            <div className="signin-title">Sign Up</div>
            <input type="text" id="username" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} required/><br />
            <input type="password" id="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required/><br />
            <input type="password" id="confirmPassword" placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required/><br />
            <button id="signInBtn" onClick={handleSignup}>Sign Up</button>
            <ToastContainer />
        </div>
    </div>

  )
};

export default Signup;



