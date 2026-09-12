/**
 * Componente de Player de Música
 * - Controles play/pause
 * - Timeline com progresso
 * - Volume e playback rate
 * - Sincronização em tempo real
 */

import { useEffect, useState } from 'react';
import { Song, useSongPlayer } from '../hooks/useSongPlayer';

interface MusicPlayerProps {
  song: Song | null;
  isActive: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onSync?: (currentTime: number) => void;
  showLyrics?: boolean;
}

export default function MusicPlayer({
  song,
  isActive,
  onTimeUpdate,
  onSync,
  showLyrics = false,
}: MusicPlayerProps) {
  const { state, play, pause, seek, setVolume, setPlaybackRate, syncWithServer } = useSongPlayer({
    song,
    onTimeUpdate,
    onSync,
    onPlay: () => {},
    onPause: () => {},
    onEnd: () => {},
  });

  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // Formatador de tempo
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular percentual de progresso
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (!song) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Nenhuma música selecionada</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6 space-y-4">
      {/* Informações da Música */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-white">{song.title}</h3>
        <p className="text-purple-200 text-sm">{song.artist}</p>
      </div>

      {/* Visualização de Áudio (Onda) */}
      <div className="bg-black/50 rounded-lg p-4 h-16 flex items-center justify-center">
        <div className="flex gap-1 items-end h-full">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.sin(i * 0.5 + state.currentTime) * 30 + 40;
            return (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm"
                style={{
                  height: `${Math.max(10, height)}%`,
                  opacity: progress > (i / 20) * 100 ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="relative bg-gray-700 rounded-full h-2 cursor-pointer group">
          <div
            className="absolute bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `calc(${progress}% - 8px)`,
            }}
            onClick={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                const newTime = (e.clientX - rect.left) / rect.width * state.duration;
                seek(newTime);
              }
            }}
          />
        </div>

        {/* Tempos */}
        <div className="flex justify-between text-xs text-gray-300">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        {/* Play/Pause */}
        <button
          onClick={() => (state.isPlaying ? pause() : play())}
          disabled={!isActive}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition transform hover:scale-110"
        >
          {state.isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Playback Rate */}
        <select
          value={state.playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          disabled={!isActive}
          className="px-3 py-1 bg-gray-700 text-white text-sm rounded disabled:opacity-50"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>

        {/* Volume */}
        <div className="relative">
          <button
            onClick={() => setShowVolumeControl(!showVolumeControl)}
            disabled={!isActive}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50 transition"
          >
            {state.volume === 0 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C23.16 14.91 24 13.1 24 12s-.84-2.91-2.53-4.15l-1.51 1.51c.34.82.54 1.7.54 2.64zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          {/* Volume Slider */}
          {showVolumeControl && (
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-lg p-3 flex flex-col items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1"
              />
              <span className="text-xs text-gray-300">{Math.round(state.volume * 100)}%</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-400">
          {isActive ? '🎵 Ativo' : '⏸️ Aguardando'}
        </div>
      </div>

      {/* Letra (se disponível) */}
      {showLyrics && song.lyrics && song.lyrics.length > 0 && (
        <div className="bg-black/50 rounded-lg p-4 max-h-32 overflow-y-auto">
          <p className="text-center text-purple-200 text-sm italic">
            {song.lyrics[Math.floor((state.currentTime / state.duration) * song.lyrics.length)] || ''}
          </p>
        </div>
      )}
    </div>
  );
}
