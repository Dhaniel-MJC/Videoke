/**
 * Handler de Performances - Salvar e recuperar performances Phase 3
 * Integração com WebSocket e banco de dados
 */

import { Database } from '../db/client';
import { Socket } from 'socket.io';

export interface PerformanceData {
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
}

export interface RoomLeaderboardEntry {
  userId: string;
  username: string;
  averageScore: number;
  performances: number;
  lastPerformanceScore: number;
  badges: string[];
}

export class PerformanceHandler {
  constructor(private db: Database) {}

  /**
   * Salvar performance no banco de dados
   */
  async savePerformance(data: PerformanceData): Promise<string> {
    try {
      const result = await this.db.query(
        `INSERT INTO performances
         (user_id, room_id, song_id, score, pitch, energy, vibrato, timing,
          beat_strength, rhythm_accuracy, tempo_consistency, bpm, duration_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          data.userId,
          data.roomId,
          data.songId,
          data.score,
          data.pitch,
          data.energy,
          data.vibrato,
          data.timing,
          data.beatStrength,
          data.rhythmAccuracy,
          data.tempoConsistency,
          data.bpm,
          data.durationSeconds,
        ]
      );

      const performanceId = result.rows[0].id;

      // Salvar feedback
      if (data.feedback && data.feedback.length > 0) {
        await this.db.query(
          `INSERT INTO performance_feedback (performance_id, feedback)
           VALUES ($1, $2)`,
          [performanceId, JSON.stringify(data.feedback)]
        );
      }

      console.log(`✅ Performance salva: ${performanceId}`);
      return performanceId;
    } catch (error) {
      console.error('❌ Erro ao salvar performance:', error);
      throw error;
    }
  }

  /**
   * Obter leaderboard da sala
   */
  async getRoomLeaderboard(roomId: string): Promise<RoomLeaderboardEntry[]> {
    try {
      const result = await this.db.query(
        `SELECT
          u.id,
          u.username,
          AVG(p.score) as average_score,
          COUNT(p.id) as performance_count,
          MAX(p.score) as last_performance_score
         FROM users u
         LEFT JOIN performances p ON u.id = p.user_id AND p.room_id = $1
         WHERE u.id IN (
           SELECT user_id FROM room_members WHERE room_id = $1
         )
         GROUP BY u.id, u.username
         ORDER BY average_score DESC`,
        [roomId]
      );

      return result.rows.map((row) => ({
        userId: row.id,
        username: row.username,
        averageScore: Math.round(parseFloat(row.average_score) || 0),
        performances: parseInt(row.performance_count) || 0,
        lastPerformanceScore: Math.round(row.last_performance_score) || 0,
        badges: this.calculateBadges(
          Math.round(parseFloat(row.average_score) || 0),
          parseInt(row.performance_count) || 0
        ),
      }));
    } catch (error) {
      console.error('❌ Erro ao obter leaderboard:', error);
      throw error;
    }
  }

  /**
   * Obter performances de um usuário em uma sala
   */
  async getUserPerformances(
    userId: string,
    roomId: string
  ): Promise<PerformanceData[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id, user_id, room_id, song_id, score, pitch, energy, vibrato, timing,
          beat_strength, rhythm_accuracy, tempo_consistency, bpm, duration_seconds,
          created_at
         FROM performances
         WHERE user_id = $1 AND room_id = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId, roomId]
      );

      return result.rows.map((row) => ({
        userId: row.user_id,
        roomId: row.room_id,
        songId: row.song_id,
        score: row.score,
        pitch: row.pitch,
        energy: row.energy,
        vibrato: row.vibrato,
        timing: row.timing,
        beatStrength: row.beat_strength,
        rhythmAccuracy: row.rhythm_accuracy,
        tempoConsistency: row.tempo_consistency,
        bpm: row.bpm,
        durationSeconds: row.duration_seconds,
        feedback: [],
      }));
    } catch (error) {
      console.error('❌ Erro ao obter performances:', error);
      throw error;
    }
  }

  /**
   * Calcular badges com base em performance
   */
  private calculateBadges(averageScore: number, performances: number): string[] {
    const badges: string[] = [];

    // 🥇 Ouro - Top 1
    if (averageScore >= 85) {
      badges.push('gold_medal');
    }

    // 🎯 Consistência - 5+ performances com score ≥75
    if (performances >= 5 && averageScore >= 75) {
      badges.push('consistency');
    }

    // ⭐ Estrela - Score ≥90
    if (averageScore >= 90) {
      badges.push('star');
    }

    // 🚀 Ascendente - Score crescente (simplificado)
    if (performances >= 3) {
      badges.push('rising_star');
    }

    return badges;
  }

  /**
   * Registrar evento de apresentação no WebSocket
   */
  async handlePerformanceStart(
    socket: Socket,
    data: {
      userId: string;
      roomId: string;
      songId: string;
    }
  ): Promise<void> {
    try {
      // Notificar sala que usuário começou a cantar
      socket.to(data.roomId).emit('user_started_singing', {
        userId: data.userId,
        songId: data.songId,
        timestamp: new Date(),
      });

      console.log(
        `🎤 ${data.userId} começou a cantar em ${data.roomId}`
      );
    } catch (error) {
      console.error('❌ Erro ao registrar início:', error);
    }
  }

  /**
   * Registrar evento de término de apresentação
   */
  async handlePerformanceEnd(
    socket: Socket,
    data: PerformanceData
  ): Promise<void> {
    try {
      // Salvar performance
      const performanceId = await this.savePerformance(data);

      // Obter leaderboard atualizado
      const leaderboard = await this.getRoomLeaderboard(data.roomId);

      // Notificar sala
      socket.to(data.roomId).emit('performance_saved', {
        performanceId,
        userId: data.userId,
        score: data.score,
        leaderboard,
        timestamp: new Date(),
      });

      console.log(
        `✅ Performance finalizada: ${performanceId} com score ${data.score}`
      );
    } catch (error) {
      console.error('❌ Erro ao finalizar performance:', error);
    }
  }

  /**
   * Enviar métricas em tempo real
   */
  async handleMetricsUpdate(
    socket: Socket,
    data: {
      userId: string;
      roomId: string;
      score: number;
      pitch: number;
      energy: number;
      vibrato: number;
      beatStrength: number;
      bpm: number;
    }
  ): Promise<void> {
    // Notificar sala em tempo real (não salva, apenas streaming)
    socket.to(data.roomId).emit('audio_metrics_update', {
      userId: data.userId,
      score: Math.round(data.score),
      pitch: Math.round(data.pitch),
      energy: Math.round(data.energy),
      vibrato: Math.round(data.vibrato),
      beatStrength: Math.round(data.beatStrength),
      bpm: Math.round(data.bpm),
      timestamp: Date.now(),
    });
  }
}
