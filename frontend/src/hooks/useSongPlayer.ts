/**
 * Hook para reprodução de música com sincronização
 * Suporta: YouTube, MP3, WAV, OGG
 * Sincronização via WebSocket para multi-user
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // segundos
  youtubeId?: string;
  audioUrl?: string;
  lyrics?: string[];
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

interface UseSongPlayerProps {
  song: Song | null;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onSync?: (currentTime: number) => void;
}

export function useSongPlayer({
  song,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnd,
  onSync,
}: UseSongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
  });

  // Inicializar áudio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, []);

  // Carregar música
  useEffect(() => {
    if (!song || !audioRef.current) return;

    const audioUrl = song.audioUrl || (song.youtubeId ? `https://www.youtube.com/watch?v=${song.youtubeId}` : '');

    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [song]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;

    setState((prev) => ({
      ...prev,
      currentTime: audioRef.current!.currentTime,
    }));

    onTimeUpdate?.(audioRef.current.currentTime);
  }, [onTimeUpdate]);

  const handlePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
    onEnd?.();
  }, [onEnd]);

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;

    setState((prev) => ({
      ...prev,
      duration: audioRef.current!.duration || 0,
    }));
  }, []);

  // Controles
  const play = useCallback(async () => {
    try {
      await audioRef.current?.play();
    } catch (error) {
      console.error('Erro ao reproduzir:', error);
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
      setState((prev) => ({ ...prev, currentTime: audioRef.current!.currentTime }));
      onSync?.(audioRef.current.currentTime);
    }
  }, [state.duration, onSync]);

  const setVolume = useCallback((volume: number) => {
    const v = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
    setState((prev) => ({ ...prev, volume: v }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const r = Math.max(0.5, Math.min(2, rate));
    if (audioRef.current) {
      audioRef.current.playbackRate = r;
    }
    setState((prev) => ({ ...prev, playbackRate: r }));
  }, []);

  // Sincronizar com outros usuários
  const syncWithServer = useCallback((serverTime: number) => {
    if (!audioRef.current) return;

    const diff = Math.abs(audioRef.current.currentTime - serverTime);

    // Se diferença > 200ms, sincronizar
    if (diff > 0.2) {
      audioRef.current.currentTime = serverTime;
      setState((prev) => ({ ...prev, currentTime: serverTime }));
    }
  }, []);

  return {
    state,
    audioRef,
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    syncWithServer,
  };
}
