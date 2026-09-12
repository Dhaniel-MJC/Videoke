import { useState, useEffect } from 'react';

interface PerformanceRecord {
  id: number;
  song_id: number;
  song_title: string;
  song_artist: string;
  overall_score: number;
  pitch_accuracy: number;
  energy_consistency: number;
  vibrato: number;
  timing: number;
  beat_strength: number;
  rhythm_accuracy: number;
  tempo_consistency: number;
  performance_start: string;
  duration_seconds: number;
}

interface SongStats {
  song_id: number;
  title: string;
  artist: string;
  times_sung: number;
  average_score: number;
  best_score: number;
}

interface PerformanceStats {
  total_performances: number;
  average_score: number;
  best_score: number;
  best_performance: PerformanceRecord | null;
  total_time_singing: number;
  recent_performances: PerformanceRecord[];
  top_songs: SongStats[];
  score_trend: number[]; // últimos 10 scores
}

export const usePerformanceStats = (userId: number, daysFilter?: number) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

        // Buscar performances do usuário
        const response = await fetch(`${apiUrl}/users/${userId}/performances?limit=500`);

        if (!response.ok) {
          throw new Error('Erro ao buscar estatísticas');
        }

        let performances: PerformanceRecord[] = await response.json();

        // Filtrar por período se especificado
        if (daysFilter && daysFilter > 0) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
          performances = performances.filter(p =>
            new Date(p.performance_start) >= cutoffDate
          );
        }

        // Calcular estatísticas
        if (performances.length === 0) {
          setStats({
            total_performances: 0,
            average_score: 0,
            best_score: 0,
            best_performance: null,
            total_time_singing: 0,
            recent_performances: [],
            top_songs: [],
            score_trend: [],
          });
          return;
        }

        // Scores ordenados
        const scores = performances.map(p => p.overall_score).sort((a, b) => b - a);
        const bestScore = scores[0];
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Top songs
        const songMap = new Map<number, SongStats>();
        performances.forEach(p => {
          const existing = songMap.get(p.song_id);
          if (existing) {
            existing.times_sung++;
            existing.average_score = (existing.average_score * (existing.times_sung - 1) + p.overall_score) / existing.times_sung;
            existing.best_score = Math.max(existing.best_score, p.overall_score);
          } else {
            songMap.set(p.song_id, {
              song_id: p.song_id,
              title: p.song_title,
              artist: p.song_artist,
              times_sung: 1,
              average_score: p.overall_score,
              best_score: p.overall_score,
            });
          }
        });

        const topSongs = Array.from(songMap.values())
          .sort((a, b) => b.times_sung - a.times_sung)
          .slice(0, 5);

        // Total de tempo cantando
        const totalTime = performances.reduce((sum, p) => sum + (p.duration_seconds || 0), 0);

        // Score trend (últimos 10 scores)
        const scoreTrend = performances
          .slice(-10)
          .map(p => p.overall_score)
          .reverse();

        // Recent performances (últimas 5)
        const recentPerformances = performances.slice(-5).reverse();

        // Best performance
        const bestPerformance = performances.find(p => p.overall_score === bestScore) || null;

        setStats({
          total_performances: performances.length,
          average_score: Math.round(averageScore),
          best_score: bestScore,
          best_performance: bestPerformance,
          total_time_singing: Math.round(totalTime),
          recent_performances: recentPerformances,
          top_songs: topSongs,
          score_trend: scoreTrend,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId, daysFilter]);

  return { stats, loading, error };
};

export default usePerformanceStats;
