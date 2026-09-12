/**
 * Eventos WebSocket para Phase 3 - Performance
 * Listeners para: start_singing, audio_metrics, stop_singing
 */

import { Socket } from 'socket.io';
import { PerformanceHandler, PerformanceData } from '../handlers/performanceHandler';

export function registerPerformanceEvents(
  socket: Socket,
  performanceHandler: PerformanceHandler
) {
  /**
   * 🎤 Evento: Usuário começou a cantar
   * Cliente envia quando: Clica "Começar a Cantar"
   */
  socket.on('start_singing', async (data: {
    userId: string;
    roomId: string;
    songId: string;
  }) => {
    try {
      console.log(`🎤 [start_singing] ${data.userId} em ${data.roomId}`);

      await performanceHandler.handlePerformanceStart(socket, data);

      // Confirmar para o cliente
      socket.emit('singing_started', {
        status: 'ok',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ Erro em start_singing:', error);
      socket.emit('error', { message: 'Erro ao iniciar apresentação' });
    }
  });

  /**
   * 📊 Evento: Atualização de métricas de áudio em tempo real
   * Cliente envia: A cada 100-200ms durante captura
   * Frequência: ALTA (muitas vezes por segundo)
   */
  socket.on('audio_metrics', async (data: {
    userId: string;
    roomId: string;
    score: number;
    pitch: number;
    energy: number;
    vibrato: number;
    timing: number;
    beatStrength: number;
    rhythmAccuracy: number;
    tempoConsistency: number;
    bpm: number;
  }) => {
    try {
      // Apenas broadcast para sala (não salva em DB)
      await performanceHandler.handleMetricsUpdate(socket, {
        userId: data.userId,
        roomId: data.roomId,
        score: data.score,
        pitch: data.pitch,
        energy: data.energy,
        vibrato: data.vibrato,
        beatStrength: data.beatStrength,
        bpm: data.bpm,
      });

      // Log a cada N updates para não spammar
      // console.log(`📊 Métricas: ${data.userId} score=${Math.round(data.score)}`);
    } catch (error) {
      console.error('❌ Erro em audio_metrics:', error);
    }
  });

  /**
   * ⏹️ Evento: Usuário parou de cantar
   * Cliente envia quando: Clica "Parar de Cantar"
   * Contém: Score final + todas as métricas
   */
  socket.on('stop_singing', async (data: {
    userId: string;
    roomId: string;
    songId: string;
    score: number;
    pitch: number;
    energy: number;
    vibrato: number;
    timing: number;
    beatStrength: number;
    rhythmAccuracy: number;
    tempoConsistency: number;
    bpm: number;
    durationSeconds: number;
    feedback: string[];
  }) => {
    try {
      console.log(
        `⏹️ [stop_singing] ${data.userId} - Score: ${Math.round(data.score)}`
      );

      const performanceData: PerformanceData = {
        userId: data.userId,
        roomId: data.roomId,
        songId: data.songId,
        score: data.score,
        pitch: data.pitch,
        energy: data.energy,
        vibrato: data.vibrato,
        timing: data.timing,
        beatStrength: data.beatStrength,
        rhythmAccuracy: data.rhythmAccuracy,
        tempoConsistency: data.tempoConsistency,
        bpm: data.bpm,
        durationSeconds: data.durationSeconds,
        feedback: data.feedback,
      };

      await performanceHandler.handlePerformanceEnd(socket, performanceData);

      // Confirmar para o cliente
      socket.emit('singing_stopped', {
        status: 'ok',
        message: 'Performance salva com sucesso',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ Erro em stop_singing:', error);
      socket.emit('error', { message: 'Erro ao salvar performance' });
    }
  });

  /**
   * 🏆 Evento: Cliente solicita leaderboard
   * Cliente envia quando: Entra na sala ou performance atualiza
   */
  socket.on('request_leaderboard', async (data: { roomId: string }) => {
    try {
      const leaderboard = await performanceHandler.getRoomLeaderboard(
        data.roomId
      );

      socket.emit('leaderboard_updated', {
        roomId: data.roomId,
        leaderboard,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ Erro ao obter leaderboard:', error);
      socket.emit('error', { message: 'Erro ao carregar placar' });
    }
  });

  /**
   * 📈 Evento: Cliente solicita histórico de performances
   * Para gráficos de progresso pessoal
   */
  socket.on('request_performance_history', async (data: {
    userId: string;
    roomId: string;
  }) => {
    try {
      const performances = await performanceHandler.getUserPerformances(
        data.userId,
        data.roomId
      );

      socket.emit('performance_history', {
        userId: data.userId,
        performances,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      socket.emit('error', { message: 'Erro ao carregar histórico' });
    }
  });

  console.log('✅ Performance events registrados');
}
