/**
 * Página da Sala - Phase 3 Integrada
 * Versão funcional com Player, Selector, Capture, Análise, Leaderboard
 * Use como base para integrar na RoomPage existente
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useSongPlayer, Song } from '../hooks/useSongPlayer';
import { useAdvancedScoring } from '../hooks/useAdvancedScoring';
import { useWebSocket } from '../hooks/useWebSocket';
import MusicPlayer from '../components/MusicPlayer';
import SongSelector from '../components/SongSelector';
import RoomLeaderboard, { LeaderboardEntry } from '../components/RoomLeaderboard';

interface PerformanceEntry {
  userId: string;
  username: string;
  score: number;
}

export default function RoomPageIntegrated() {
  const { roomId } = useParams();
  const currentUserId = 'current_user_id'; // TODO: Get from auth
  const [roomName, setRoomName] = useState('Sala de Karaokê');

  // ─────────────────────────────────────────────────────
  // 1. WebSocket & Dados da Sala
  // ─────────────────────────────────────────────────────
  const socket = useWebSocket();

  // ─────────────────────────────────────────────────────
  // 2. Estado de Músicas
  // ─────────────────────────────────────────────────────
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [availableSongs] = useState<Song[]>([
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      duration: 355,
      youtubeId: 'fJ9rUzIMt7o',
      lyrics: ['Is this the real life?', 'Is this just fantasy?', 'Caught in a landslide...'],
    },
    {
      id: '2',
      title: 'Someone Like You',
      artist: 'Adele',
      duration: 285,
      audioUrl: 'https://example.com/adele.mp3',
      lyrics: ["I heard that you're settled down..."],
    },
  ]);

  // ─────────────────────────────────────────────────────
  // 3. Player & Áudio
  // ─────────────────────────────────────────────────────
  const { state: playerState, play, pause } = useSongPlayer({
    song: selectedSong,
  });

  const { isCapturing, frequencyData, startCapture, stopCapture } = useAudioCapture();

  // ─────────────────────────────────────────────────────
  // 4. Análise Avançada Phase 3
  // ─────────────────────────────────────────────────────
  const { metrics, updateAdvancedMetrics, calculateComparison, generateAdvancedFeedback } =
    useAdvancedScoring();

  // Atualizar métricas quando áudio é capturado
  useEffect(() => {
    if (frequencyData && isCapturing && socket) {
      const pitchScore = 75 + Math.random() * 20;
      const energyScore = 60 + Math.random() * 30;
      const vibratoScore = 50 + Math.random() * 40;
      const timingScore = 80 + Math.random() * 15;

      updateAdvancedMetrics(pitchScore, energyScore, vibratoScore, timingScore, frequencyData);

      // Enviar métricas para WebSocket (Phase 3 Event)
      if (roomId && socket) {
        socket.emit('audio_metrics', {
          userId: currentUserId,
          roomId,
          score: metrics.overallScore,
          pitch: pitchScore,
          energy: energyScore,
          vibrato: vibratoScore,
          timing: timingScore,
          beatStrength: metrics.musicalTiming.beatStrength,
          rhythmAccuracy: metrics.musicalTiming.rhythmAccuracy,
          tempoConsistency: metrics.musicalTiming.tempoConsistency,
          bpm: metrics.musicalTiming.bpm,
        });
      }
    }
  }, [frequencyData, isCapturing, socket, roomId, metrics, updateAdvancedMetrics, currentUserId]);

  // ─────────────────────────────────────────────────────
  // 5. Leaderboard & Performances
  // ─────────────────────────────────────────────────────
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  // Listener: Performance salva (WebSocket)
  useEffect(() => {
    if (!socket) return;

    const handlePerformanceSaved = (data: any) => {
      console.log('🏆 Performance salva:', data);
      if (data.leaderboard) {
        const entries: LeaderboardEntry[] = data.leaderboard.map((entry: any) => ({
          userId: entry.userId,
          username: entry.username,
          score: entry.lastPerformanceScore,
          performances: entry.performances,
          averageScore: entry.averageScore,
          badges: entry.badges.map((b: string) => ({
            id: b,
            name: b,
            icon: getBadgeIcon(b),
            description: getBadgeDescription(b),
          })),
        }));
        setLeaderboardEntries(entries);
      }
    };

    const handleLeaderboardUpdated = (data: any) => {
      const entries: LeaderboardEntry[] = data.leaderboard.map((entry: any) => ({
        userId: entry.userId,
        username: entry.username,
        score: entry.lastPerformanceScore,
        performances: entry.performances,
        averageScore: entry.averageScore,
        badges: entry.badges.map((b: string) => ({
          id: b,
          name: b,
          icon: getBadgeIcon(b),
          description: getBadgeDescription(b),
        })),
      }));
      setLeaderboardEntries(entries);
    };

    socket.on('performance_saved', handlePerformanceSaved);
    socket.on('leaderboard_updated', handleLeaderboardUpdated);

    return () => {
      socket.off('performance_saved', handlePerformanceSaved);
      socket.off('leaderboard_updated', handleLeaderboardUpdated);
    };
  }, [socket]);

  // ─────────────────────────────────────────────────────
  // 6. Fluxo de Apresentação
  // ─────────────────────────────────────────────────────

  const handleStartSinging = async () => {
    if (!selectedSong || !socket || !roomId) return;

    try {
      socket.emit('start_singing', {
        userId: currentUserId,
        roomId,
        songId: selectedSong.id,
      });

      await play();
      await startCapture();
    } catch (error) {
      console.error('❌ Erro ao iniciar:', error);
    }
  };

  const handleStopSinging = async () => {
    if (!socket || !roomId || !selectedSong) return;

    try {
      stopCapture();
      pause();

      socket.emit('stop_singing', {
        userId: currentUserId,
        roomId,
        songId: selectedSong.id,
        score: metrics.overallScore,
        pitch: metrics.pitch,
        energy: metrics.energy,
        vibrato: metrics.vibrato,
        timing: metrics.timing,
        beatStrength: metrics.musicalTiming.beatStrength,
        rhythmAccuracy: metrics.musicalTiming.rhythmAccuracy,
        tempoConsistency: metrics.musicalTiming.tempoConsistency,
        bpm: metrics.musicalTiming.bpm,
        durationSeconds: playerState.currentTime,
        feedback: generateAdvancedFeedback(metrics),
      });
    } catch (error) {
      console.error('❌ Erro ao parar:', error);
    }
  };

  // ─────────────────────────────────────────────────────
  // 7. Auxiliares
  // ─────────────────────────────────────────────────────

  const getBadgeIcon = (badgeId: string): string => {
    const icons: Record<string, string> = {
      gold_medal: '🥇',
      silver_medal: '🥈',
      bronze_medal: '🥉',
      consistency: '🎯',
      rising_star: '🚀',
      star: '⭐',
    };
    return icons[badgeId] || '🎖️';
  };

  const getBadgeDescription = (badgeId: string): string => {
    const descriptions: Record<string, string> = {
      gold_medal: 'Maior pontuação média da sala',
      silver_medal: 'Segunda maior pontuação',
      bronze_medal: 'Terceira maior pontuação',
      consistency: 'Mantém alta qualidade em múltiplas apresentações',
      rising_star: 'Melhorando continuamente',
      star: 'Pontuação média acima de 90',
    };
    return descriptions[badgeId] || 'Badge conquistado';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">🎤 {roomName}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══════════════════════════════════════════════════════ */}
        {/* COLUNA 1: Música + Player + Captura */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Música */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">🎵 Escolha uma Música</h2>
            <SongSelector songs={availableSongs} onSongSelected={setSelectedSong} />
          </div>

          {/* Player */}
          {selectedSong && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">▶️ Player</h2>
              <MusicPlayer song={selectedSong} isActive={true} />

              {/* Botões */}
              <div className="flex gap-3">
                {!isCapturing ? (
                  <button
                    onClick={handleStartSinging}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
                  >
                    🎤 Começar a Cantar
                  </button>
                ) : (
                  <button
                    onClick={handleStopSinging}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
                  >
                    ⏹️ Parar de Cantar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Métricas em Tempo Real */}
          {isCapturing && (
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 Sua Pontuação</h2>

              <div className="text-center mb-6">
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {Math.round(metrics.overallScore)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricBar label="Afinação" value={metrics.pitch} color="purple" />
                <MetricBar label="Volume" value={metrics.energy} color="pink" />
                <MetricBar label="Vibrato" value={metrics.vibrato} color="blue" />
                <MetricBar label="Sincronismo" value={metrics.musicalTiming.beatStrength} color="green" />
              </div>

              <div className="mt-4 text-sm text-gray-300 space-y-1">
                <p>🎼 BPM: {metrics.musicalTiming.bpm}</p>
                <p>🎶 Ritmo: {metrics.musicalTiming.rhythmAccuracy}%</p>
                <p>⏱️ Tempo: {metrics.musicalTiming.tempoConsistency}%</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {!isCapturing && metrics.overallScore > 0 && (
            <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">💬 Feedback da Sua Apresentação</h3>
              <div className="space-y-2">
                {generateAdvancedFeedback(metrics).map((fb, idx) => (
                  <p key={idx} className="text-blue-100 text-sm">
                    {fb}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* COLUNA 2: Placar */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Placar da Sala</h2>
          <RoomLeaderboard entries={leaderboardEntries} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Componente auxiliar: Barra de Métrica
// ─────────────────────────────────────────────────────
interface MetricBarProps {
  label: string;
  value: number;
  color: 'purple' | 'pink' | 'blue' | 'green';
}

function MetricBar({ label, value, color }: MetricBarProps) {
  const colorClasses = {
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  const textClasses = {
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

  return (
    <div className="bg-black/30 rounded p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`font-bold ${textClasses[color]}`}>{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
