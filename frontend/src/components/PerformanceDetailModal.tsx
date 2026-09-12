import { usePerformanceDetail } from '../hooks/usePerformanceDetail';
import styles from './PerformanceDetailModal.module.css';

interface PerformanceDetailModalProps {
  performanceId: number;
  onClose: () => void;
}

export default function PerformanceDetailModal({ performanceId, onClose }: PerformanceDetailModalProps) {
  const { detail, metrics, loading, error } = usePerformanceDetail(performanceId);

  if (loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Carregando detalhes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.errorContainer}>
            <p>❌ {error || 'Erro ao carregar performance'}</p>
            <button onClick={onClose} className={styles.closeBtn}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return '#10b981';
      case 'ok': return '#f59e0b';
      case 'needs-work': return '#ef4444';
      default: return '#667eea';
    }
  };

  const getMetricLabel = (status: string) => {
    switch (status) {
      case 'good': return '⭐ Excelente';
      case 'ok': return '⚠️ Bom';
      case 'needs-work': return '📈 Melhorar';
      default: return '?';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{detail.song_title}</h2>
            <p className={styles.artist}>{detail.song_artist}</p>
            <p className={styles.date}>
              {new Date(detail.performance_start).toLocaleDateString('pt-BR')} •{' '}
              {new Date(detail.performance_start).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {/* Overall Score */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreCircle}>
            <p className={styles.scoreNumber}>{Math.round(detail.overall_score)}</p>
            <p className={styles.scoreLabel}>/ 1000</p>
          </div>
          <div className={styles.scoreInfo}>
            <p className={styles.infoLabel}>Score Geral</p>
            <p className={styles.infoText}>
              {detail.overall_score >= 800
                ? '🏆 Performance Excelente!'
                : detail.overall_score >= 600
                ? '⭐ Ótima performance'
                : '📈 Continue praticando'}
            </p>
            <p className={styles.durationInfo}>
              ⏱️ Duração: {detail.duration_seconds}s
            </p>
          </div>
        </div>

        {/* Metrics Radar */}
        <div className={styles.metricsSection}>
          <h3 className={styles.sectionTitle}>📊 Análise Detalhada</h3>

          <div className={styles.radarContainer}>
            <svg className={styles.radar} viewBox="0 0 200 200">
              {/* Circles de referência */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Pontos (radar polygon) */}
              {(() => {
                const points: [number, number][] = [];
                metrics.forEach((metric, idx) => {
                  const angle = (idx * 360) / metrics.length - 90;
                  const rad = (angle * Math.PI) / 180;
                  const radius = 80 * (metric.value / 100);
                  points.push([
                    100 + radius * Math.cos(rad),
                    100 + radius * Math.sin(rad)
                  ]);
                });
                const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
                return (
                  <>
                    <path d={pathStr} fill="rgba(102, 126, 234, 0.2)" stroke="#667eea" strokeWidth="2" />
                    {points.map((p, i) => (
                      <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#667eea" />
                    ))}
                  </>
                );
              })()}

              {/* Labels */}
              {metrics.map((metric, idx) => {
                const angle = (idx * 360) / metrics.length - 90;
                const rad = (angle * Math.PI) / 180;
                const labelRadius = 110;
                return (
                  <text
                    key={`label-${idx}`}
                    x={100 + labelRadius * Math.cos(rad)}
                    y={100 + labelRadius * Math.sin(rad)}
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize="10"
                    fill="#999"
                  >
                    {metric.name}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Métricas Lista */}
          <div className={styles.metricsList}>
            {metrics.map((metric, idx) => (
              <div key={idx} className={styles.metricItem} style={{ borderLeftColor: getMetricColor(metric.status) }}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricName}>{metric.name}</span>
                  <span className={styles.metricStatus} style={{ color: getMetricColor(metric.status) }}>
                    {getMetricLabel(metric.status)}
                  </span>
                </div>

                <div className={styles.metricContent}>
                  <div className={styles.metricBar}>
                    <div
                      className={styles.metricFill}
                      style={{
                        width: `${Math.min(100, metric.value)}%`,
                        backgroundColor: getMetricColor(metric.status)
                      }}
                    />
                  </div>
                  <div className={styles.metricStats}>
                    <span className={styles.metricValue}>{Math.round(metric.value)}%</span>
                    <span className={styles.metricComparison}>
                      {metric.diff >= 0 ? '+' : ''}{Math.round(metric.diff)}% vs média
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pontos Fortes:</span>
            <span className={styles.summaryValue}>
              {metrics.filter(m => m.status === 'good').length > 0
                ? metrics.filter(m => m.status === 'good').map(m => m.name).join(', ')
                : 'Nenhum (continue praticando!)'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Para Melhorar:</span>
            <span className={styles.summaryValue}>
              {metrics.filter(m => m.status === 'needs-work').length > 0
                ? metrics.filter(m => m.status === 'needs-work').map(m => m.name).join(', ')
                : 'Nenhum (excelente!)'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button onClick={onClose} className={styles.actionButton}>
          Voltar
        </button>
      </div>
    </div>
  );
}
