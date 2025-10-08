import {io} from 'socket.io-client';

// const socket = io('http://192.168.88.30:6400',{
// const socket = io('https://connect4-server.onrender.com',{
const socket = io('https://connect4-vtzu.onrender.com',{
        autoConnect: true,
        // allow polling as a fallback when websockets are blocked by the host
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        path: '/socket.io'
});

// helpful debug logs for connection issues
socket.io.on('error', (err: any) => {
    console.error('Socket.IO client error:', err);
});
socket.on('connect_error', (err) => {
    console.error('connect_error', err);
});
socket.on('connect', () => {
    console.info('Socket connected:', socket.id);
});

export default socket;

