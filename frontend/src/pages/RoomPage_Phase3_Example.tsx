/**
 * EXEMPLO DE INTEGRAÇÃO - RoomPage com Phase 3
 * Este arquivo mostra como integrar:
 * - MusicPlayer (reprodução de música)
 * - SongSelector (seleção de música)
 * - useAdvancedScoring (análise musical avançada)
 * - RoomLeaderboard (placar da sala)
 */

import { useEffect, useState } from 'react';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useSongPlayer, Song } from '../hooks/useSongPlayer';
import { useAdvancedScoring } from '../hooks/useAdvancedScoring';
import MusicPlayer from '../components/MusicPlayer';
import SongSelector from '../components/SongSelector';
import RoomLeaderboard, { LeaderboardEntry } from '../components/RoomLeaderboard';

// =========================================================
// EXEMPLO DE ESTRUTURA - NÃO EXECUTE DIRETAMENTE
// =========================================================

interface Performance {
  userId: string;
  username: string;
  songId: string;
  score: number;
  timestamp: Date;
}

export default function RoomPagePhase3Example() {
  // ─────────────────────────────────────────────────────
  // 1. Estado da Música
  // ─────────────────────────────────────────────────────
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      duration: 355,
      youtubeId: 'fJ9rUzIMt7o',
      lyrics: [
        'Is this the real life?',
        'Is this just fantasy?',
        'Caught in a landslide...',
      ],
    },
    {
      id: '2',
      title: 'Someone Like You',
      artist: 'Adele',
      duration: 285,
      audioUrl: 'https://example.com/adele.mp3',
      lyrics: ['I heard that you\'re settled down...'],
    },
    // ... mais músicas
  ]);

  // ─────────────────────────────────────────────────────
  // 2. Reprodução de Música
  // ─────────────────────────────────────────────────────
  const { state: playerState, play, pause, seek, setVolume } = useSongPlayer({
    song: selectedSong,
    onTimeUpdate: (currentTime) => {
      // Sincronizar timing com análise de áudio
    },
    onSync: (currentTime) => {
      // Recebeu sincronização do servidor
    },
  });

  // ─────────────────────────────────────────────────────
  // 3. Captura de Áudio e Análise
  // ─────────────────────────────────────────────────────
  const {
    isCapturing,
    frequencyData,
    startCapture,
    stopCapture,
  } = useAudioCapture();

  // ─────────────────────────────────────────────────────
  // 4. Análise Avançada (Timing Musical, BPM, Ritmo)
  // ─────────────────────────────────────────────────────
  const {
    metrics,
    comparison,
    updateAdvancedMetrics,
    calculateComparison,
    generateAdvancedFeedback,
  } = useAdvancedScoring();

  // Atualizar métricas quando áudio é capturado
  useEffect(() => {
    if (frequencyData && isCapturing) {
      // Valores simulados - na prática viriam de useAudioCapture
      updateAdvancedMetrics(
        75 + Math.random() * 20, // pitch
        60 + Math.random() * 30, // energy
        50 + Math.random() * 40, // vibrato
        80 + Math.random() * 15, // timing
        frequencyData
      );
    }
  }, [frequencyData, isCapturing, updateAdvancedMetrics]);

  // ─────────────────────────────────────────────────────
  // 5. Estado do Placar
  // ─────────────────────────────────────────────────────
  const [performances, setPerformances] = useState<Performance[]>([
    {
      userId: 'user1',
      username: 'João Silva',
      songId: '1',
      score: 87.5,
      timestamp: new Date(),
    },
    {
      userId: 'user2',
      username: 'Maria Santos',
      songId: '2',
      score: 92.0,
      timestamp: new Date(),
    },
  ]);

  const [currentUserId] = useState('current_user_id');

  // Converter performances para entries do leaderboard
  const leaderboardEntries: LeaderboardEntry[] = [
    ...new Map(
      performances.map((perf) => [
        perf.userId,
        {
          userId: perf.userId,
          username: perf.username,
          score: perf.score,
          performances: performances.filter(
            (p) => p.userId === perf.userId
          ).length,
          averageScore:
            performances
              .filter((p) => p.userId === perf.userId)
              .reduce((sum, p) => sum + p.score, 0) /
            performances.filter((p) => p.userId === perf.userId).length,
          badges: [],
        },
      ])
    ).values(),
  ];

  // ─────────────────────────────────────────────────────
  // 6. Fluxo de Apresentação Completa
  // ─────────────────────────────────────────────────────

  const handleStartSinging = async () => {
    if (!selectedSong) {
      alert('Selecione uma música primeiro!');
      return;
    }

    try {
      // 1. Iniciar reprodução da música
      await play();

      // 2. Iniciar captura de áudio do microfone
      await startCapture();

      // 3. (WebSocket enviaria evento "start_singing" para sala)
      console.log('🎤 Começando a cantar:', selectedSong.title);
    } catch (error) {
      console.error('Erro ao iniciar:', error);
    }
  };

  const handleStopSinging = async () => {
    // 1. Parar reprodução
    pause();

    // 2. Parar captura de áudio
    stopCapture();

    // 3. Salvar performance
    const newPerformance: Performance = {
      userId: currentUserId,
      username: 'You',
      songId: selectedSong?.id || '',
      score: metrics.overallScore,
      timestamp: new Date(),
    };

    setPerformances([...performances, newPerformance]);

    // 4. Calcular comparação com sala
    calculateComparison(metrics.overallScore, performances);

    // 5. (WebSocket enviaria evento "stop_singing" com score)
    console.log('🎤 Apresentação finalizada. Score:', metrics.overallScore);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🎤 Sala de Karaokê - Phase 3
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══════════════════════════════════════════════════════ */}
        {/* COLUNA 1: Seleção de Música + Player */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Música */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              🎵 Escolha uma Música
            </h2>
            <SongSelector
              songs={availableSongs}
              onSongSelected={setSelectedSong}
            />
          </div>

          {/* Player de Música */}
          {selectedSong && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                ▶️ Player
              </h2>
              <MusicPlayer
                song={selectedSong}
                isActive={true}
                onTimeUpdate={(time) => {
                  // Sincronizar com análise se necessário
                }}
              />

              {/* Controles de Cantar */}
              <div className="mt-4 flex gap-3">
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

          {/* Métricas em Tempo Real (durante captura) */}
          {isCapturing && (
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                📊 Sua Pontuação em Tempo Real
              </h2>

              <div className="space-y-4">
                {/* Score Geral - Grande e Destacado */}
                <div className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {Math.round(metrics.overallScore)}
                  </div>
                  <p className="text-gray-300 mt-2">Score Geral</p>
                </div>

                {/* Grid de Métricas */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Afinação */}
                  <div className="bg-black/30 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Afinação</span>
                      <span className="font-bold text-purple-400">
                        {metrics.pitch}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${metrics.pitch}%` }}
                      />
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="bg-black/30 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Volume</span>
                      <span className="font-bold text-pink-400">
                        {metrics.energy}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-pink-500 transition-all"
                        style={{ width: `${metrics.energy}%` }}
                      />
                    </div>
                  </div>

                  {/* Vibrato */}
                  <div className="bg-black/30 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Vibrato</span>
                      <span className="font-bold text-blue-400">
                        {metrics.vibrato}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${metrics.vibrato}%` }}
                      />
                    </div>
                  </div>

                  {/* Sincronismo com Batida */}
                  <div className="bg-black/30 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Sincronismo</span>
                      <span className="font-bold text-green-400">
                        {metrics.musicalTiming.beatStrength}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${metrics.musicalTiming.beatStrength}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Musicais */}
                <div className="bg-black/30 rounded p-3">
                  <p className="text-sm text-gray-400">
                    🎼 BPM Detectado:{' '}
                    <span className="font-semibold text-white">
                      {metrics.musicalTiming.bpm}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    🎶 Precisão Rítmica:{' '}
                    <span className="font-semibold text-white">
                      {metrics.musicalTiming.rhythmAccuracy}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback após Parar */}
          {!isCapturing && metrics.overallScore > 0 && (
            <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">
                💬 Feedback da Sua Apresentação
              </h3>
              <div className="space-y-2">
                {generateAdvancedFeedback(metrics).map((feedback, idx) => (
                  <p key={idx} className="text-blue-100 text-sm">
                    {feedback}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* COLUNA 2: Placar e Comparação */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            🏆 Placar da Sala
          </h2>
          <RoomLeaderboard
            entries={leaderboardEntries}
            currentUserId={currentUserId}
          />

          {/* Comparação com Sala */}
          {comparison && (
            <div className="mt-6 pt-6 border-t border-gray-700 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                📈 Sua Posição
              </h3>

              <div className="bg-gray-700 rounded p-3">
                <p className="text-xs text-gray-400">Seu Score</p>
                <p className="text-2xl font-bold text-purple-400">
                  {comparison.yourScore}
                </p>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <p className="text-xs text-gray-400">Média da Sala</p>
                <p className="text-2xl font-bold text-pink-400">
                  {comparison.averageRoomScore}
                </p>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <p className="text-xs text-gray-400">Melhor Score</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {comparison.bestRoomScore}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// RESUMO DO FLUXO PHASE 3
// =========================================================
/*
FLUXO DE UMA APRESENTAÇÃO COMPLETA:

1. SELEÇÃO (SongSelector)
   ├─ Usuário busca e seleciona uma música
   ├─ Vê detalhes (duração, artista, disponibilidade)
   └─ Música é carregada

2. REPRODUÇÃO (MusicPlayer + useSongPlayer)
   ├─ Música começa a tocar
   ├─ Player mostra progresso, timeline, controles
   ├─ Volume e playback rate ajustáveis
   └─ Sincronização automática se necessário

3. CAPTURA DE ÁUDIO (useAudioCapture)
   ├─ Microfone é ativado
   ├─ Áudio do usuário é capturado em tempo real
   └─ Dados de frequência enviados para análise

4. ANÁLISE AVANÇADA (useAdvancedScoring)
   ├─ Detecta BPM da performance
   ├─ Calcula sincronismo com batida (beat strength)
   ├─ Avalia precisão rítmica
   ├─ Verifica consistência de tempo
   ├─ Combina com métricas básicas (pitch, energy, vibrato)
   └─ Gera score final: 35% pitch + 15% energy + 10% vibrato + 10% timing + 15% beat + 10% rhythm + 5% tempo

5. COMPARAÇÃO (calculateComparison)
   ├─ Compara score do usuário com outros na sala
   ├─ Calcula ranking
   ├─ Mostra média e melhor score da sala
   └─ Fornece contexto de desempenho

6. FEEDBACK (generateAdvancedFeedback)
   ├─ Análise específica de afinação
   ├─ Avalia energia vocal
   ├─ Comenta sobre sincronismo musical
   ├─ Fornece dicas para melhoria
   └─ Parabéns baseado em performance

7. PLACAR (RoomLeaderboard)
   ├─ Atualiza ranking em tempo real
   ├─ Distribui badges (Ouro, Prata, Bronze, etc)
   ├─ Mostra estatísticas gerais da sala
   └─ Usuário vê sua posição e progresso

FLUXO WEBSOCKET (não mostrado aqui, mas necessário):
- start_singing: Notifica sala que começou
- audio_metrics: Envia métricas em tempo real
- stop_singing: Finaliza com score
- sync_players: Sincroniza reprodução entre usuários
- leaderboard_update: Atualiza ranking

*/
