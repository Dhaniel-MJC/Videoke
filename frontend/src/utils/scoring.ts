/**
 * Sistema de scoring para análise de performance de canto
 */

import {
  AudioFeatures,
  detectTuning,
  NOTE_FREQUENCIES,
} from './audioAnalysis';

export interface PerformanceMetrics {
  pitchAccuracy: number; // 0-100
  energyConsistency: number; // 0-100
  vibrato: number; // 0-100 (qualidade do vibrato)
  timing: number; // 0-100 (consistência temporal)
  overallScore: number; // 0-100
  breakdown: {
    pitch: number;
    energy: number;
    vibrato: number;
    timing: number;
  };
}

interface AudioBuffer {
  features: AudioFeatures;
  timestamp: number;
}

export class PerformanceAnalyzer {
  private audioBuffer: AudioBuffer[] = [];
  private targetKey: string = 'A4'; // Nota alvo padrão
  private maxBufferSize: number = 1000;

  /**
   * Definir a nota alvo para análise
   */
  setTargetKey(noteName: string): void {
    if (!NOTE_FREQUENCIES[noteName]) {
      console.warn(`Invalid note: ${noteName}`);
      return;
    }
    this.targetKey = noteName;
  }

  /**
   * Adicionar novas features ao buffer
   */
  addFeatures(features: AudioFeatures): void {
    this.audioBuffer.push({
      features,
      timestamp: Date.now(),
    });

    // Manter apenas os últimos samples
    if (this.audioBuffer.length > this.maxBufferSize) {
      this.audioBuffer.shift();
    }
  }

  /**
   * Calcular acurácia de pitch
   */
  private calculatePitchAccuracy(): number {
    if (this.audioBuffer.length === 0) return 0;

    const targetFreq = NOTE_FREQUENCIES[this.targetKey];
    let inTuneCount = 0;

    for (const buffer of this.audioBuffer) {
      if (buffer.features.pitch > 0 && buffer.features.confidence > 0.5) {
        const { inTune } = detectTuning(buffer.features.pitch, targetFreq);
        if (inTune) {
          inTuneCount++;
        }
      }
    }

    return (inTuneCount / this.audioBuffer.length) * 100;
  }

  /**
   * Calcular consistência de energia
   */
  private calculateEnergyConsistency(): number {
    if (this.audioBuffer.length < 10) return 0;

    const energies = this.audioBuffer
      .filter((b) => b.features.energy > 0.1) // Ignorar silêncios
      .map((b) => b.features.energy);

    if (energies.length === 0) return 0;

    // Calcular coeficiente de variação
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance = energies.reduce((a, b) => a + (b - mean) ** 2, 0) / energies.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Converter para score: menor variação = melhor
    return Math.max(0, 100 - cv);
  }

  /**
   * Calcular qualidade de vibrato
   */
  private calculateVibratoScore(): number {
    if (this.audioBuffer.length < 20) return 0;

    // Calcular variação de pitch nos últimos samples
    const pitches = this.audioBuffer
      .slice(-50)
      .filter((b) => b.features.pitch > 0)
      .map((b) => b.features.pitch);

    if (pitches.length < 5) return 0;

    // Calcular desvio padrão
    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((a, b) => a + (b - mean) ** 2, 0) / pitches.length;
    const stdDev = Math.sqrt(variance);

    // Vibrato ideal tem desvio padrão de 20-50 cents (pitch é em Hz)
    // Aproximadamente 5-25 Hz de variação
    const idealVariation = 15; // Hz
    const vibratoScore = Math.min(100, (stdDev / idealVariation) * 100);

    return vibratoScore;
  }

  /**
   * Calcular consistência temporal (timing)
   */
  private calculateTiming(): number {
    if (this.audioBuffer.length < 10) return 0;

    // Analisar consistência de intervalo entre samples
    const intervals: number[] = [];
    for (let i = 1; i < this.audioBuffer.length; i++) {
      const interval = this.audioBuffer[i].timestamp - this.audioBuffer[i - 1].timestamp;
      intervals.push(interval);
    }

    if (intervals.length === 0) return 0;

    // Calcular variação de intervalos (timing stability)
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + (b - meanInterval) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = meanInterval > 0 ? (stdDev / meanInterval) * 100 : 0;

    // Converter para score: menor variação = melhor timing
    return Math.max(0, 100 - cv);
  }

