import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

export const socket = io(SOCKET_SERVER_URL);

socket.on('connect', () => {
  console.log('Socket.IO client connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket.IO client disconnected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket.IO client connection error:', err.message);
});
