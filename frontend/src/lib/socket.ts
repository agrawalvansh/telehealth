import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket;

export const initSocket = (userId: string) => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        withCredentials: true,
    });

    socket.on('connect', () => {
        console.log('🔌 Connected to socket server');
        socket.emit('join', `user_${userId}`);
        socket.emit('join', 'doctors_list'); // Room for global doctor list updates
        if (userId.includes('doctor')) { // Simplistic check, role based is better
            socket.emit('join', 'doctors');
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from socket server');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null as any;
    }
};
