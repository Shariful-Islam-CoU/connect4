import {io} from 'socket.io-client';

// const socket = io('http://192.168.88.30:6400',{
// const socket = io('https://connect4-server.onrender.com',{
const socket = io('https://connect4-vtzu.onrender.com',{
    autoConnect:true,
    transports: ['websocket'],
    withCredentials:true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
});

export default socket;

