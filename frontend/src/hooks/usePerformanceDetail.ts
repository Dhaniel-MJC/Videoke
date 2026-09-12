import { useState, useEffect } from 'react';

export interface PerformanceDetail {
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

interface MetricComparison {
  name: string;
  value: number;
  userAverage: number;
  diff: number;
  status: 'good' | 'ok' | 'needs-work';
}

export const usePerformanceDetail = (performanceId?: number) => {
  const [detail, setDetail] = useState<PerformanceDetail | null>(null);
  const [metrics, setMetrics] = useState<MetricComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!performanceId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/performances/${performanceId}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar detalhes da performance');
        }

        const data: PerformanceDetail = await response.json();
        setDetail(data);

        // Calcular comparações com média (valores simulados para now)
        // Em produção, viria do backend
        const metricsData: MetricComparison[] = [
          {
            name: 'Afinação',
            value: data.pitch_accuracy,
            userAverage: 75,
            diff: data.pitch_accuracy - 75,
            status: data.pitch_accuracy >= 80 ? 'good' : data.pitch_accuracy >= 65 ? 'ok' : 'needs-work'
          },
          {
            name: 'Volume',
            value: data.energy_consistency,
            userAverage: 70,
            diff: data.energy_consistency - 70,
            status: data.energy_consistency >= 75 ? 'good' : data.energy_consistency >= 60 ? 'ok' : 'needs-work'
          },
          {
            name: 'Vibrato',
            value: data.vibrato,
            userAverage: 65,
            diff: data.vibrato - 65,
            status: data.vibrato >= 70 ? 'good' : data.vibrato >= 50 ? 'ok' : 'needs-work'
          },
          {
            name: 'Timing',
            value: data.timing,
            userAverage: 72,
            diff: data.timing - 72,
            status: data.timing >= 80 ? 'good' : data.timing >= 65 ? 'ok' : 'needs-work'
          },
          {
            name: 'Beat',
            value: data.beat_strength,
            userAverage: 68,
            diff: data.beat_strength - 68,
            status: data.beat_strength >= 75 ? 'good' : data.beat_strength >= 60 ? 'ok' : 'needs-work'
          },
          {
            name: 'Ritmo',
            value: data.rhythm_accuracy,
            userAverage: 70,
            diff: data.rhythm_accuracy - 70,
            status: data.rhythm_accuracy >= 80 ? 'good' : data.rhythm_accuracy >= 65 ? 'ok' : 'needs-work'
          },
          {
            name: 'Tempo',
            value: data.tempo_consistency,
            userAverage: 71,
            diff: data.tempo_consistency - 71,
            status: data.tempo_consistency >= 75 ? 'good' : data.tempo_consistency >= 60 ? 'ok' : 'needs-work'
          }
        ];

        setMetrics(metricsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Detail error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [performanceId]);

  return { detail, metrics, loading, error };
};

export default usePerformanceDetail;
