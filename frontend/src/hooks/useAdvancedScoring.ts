/**
 * Hook para análise avançada de pontuação
 * Incorpora timing musical, sincronismo com batida, e comparações entre performances
 */

import { useCallback, useRef, useState } from 'react';

export interface MusicalTiming {
  bpm: number; // Batidas por minuto
  beatStrength: number; // 0-100: Quão bem sincronizado com a batida
  rhythmAccuracy: number; // 0-100: Precisão rítmica
  tempoConsistency: number; // 0-100: Consistência de tempo
}

export interface AdvancedMetrics {
  pitch: number; // 0-100
  energy: number; // 0-100
  vibrato: number; // 0-100
  timing: number; // 0-100
  musicalTiming: MusicalTiming;
  overallScore: number; // 0-100
}

export interface PerformanceComparison {
  yourScore: number;
  averageRoomScore: number;
  bestRoomScore: number;
  ranking: number; // Sua posição na sala
  totalPerformances: number;
}

export function useAdvancedScoring() {
  const [metrics, setMetrics] = useState<AdvancedMetrics>({
    pitch: 0,
    energy: 0,
    vibrato: 0,
    timing: 0,
    musicalTiming: {
      bpm: 0,
      beatStrength: 0,
      rhythmAccuracy: 0,
      tempoConsistency: 0,
    },
    overallScore: 0,
  });

  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);

  const bufferRef = useRef<number[]>([]); // Buffer para análise temporal
  const lastTimestampRef = useRef<number>(0);

  /**
   * Detecta BPM analisando intervalos entre picos de energia
   * Analogia: Como contar batidas em uma música captando quando o volume sobe e desce
   */
  const detectBPM = useCallback((energyBuffer: number[]): number => {
    if (energyBuffer.length < 20) return 0;

    // Encontrar picos de energia
    const peaks: number[] = [];
    const threshold = 0.6;

    for (let i = 1; i < energyBuffer.length - 1; i++) {
      if (
        energyBuffer[i] > energyBuffer[i - 1] &&
        energyBuffer[i] > energyBuffer[i + 1] &&
        energyBuffer[i] > threshold
      ) {
        peaks.push(i);
      }
    }

    if (peaks.length < 2) return 0;

    // Calcular intervalo médio entre picos (em frames)
    let totalInterval = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalInterval += peaks[i] - peaks[i - 1];
    }
    const avgInterval = totalInterval / (peaks.length - 1);

    // Converter para BPM (assumindo 44.1kHz sampling, 4096 frame size)
    const sampleRate = 44100;
    const frameSize = 4096;
    const frameDuration = (frameSize / sampleRate) * 1000; // ms
    const intervalMs = avgInterval * frameDuration;
    const bpm = (60000 / intervalMs) * 2; // ×2 por quarto de nota

    return Math.min(Math.max(bpm, 60), 240); // Limitar 60-240 BPM
  }, []);

  /**
   * Calcula sincronismo com a batida
   * Compara timing dos picos de energia com a batida esperada
   */
  const calculateBeatStrength = useCallback(
    (energyBuffer: number[], bpm: number): number => {
      if (bpm === 0) return 0;

      const beatInterval = (60000 / bpm) * (4096 / 44100); // ms entre batidas
      let syncScore = 0;
      let detectionCount = 0;

      for (let i = 1; i < energyBuffer.length - 1; i++) {
        const isLocalPeak =
          energyBuffer[i] > energyBuffer[i - 1] &&
          energyBuffer[i] > energyBuffer[i + 1] &&
          energyBuffer[i] > 0.5;

        if (isLocalPeak) {
          // Verificar se está próximo ao intervalo esperado de batida
          const positionInBeat = (i * beatInterval) % beatInterval;
          const deviationFromBeat = Math.min(
            positionInBeat,
            beatInterval - positionInBeat
          );

          // Quanto menor o desvio, melhor o sincronismo
          const beatScore = Math.max(0, 100 - (deviationFromBeat / beatInterval) * 200);
          syncScore += beatScore;
          detectionCount++;
        }
      }

      return detectionCount > 0 ? Math.min(syncScore / detectionCount, 100) : 0;
    },
    []
  );

  /**
   * Calcula precisão rítmica
   * Analisa consistência dos intervalos entre eventos sonoros
   */
  const calculateRhythmAccuracy = useCallback((energyBuffer: number[]): number => {
    if (energyBuffer.length < 10) return 0;

    const peaks: number[] = [];
    for (let i = 1; i < energyBuffer.length - 1; i++) {
      if (
        energyBuffer[i] > energyBuffer[i - 1] &&
        energyBuffer[i] > energyBuffer[i + 1] &&
        energyBuffer[i] > 0.5
      ) {
        peaks.push(i);
      }
    }

    if (peaks.length < 3) return 0;

    // Calcular variância dos intervalos
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2);
      }, 0) / intervals.length;

    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgInterval) * 100;

    // Quanto menor CV, mais regular o ritmo
    return Math.max(0, 100 - coefficientOfVariation);
  }, []);

  /**
   * Calcula consistência de tempo
   * Verifica se o cantor mantém velocidade constante
   */
  const calculateTempoConsistency = useCallback(
    (energyBuffer: number[], bpm: number): number => {
      if (bpm === 0 || energyBuffer.length < 20) return 0;

      const segmentSize = Math.floor(energyBuffer.length / 4);
      if (segmentSize < 5) return 0;

      const segmentBpms: number[] = [];

      for (let i = 0; i < 4; i++) {
        const start = i * segmentSize;
        const end = Math.min((i + 1) * segmentSize, energyBuffer.length);
        const segment = energyBuffer.slice(start, end);

        const peaks: number[] = [];
        for (let j = 1; j < segment.length - 1; j++) {
          if (
            segment[j] > segment[j - 1] &&
            segment[j] > segment[j + 1] &&
            segment[j] > 0.5
          ) {
            peaks.push(j);
          }
        }

        if (peaks.length >= 2) {
          const avgInterval =
            peaks.reduce((sum, _, idx) => {
              return idx === 0
                ? sum
                : sum + (peaks[idx] - peaks[idx - 1]);
            }, 0) / (peaks.length - 1);

          const segmentBpm = (60000 / (avgInterval * 93)) * 2; // ~93ms por frame
          segmentBpms.push(segmentBpm);
        }
      }

      if (segmentBpms.length < 2) return 50;

      // Calcular variância entre segmentos
      const avgBpm =
        segmentBpms.reduce((a, b) => a + b, 0) / segmentBpms.length;
      const variance =
        segmentBpms.reduce((sum, b) => sum + Math.pow(b - avgBpm, 2), 0) /
        segmentBpms.length;

      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (stdDev / avgBpm) * 100);

      return Math.min(consistency, 100);
    },
    []
  );

  /**
   * Atualiza métricas avançadas com base em dados de áudio
   */
  const updateAdvancedMetrics = useCallback(
    (
      pitchScore: number,
      energyScore: number,
      vibratoScore: number,
      timingScore: number,
      frequencyData: Uint8Array
    ) => {
      // Converter frequencyData para valores 0-1
      const normalizedEnergy = Array.from(frequencyData).map((v) => v / 255);
      bufferRef.current.push(...normalizedEnergy.slice(0, 10));

      // Limitar buffer a 100 frames
      if (bufferRef.current.length > 100) {
        bufferRef.current.shift();
      }

      // Calcular métricas musicais
      const bpm = detectBPM(bufferRef.current);
      const beatStrength = calculateBeatStrength(bufferRef.current, bpm);
      const rhythmAccuracy = calculateRhythmAccuracy(bufferRef.current);
      const tempoConsistency = calculateTempoConsistency(bufferRef.current, bpm);

      const musicalTiming: MusicalTiming = {
        bpm: Math.round(bpm),
        beatStrength: Math.round(beatStrength),
        rhythmAccuracy: Math.round(rhythmAccuracy),
        tempoConsistency: Math.round(tempoConsistency),
      };

      // Score com peso para análise musical
      const overallScore =
        pitchScore * 0.35 + // Afinação
        energyScore * 0.15 + // Energia
        vibratoScore * 0.1 + // Vibrato
        timingScore * 0.1 + // Timing original
        beatStrength * 0.15 + // Sincronismo
        rhythmAccuracy * 0.1 + // Precisão rítmica
        tempoConsistency * 0.05; // Consistência

      setMetrics({
        pitch: Math.round(pitchScore),
        energy: Math.round(energyScore),
        vibrato: Math.round(vibratoScore),
        timing: Math.round(timingScore),
        musicalTiming,
        overallScore: Math.round(overallScore),
      });

      lastTimestampRef.current = Date.now();
    },
    [detectBPM, calculateBeatStrength, calculateRhythmAccuracy, calculateTempoConsistency]
  );

  /**
   * Calcula comparação com outros usuários na sala
   */
  const calculateComparison = useCallback(
    (
      yourScore: number,
      roomPerformances: { userId: string; score: number }[]
    ) => {
      const allScores = [
        ...roomPerformances.map((p) => p.score),
        yourScore,
      ];
      allScores.sort((a, b) => b - a);

      const ranking = allScores.indexOf(yourScore) + 1;
      const averageScore =
        roomPerformances.reduce((sum, p) => sum + p.score, 0) /
          Math.max(1, roomPerformances.length) || 0;
      const bestScore = Math.max(
        ...roomPerformances.map((p) => p.score),
        0
      );

      setComparison({
        yourScore: Math.round(yourScore),
        averageRoomScore: Math.round(averageScore),
        bestRoomScore: Math.round(bestScore),
        ranking,
        totalPerformances: roomPerformances.length + 1,
      });
    },
    []
  );

  /**
   * Gera feedback personalizado baseado em métricas
   */
  const generateAdvancedFeedback = useCallback(
    (advancedMetrics: AdvancedMetrics): string[] => {
      const feedback: string[] = [];
      const { pitch, energy, vibrato, timing, musicalTiming, overallScore } =
        advancedMetrics;

      // Afinação
      if (pitch >= 85) {
        feedback.push('🎵 Afinação perfeita! Você manteve notas muito precisas.');
      } else if (pitch >= 70) {
        feedback.push('🎵 Boa afinação geral. Trabalhe em sustentar as notas altas.');
      } else {
        feedback.push('🎵 Dica: Pratique escalas para melhorar a afinação.');
      }

      // Energia
      if (energy >= 80) {
        feedback.push('🔊 Excelente projeção vocal! Voz firme e clara.');
      } else if (energy < 40) {
        feedback.push('🔊 Dica: Aumente a projeção vocal. Fale mais próximo do microfone.');
      }

      // Timing musical
      if (musicalTiming.beatStrength >= 80) {
        feedback.push('⏱️ Perfeito sincronismo com a batida da música!');
      } else if (musicalTiming.beatStrength >= 60) {
        feedback.push(
          `⏱️ Bom timing! BPM detectado: ${musicalTiming.bpm}. Trabalhe a consistência.`
        );
      }

      // Ritmo
      if (musicalTiming.rhythmAccuracy >= 75) {
        feedback.push('🎶 Excelente precisão rítmica! Você canta no tempo.');
      } else {
        feedback.push('🎶 Dica: Ouça mais atentamente o beat. Tente acompanhar melhor.');
      }

      // Vibrato
      if (vibrato >= 70 && vibrato <= 90) {
        feedback.push('✨ Vibrato natural e bem executado!');
      } else if (vibrato > 90) {
        feedback.push('✨ Dica: Reduza um pouco o vibrato para soar mais natural.');
      }

      if (feedback.length === 0) {
        feedback.push('💪 Continue praticando! Cada apresentação é uma oportunidade de aprender.');
      }

      return feedback;
    },
    []
  );

  return {
    metrics,
    comparison,
    updateAdvancedMetrics,
    calculateComparison,
    generateAdvancedFeedback,
  };
}
