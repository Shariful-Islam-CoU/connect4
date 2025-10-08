import {io} from 'socket.io-client';

const socket = io('http://192.168.88.30:6400',{
    autoConnect:true,
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
});

export default socket;

