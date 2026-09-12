import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import usePerformanceStats from '../hooks/usePerformanceStats';
import PerformanceDetailModal from '../components/PerformanceDetailModal';
import styles from './StatsPage.module.css';

export default function StatsPage() {
  const [periodFilter, setPeriodFilter] = useState<number | undefined>(undefined);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<number | null>(null);
  const { user } = useAuthStore();
  const { stats, loading, error } = usePerformanceStats(user?.id || 0, periodFilter);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className="text-center text-gray-400">Por favor, faça login primeiro</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>🎤</p>
          <p className={styles.emptyText}>Nenhuma performance ainda</p>
          <p className={styles.emptySubtext}>Comece a cantar para ver suas estatísticas!</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const exportToCSV = () => {
    if (!stats || !stats.recent_performances) return;

    const headers = [
      'Data',
      'Música',
      'Artista',
      'Score',
      'Afinação (%)',
      'Volume (%)',
      'Vibrato (%)',
      'Timing (%)',
      'Beat (%)',
      'Ritmo (%)',
      'Tempo (%)',
      'Duração (s)'
    ];

    const rows = stats.recent_performances.map(perf => [
      new Date(perf.performance_start).toLocaleDateString('pt-BR'),
      perf.song_title,
      perf.song_artist,
      Math.round(perf.overall_score),
      Math.round(perf.pitch_accuracy || 0),
      Math.round(perf.energy_consistency || 0),
      Math.round(perf.vibrato || 0),
      Math.round(perf.timing || 0),
      Math.round(perf.beat_strength || 0),
      Math.round(perf.rhythm_accuracy || 0),
      Math.round(perf.tempo_consistency || 0),
      perf.duration_seconds || 0
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `videoke-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>📊 Suas Estatísticas</h1>
          <p className={styles.subtitle}>Acompanhe seu progresso no Videoke</p>
        </div>

        {/* Period Filter */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '30px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { label: '7 dias', value: 7 },
            { label: '30 dias', value: 30 },
            { label: '90 dias', value: 90 },
            { label: 'Tudo', value: undefined }
          ].map(period => (
            <button
              key={period.label}
              onClick={() => setPeriodFilter(period.value)}
              style={{
                padding: '8px 16px',
                backgroundColor: periodFilter === period.value
                  ? 'rgba(102, 126, 234, 0.8)'
                  : 'rgba(102, 126, 234, 0.2)',
                border: '1px solid #667eea',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: periodFilter === period.value ? '600' : '400',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (periodFilter !== period.value) {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (periodFilter !== period.value) {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
                }
              }}
            >
              {period.label}
            </button>
          ))}

          {/* Export Button */}
          {stats && stats.recent_performances.length > 0 && (
            <button
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                color: '#22c55e',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                marginLeft: '8px'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
              }}
            >
              📥 Exportar CSV
            </button>
          )}
        </div>

        {/* Main Stats Grid */}
        <div className={styles.statsGrid}>
          {/* Card: Total Performances */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎤</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Performances</p>
              <p className={styles.statValue}>{stats.total_performances}</p>
            </div>
          </div>

          {/* Card: Average Score */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Score Médio</p>
              <p className={styles.statValue}>{stats.average_score}</p>
              <p className={styles.statMax}>de 1000</p>
            </div>
          </div>

          {/* Card: Best Score */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Melhor Score</p>
              <p className={styles.statValue}>{stats.best_score}</p>
              <p className={styles.statMax}>de 1000</p>
            </div>
          </div>

          {/* Card: Total Time */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Tempo Cantando</p>
              <p className={styles.statValue}>{formatTime(stats.total_time_singing)}</p>
            </div>
          </div>
        </div>

        {/* Performance Trend Indicator */}
        {stats.recent_performances.length >= 2 && (
          <div style={{
            marginBottom: '30px',
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {(() => {
              const recent = stats.recent_performances.slice(0, 5).map(p => p.overall_score);
              if (recent.length < 2) return null;

              const lastScore = recent[0];
              const previousAvg = recent.slice(1).reduce((a, b) => a + b, 0) / (recent.length - 1);
              const diff = lastScore - previousAvg;
              const percentChange = Math.round((diff / previousAvg) * 100);
              const isImproving = diff > 0;

              return (
                <div style={{
                  background: isImproving
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${isImproving ? '#10b981' : '#ef4444'}`,
                  borderRadius: '12px',
                  padding: '16px 24px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999' }}>
                    {isImproving ? '📈 Sua Tendência' : '📉 Sua Tendência'}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: isImproving ? '#10b981' : '#ef4444'
                  }}>
                    {isImproving ? '+' : ''}{percentChange}% em relação às últimas
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Score Trend Chart */}
        {stats.score_trend.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📈 Trend de Scores</h2>
            <div className={styles.chartContainer}>
              <div className={styles.chart}>
                {stats.score_trend.map((score, idx) => (
                  <div key={idx} className={styles.chartBar}>
                    <div
                      className={styles.chartBarFill}
                      style={{
                        height: `${(score / 1000) * 100}%`,
                        backgroundColor: score >= 800 ? '#10b981' : score >= 600 ? '#f59e0b' : '#ef4444',
                      }}
                      title={`Score: ${Math.round(score)}`}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.chartLabels}>
                <span>0</span>
                <span>500</span>
                <span>1000</span>
              </div>
            </div>
            <p className={styles.chartCaption}>Últimas {stats.score_trend.length} performances</p>
          </div>
        )}

        <div className={styles.grid}>
          {/* Top Songs */}
          {stats.top_songs.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🎵 Suas Favoritas</h2>
              <div className={styles.songsList}>
                {stats.top_songs.map((song, idx) => (
                  <div key={song.song_id} className={styles.songItem}>
                    <div className={styles.songRank}>#{idx + 1}</div>
                    <div className={styles.songInfo}>
                      <p className={styles.songTitle}>{song.title}</p>
                      <p className={styles.songArtist}>{song.artist}</p>
                      <p className={styles.songStats}>
                        {song.times_sung} {song.times_sung === 1 ? 'vez' : 'vezes'} • Média: {Math.round(song.average_score)} pts
                      </p>
                    </div>
                    <div className={styles.songBest}>
                      <p className={styles.bestLabel}>Melhor</p>
                      <p className={styles.bestValue}>{Math.round(song.best_score)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Performances */}
          {stats.recent_performances.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>📋 Recentes</h2>
              <div className={styles.performancesList}>
                {stats.recent_performances.map((perf) => (
                  <div
                    key={perf.id}
                    className={styles.performanceItem}
                    onClick={() => setSelectedPerformanceId(perf.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.perfTime}>
                      <p className={styles.perfDate}>
                        {new Date(perf.performance_start).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className={styles.perfInfo}>
                      <p className={styles.perfTitle}>{perf.song_title}</p>
                      <p className={styles.perfArtist}>{perf.song_artist}</p>
                    </div>
                    <div className={styles.perfScore}>
                      <p className={styles.scoreValue}>{Math.round(perf.overall_score)}</p>
                      <p className={styles.scoreLabel}>pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommended Goals */}
        {stats.total_performances > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 Seus Objetivos</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {(() => {
                const goals = [];

                // Goal 1: Score médio
                const nextScoreGoal = Math.ceil((stats.average_score + 50) / 50) * 50;
                goals.push({
                  icon: '⭐',
                  title: 'Próximo Score',
                  current: stats.average_score,
                  target: nextScoreGoal,
                  percent: Math.min(100, Math.round((stats.average_score / nextScoreGoal) * 100))
                });

                // Goal 2: Performances
                const nextPerfGoal = Math.ceil((stats.total_performances + 5) / 10) * 10;
                goals.push({
                  icon: '🎤',
                  title: 'Próxima Meta',
                  current: stats.total_performances,
                  target: nextPerfGoal,
                  percent: Math.round((stats.total_performances / nextPerfGoal) * 100)
                });

                // Goal 3: Top Songs
                const topSongsTarget = 10;
                goals.push({
                  icon: '🎵',
                  title: 'Mais Músicas',
                  current: stats.top_songs.length,
                  target: topSongsTarget,
                  percent: Math.min(100, Math.round((stats.top_songs.length / topSongsTarget) * 100))
                });

                return goals.map((goal, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '24px' }}>{goal.icon}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
                      {goal.title}
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                      {goal.current} / {goal.target}
                    </p>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      height: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${goal.percent}%`,
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#666' }}>
                      {goal.percent}% completo
                    </p>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Best Performance */}
        {stats.best_performance && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🌟 Sua Melhor Performance</h2>
            <div className={styles.bestPerfCard}>
              <div className={styles.bestPerfHeader}>
                <div>
                  <p className={styles.bestPerfTitle}>{stats.best_performance.song_title}</p>
                  <p className={styles.bestPerfArtist}>{stats.best_performance.song_artist}</p>
                </div>
                <div className={styles.bestPerfScore}>
                  <p className={styles.bestPerfNumber}>{Math.round(stats.best_performance.overall_score)}</p>
                  <p className={styles.bestPerfOutOf}>/ 1000</p>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Afinação</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.pitch_accuracy)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Volume</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.energy_consistency)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Vibrato</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.vibrato)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Timing</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.timing)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Beat</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.beat_strength)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Ritmo</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.rhythm_accuracy)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Tempo</span>
                  <span className={styles.metricValue}>
                    {Math.round(stats.best_performance.tempo_consistency)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Detail Modal */}
        {selectedPerformanceId && (
          <PerformanceDetailModal
            performanceId={selectedPerformanceId}
            onClose={() => setSelectedPerformanceId(null)}
          />
        )}
      </div>
    </div>
  );
}
