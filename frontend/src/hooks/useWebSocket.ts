import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onJoinRoom?: (data: any) => void;
  onPerformanceStarted?: (data: any) => void;
  onScoreUpdate?: (data: any) => void;
  onPerformanceEnded?: (data: any) => void;
  onRatingAdded?: (data: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      options.onDisconnect?.();
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      options.onError?.(error);
    });

    socket.on('room_joined', (data) => {
      console.log('Joined room:', data);
      options.onJoinRoom?.(data);
    });

    socket.on('performance_started', (data) => {
      console.log('Performance started:', data);
      options.onPerformanceStarted?.(data);
    });

    socket.on('score_update', (data) => {
      console.log('Score update:', data);
      options.onScoreUpdate?.(data);
    });

    socket.on('performance_ended', (data) => {
      console.log('Performance ended:', data);
      options.onPerformanceEnded?.(data);
    });

    socket.on('rating_added', (data) => {
      console.log('Rating added:', data);
      options.onRatingAdded?.(data);
    });

    socket.on('user_joined', (data) => {
      console.log('User joined:', data);
      options.onUserJoined?.(data);
    });

    socket.on('user_left', (data) => {
      console.log('User left:', data);
      options.onUserLeft?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [options]);

  return socketRef.current;
}
