/**
 * YouTubePlayer - Reproduz vídeos do YouTube com controle de áudio
 * Integração com Phase 3 para captura de áudio
 */

import React, { useEffect, useRef, useState } from 'react';
import styles from './YouTubePlayer.module.css';

interface YouTubePlayerProps {
  youtubeId: string;
  title: string;
  artist: string;
  autoplay?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

// Injetar YouTube IFrame API se não existir
const injectYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.defer = true;

    (window as any).onYouTubeIframeAPIReady = () => {
      resolve();
    };

    document.head.appendChild(script);
  });
};

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  youtubeId,
  title,
  artist,
  autoplay = false,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onError,
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar YouTube IFrame API
  useEffect(() => {
    const initPlayer = async () => {
      try {
        await injectYouTubeAPI();

        if (!youtubePlayerRef.current && playerRef.current) {
          youtubePlayerRef.current = new (window as any).YT.Player(
            playerRef.current,
            {
              height: '100%',
              width: '100%',
              videoId: youtubeId,
              playerVars: {
                autoplay: autoplay ? 1 : 0,
                controls: 1,
                modestbranding: 1,
              },
              events: {
                onReady: () => {
                  setIsReady(true);
                  setDuration(youtubePlayerRef.current.getDuration());
                  onReady?.();
                },
                onStateChange: (event: any) => {
                  // 0 = ended, 1 = playing, 2 = paused, 3 = buffering
                  if (event.data === 1) {
                    setIsPlaying(true);
                    onPlay?.();
                    startTimeUpdate();
                  } else if (event.data === 2) {
                    setIsPlaying(false);
                    onPause?.();
                    stopTimeUpdate();
                  } else if (event.data === 0) {
                    setIsPlaying(false);
                    onEnded?.();
                    stopTimeUpdate();
                  }
                },
                onError: (event: any) => {
                  const errorCode = event.data;
                  const errorMsg = getErrorMessage(errorCode);
                  console.error('YouTube Player Error:', errorMsg);
                  onError?.(errorMsg);
                },
              },
            }
          );
        }
      } catch (error) {
        console.error('Erro ao inicializar YouTube Player:', error);
        onError?.('Erro ao carregar YouTube Player');
      }
    };

    initPlayer();

    return () => {
      stopTimeUpdate();
    };
  }, [youtubeId, autoplay, onReady, onPlay, onPause, onEnded, onError]);

  const startTimeUpdate = () => {
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

    updateIntervalRef.current = setInterval(() => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
        setCurrentTime(youtubePlayerRef.current.getCurrentTime());
      }
    }, 100);
  };

  const stopTimeUpdate = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  const play = () => {
    if (youtubePlayerRef.current && youtubePlayerRef.current.playVideo) {
      youtubePlayerRef.current.playVideo();
    }
  };

  const pause = () => {
    if (youtubePlayerRef.current && youtubePlayerRef.current.pauseVideo) {
      youtubePlayerRef.current.pauseVideo();
    }
  };

  const seek = (seconds: number) => {
    if (youtubePlayerRef.current && youtubePlayerRef.current.seekTo) {
      youtubePlayerRef.current.seekTo(seconds);
    }
  };

  const getErrorMessage = (code: number): string => {
    const messages: { [key: number]: string } = {
      2: 'Parâmetro inválido',
      5: 'Erro de HTML5 player',
      100: 'Vídeo não encontrado',
      101: 'Vídeo não pode ser reproduzido incorporado',
      150: 'Vídeo não pode ser reproduzido incorporado (erro 101)',
    };
    return messages[code] || 'Erro desconhecido no YouTube Player';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.container}>
      {/* Header com info da música */}
      <div className={styles.header}>
        <div className={styles.info}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.artist}>{artist}</p>
        </div>
      </div>

      {/* Player YouTube */}
      <div className={styles.playerWrapper}>
        <div
          ref={playerRef}
          className={styles.playerContainer}
          id="youtube-player"
        />
      </div>

      {/* Controles customizados */}
      {isReady && (
        <div className={styles.controls}>
          {/* Play/Pause */}
          <button
            className={styles.playBtn}
            onClick={() => (isPlaying ? pause() : play())}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? '⏸️ Pausar' : '▶️ Reproduzir'}
          </button>

          {/* Timeline */}
          <div className={styles.timeline}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className={styles.progressBar}
              style={{
                backgroundSize: `${progressPercent}% 100%`,
              }}
            />
          </div>

          {/* Tempo */}
          <div className={styles.time}>
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!isReady && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Carregando vídeo...</p>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
