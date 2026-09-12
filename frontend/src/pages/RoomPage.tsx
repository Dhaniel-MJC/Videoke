import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { extractAudioFeatures } from '../utils/audioAnalysis';
import { PerformanceAnalyzer, PerformanceMetrics } from '../utils/scoring';
import SearchSongs from '../components/SearchSongs';
import YouTubePlayer from '../components/YouTubePlayer';

interface RoomPageProps {
  onLeaveRoom: () => void;
}

interface UserPerformance {
  userId: number;
  username: string;
  score: number;
  isActive: boolean;
}

interface SelectedSong {
  youtubeId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  dbId?: number;
}

export default function RoomPage({ onLeaveRoom }: RoomPageProps) {
  const { user } = useAuthStore();
  const { currentRoom, leaveRoom } = useRoomStore();
  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [isSinging, setIsSinging] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [showSearchTab, setShowSearchTab] = useState(false);

  // Refs para análise de áudio
  const analyzerRef = useRef<PerformanceAnalyzer>(new PerformanceAnalyzer());
  const sendMetricsCounterRef = useRef(0);
  const currentPerformanceIdRef = useRef<number | null>(null);
  const currentSongIdRef = useRef<number | undefined>(undefined);

  const { isCapturing, startCapture, stopCapture, getLastMetric } = useAudioCapture({
    onMetrics: (metrics) => {
      if (isSinging && currentPerformanceIdRef.current) {
        // Adicionar ao analyzer
        const frequencyData = new Uint8Array(256);
        // Simular dados de frequência (em produção, viriam do AnalyserNode)
        for (let i = 0; i < frequencyData.length; i++) {
          frequencyData[i] = Math.random() * 256;
        }

        const features = extractAudioFeatures(frequencyData);
        analyzerRef.current.addFeatures(features);

        // Enviar métricas a cada 10 samples (menos overhead)
        sendMetricsCounterRef.current++;
        if (sendMetricsCounterRef.current >= 10) {
          const recentMetrics = analyzerRef.current.getRecentMetrics(50);
          setCurrentMetrics(recentMetrics);
          setCurrentScore(recentMetrics.overallScore);

          if (socket) {
            socket.emit('audio_metrics', {
              performanceId: currentPerformanceIdRef.current,
              pitches: [features.pitch],
              confidence: features.confidence,
              timestamp: Date.now(),
            });
          }

          sendMetricsCounterRef.current = 0;
        }
      }
    },
    onError: (error) => {
      setAudioError(error.message);
    },
  });

  const socket = useWebSocket({
    onJoinRoom: (data) => {
      setRoomMembers(data.roomMembers || []);
    },
    onPerformanceStarted: (data) => {
      setPerformances((prev) => [
        ...prev,
        { userId: data.userId, username: '', score: 0, isActive: true },
      ]);
      if (data.userId === user?.id) {
        setIsSinging(true);
        currentPerformanceIdRef.current = data.performanceId;
        analyzerRef.current.reset();
      }
    },
    onScoreUpdate: (data) => {
      setPerformances((prev) =>
        prev.map((p) =>
          p.userId === data.userId
            ? { ...p, score: data.score }
            : p
        )
      );
      if (data.userId === user?.id) {
        setCurrentScore(data.score);
      }
    },
    onPerformanceEnded: (data) => {
      setPerformances((prev) =>
        prev.map((p) =>
          p.userId === data.userId
            ? { ...p, isActive: false }
            : p
        )
      );
      if (data.userId === user?.id) {
        setIsSinging(false);
        const finalMetrics = analyzerRef.current.getMetrics();
        setFeedback(analyzerRef.current.generateFeedback());
        stopCapture();
      }
    },
    onUserJoined: (data) => {
      setRoomMembers(data.roomMembers || []);
    },
    onUserLeft: () => {
      // Handle user left
    },
  });

  const handleLeaveRoom = () => {
    stopCapture();
    if (socket) {
      socket.disconnect();
    }
    leaveRoom();
    onLeaveRoom();
  };

  const handleStartSinging = async () => {
    try {
      if (!selectedSong) {
        setAudioError('Por favor, selecione uma música primeiro');
        return;
      }

      setAudioError(null);
      setFeedback([]);
      setCurrentMetrics(null);

      // Iniciar captura de áudio
      await startCapture();

      if (socket && currentRoom) {
        currentSongIdRef.current = selectedSong.dbId;
        socket.emit('start_singing', {
          roomId: currentRoom.id,
          songId: selectedSong.dbId || selectedSong.youtubeId,
          songTitle: `${selectedSong.title} - ${selectedSong.artist}`,
          youtubeId: selectedSong.youtubeId,
        });
      }
    } catch (error) {
      setAudioError('Erro ao iniciar captura de áudio');
      console.error('Start singing error:', error);
    }
  };

  const handleStopSinging = async () => {
    stopCapture();

    if (socket && currentRoom && currentPerformanceIdRef.current) {
      socket.emit('end_singing', {
        roomId: currentRoom.id,
        performanceId: currentPerformanceIdRef.current,
        songId: currentSongIdRef.current,
        youtubeId: selectedSong?.youtubeId,
      });
    }
  };

  const handleSingSong = (song: any) => {
    setSelectedSong({
      youtubeId: song.youtubeId,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      thumbnailUrl: song.thumbnailUrl,
      dbId: song.id,
    });
    setShowSearchTab(false);
  };

  const handleYouTubePlayerEnd = () => {
    if (isSinging) {
      handleStopSinging();
    }
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Carregando sala...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">{currentRoom.name}</h1>
            <p className="text-gray-400">Sala de Videoke</p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
          >
            Sair da Sala
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setShowSearchTab(!showSearchTab)}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    showSearchTab
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🔍 Buscar Música
                </button>
                {selectedSong && (
                  <button
                    onClick={() => setShowSearchTab(false)}
                    className="px-4 py-2 rounded-lg font-bold bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                  >
                    ▶️ Vídeo
                  </button>
                )}
              </div>

              {/* Search Tab */}
              {showSearchTab ? (
                <div className="mb-6">
                  <SearchSongs
                    userId={user?.id || 0}
                    onSingSong={handleSingSong}
                  />
                </div>
              ) : (
                <>
                  {/* Video Player or Placeholder */}
                  {selectedSong ? (
                    <div className="mb-6">
                      <YouTubePlayer
                        youtubeId={selectedSong.youtubeId}
                        title={selectedSong.title}
                        artist={selectedSong.artist}
                        autoplay={false}
                        onEnded={handleYouTubePlayerEnd}
                      />
                    </div>
                  ) : (
                    <div className="bg-black rounded-lg aspect-video mb-6 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">📺 Nenhuma música selecionada</p>
                        <p className="text-gray-600 text-sm">Clique em "Buscar Música" para começar</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error Message */}
              {audioError && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                  <p className="text-red-200 text-sm">⚠️ {audioError}</p>
                </div>
              )}

              {/* Score Display */}
              {isSinging && (
                <div className="bg-purple-900/50 border border-purple-500 rounded-lg p-6 mb-6">
                  <div className="text-center mb-4">
                    <p className="text-gray-300 text-sm mb-2">Sua Pontuação em Tempo Real</p>
                    <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                      {Math.round(currentScore)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isCapturing ? '🎤 Capturando áudio...' : '⏸️ Sem áudio'}
                    </p>
                  </div>

                  {/* Detailed Metrics */}
                  {currentMetrics && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-4">
                      <div className="bg-gray-700/50 p-2 rounded">
                        <p className="text-gray-500">Afinação</p>
                        <p className="font-bold text-purple-300">{currentMetrics.pitchAccuracy}%</p>
                      </div>
                      <div className="bg-gray-700/50 p-2 rounded">
                        <p className="text-gray-500">Volume</p>
                        <p className="font-bold text-pink-300">{currentMetrics.energyConsistency}%</p>
                      </div>
                      <div className="bg-gray-700/50 p-2 rounded">
                        <p className="text-gray-500">Vibrato</p>
                        <p className="font-bold text-blue-300">{currentMetrics.vibrato}%</p>
                      </div>
                      <div className="bg-gray-700/50 p-2 rounded">
                        <p className="text-gray-500">Timing</p>
                        <p className="font-bold text-green-300">{currentMetrics.timing}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {feedback.length > 0 && (
                <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4 mb-6">
                  <p className="text-blue-200 text-sm font-bold mb-2">Feedback:</p>
                  <ul className="space-y-1">
                    {feedback.map((f, idx) => (
                      <li key={idx} className="text-blue-300 text-sm">{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Singing Controls */}
              {!showSearchTab && (
                <div className="space-y-4">
                  {!isSinging ? (
                    <button
                      onClick={handleStartSinging}
                      disabled={!selectedSong}
                      className={`w-full py-4 font-bold rounded-lg transition ${
                        selectedSong
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      🎤 Começar a Cantar
                    </button>
                  ) : (
                    <button
                      onClick={handleStopSinging}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                    >
                      ⏹️ Parar de Cantar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Members & Performances */}
          <div className="space-y-6">
            {/* Members */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">👥 Membros</h2>
              <div className="space-y-2">
                {roomMembers.length > 0 ? (
                  roomMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2 p-2 bg-gray-700 rounded"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-300 text-sm">{member.username}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum membro na sala</p>
                )}
              </div>
            </div>

            {/* Performances */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎵 Apresentações</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {performances.length > 0 ? (
                  performances.map((perf, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${
                        perf.isActive
                          ? 'bg-purple-900/30 border-purple-500'
                          : 'bg-gray-700/50 border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-gray-300 text-sm">{perf.username}</p>
                        <span className="text-purple-400 font-bold">
                          {Math.round(perf.score)} pts
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma apresentação ainda</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