  /**
   * Calcular métricas completas de performance
   */
  getMetrics(): PerformanceMetrics {
    const pitchAccuracy = this.calculatePitchAccuracy();
    const energyConsistency = this.calculateEnergyConsistency();
    const vibrato = this.calculateVibratoScore();
    const timing = this.calculateTiming();

    // Ponderação dos scores
    // 50% pitch, 20% energy, 15% vibrato, 15% timing
    const overallScore =
      pitchAccuracy * 0.5 +
      energyConsistency * 0.2 +
      vibrato * 0.15 +
      timing * 0.15;

    return {
      pitchAccuracy: Math.round(pitchAccuracy),
      energyConsistency: Math.round(energyConsistency),
      vibrato: Math.round(vibrato),
      timing: Math.round(timing),
      overallScore: Math.round(overallScore),
      breakdown: {
        pitch: Math.round(pitchAccuracy),
        energy: Math.round(energyConsistency),
        vibrato: Math.round(vibrato),
        timing: Math.round(timing),
      },
    };
  }

  /**
   * Obter métricas dos últimos N samples
   */
  getRecentMetrics(sampleCount: number = 50): PerformanceMetrics {
    // Temporariamente usar apenas os últimos samples
    const originalBuffer = this.audioBuffer;
    this.audioBuffer = originalBuffer.slice(-sampleCount);

    const metrics = this.getMetrics();

    // Restaurar buffer completo
    this.audioBuffer = originalBuffer;

    return metrics;
  }

  /**
   * Resetar analyzer
   */
  reset(): void {
    this.audioBuffer = [];
  }

  /**
   * Obter estatísticas gerais
   */
  getStatistics() {
    if (this.audioBuffer.length === 0) {
      return {
        totalSamples: 0,
        averagePitch: 0,
        averageEnergy: 0,
        averageConfidence: 0,
      };
    }

    const pitches = this.audioBuffer
      .filter((b) => b.features.pitch > 0)
      .map((b) => b.features.pitch);

    const energies = this.audioBuffer.map((b) => b.features.energy);
    const confidences = this.audioBuffer.map((b) => b.features.confidence);

    return {
      totalSamples: this.audioBuffer.length,
      averagePitch: pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0,
      averageEnergy: energies.reduce((a, b) => a + b, 0) / energies.length,
      averageConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      pitchRange: pitches.length > 0 ? {
        min: Math.min(...pitches),
        max: Math.max(...pitches),
      } : { min: 0, max: 0 },
    };
  }

  /**
   * Gerar feedback textual com base na performance
   */
  generateFeedback(): string[] {
    const metrics = this.getMetrics();
    const feedback: string[] = [];

    if (metrics.pitchAccuracy < 50) {
      feedback.push('🎵 Trabalhe na afinação - tente se manter mais perto da nota');
    } else if (metrics.pitchAccuracy < 75) {
      feedback.push('🎵 Boa afinação! Pode melhorar um pouco mais');
    } else {
      feedback.push('🎵 Excelente afinação!');
    }

    if (metrics.energyConsistency < 50) {
      feedback.push('🔊 Mantenha um volume mais consistente');
    } else if (metrics.energyConsistency < 75) {
      feedback.push('🔊 Bom controle de volume');
    } else {
      feedback.push('🔊 Excelente consistência de volume!');
    }

    if (metrics.timing < 50) {
      feedback.push('⏱️ Trabalhe o timing e a sincronização');
    } else if (metrics.timing < 75) {
      feedback.push('⏱️ Boa sincronização!');
    } else {
      feedback.push('⏱️ Timing perfeito!');
    }

    if (metrics.overallScore >= 80) {
      feedback.push('⭐ Performance excelente!');
    } else if (metrics.overallScore >= 60) {
      feedback.push('👍 Boa performance! Continue praticando');
    } else {
      feedback.push('💪 Continue praticando para melhorar');
    }

    return feedback;
  }
}

/**
 * Comparar duas performances
 */
export function comparePerformances(
  metrics1: PerformanceMetrics,
  metrics2: PerformanceMetrics
): { winner: 'first' | 'second' | 'tie'; difference: number } {
  if (metrics1.overallScore > metrics2.overallScore) {
    return {
      winner: 'first',
      difference: metrics1.overallScore - metrics2.overallScore,
    };
  } else if (metrics2.overallScore > metrics1.overallScore) {
    return {
      winner: 'second',
      difference: metrics2.overallScore - metrics1.overallScore,
    };
  }
  return { winner: 'tie', difference: 0 };
}
