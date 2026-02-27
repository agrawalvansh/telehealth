import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',')
        .map(url => url.trim());

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);

        socket.on('join', (room) => {
            socket.join(room);
            console.log(`👤 Client ${socket.id} joined room: ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitEvent = (room: string, event: string, data: any) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};
