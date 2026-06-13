import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false // Connect manually when needed
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
