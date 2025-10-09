import {io} from 'socket.io-client';



const SOCKET_URL = (import.meta && (import.meta as any).env && (import.meta as any).env.DEV) ? 'https://connect4-1-dfxu.onrender.com' : undefined;

const socket = io(SOCKET_URL,{
        autoConnect: true,
        transports: ['polling','websocket'],
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
socket.on('reconnect_attempt', () => console.info('reconnect_attempt'));
socket.on('close', (reason) => console.info('socket closed', reason));

export default socket;

