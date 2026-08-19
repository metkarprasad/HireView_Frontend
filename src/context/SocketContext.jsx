// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // assume you have an auth context that provides JWT token

// Feature flag – read from environment at build time
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === 'true';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!ENABLE_REALTIME) return; // feature disabled
    if (!token) return; // wait for authentication

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5635', {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('🔌 Socket disconnected', reason);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Helper to join an interview room
  const joinInterview = (interviewId) => {
    if (socket) socket.emit('joinInterview', { interviewId });
  };

  const startInterview = (interviewId) => {
    if (socket) socket.emit('startInterview', { interviewId });
  };

  const submitAnswer = (interviewId, attemptId, answer) => {
    if (socket) socket.emit('submitAnswer', { interviewId, attemptId, answer });
  };

  const value = {
    socket,
    joinInterview,
    startInterview,
    submitAnswer,
    enabled: ENABLE_REALTIME,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext) || { socket: null, joinInterview: () => {}, startInterview: () => {}, submitAnswer: () => {}, enabled: false };
