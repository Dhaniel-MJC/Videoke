/**
 * Utilities para análise de áudio usando Web Audio API
 * Implementa detecção de pitch, timbre, e outras features
 */

export interface AudioFeatures {
  pitch: number; // Frequência em Hz
  confidence: number; // Confiança da detecção 0-1
  energy: number; // Energia/volume 0-1
  spectralCentroid: number; // Centro espectral (timbre)
  zeroCrossingRate: number; // Taxa de cruzamento zero
  mfcc: number[]; // Mel-Frequency Cepstral Coefficients
}

/**
 * Converter bytes de frequência para float normalizado
 */
export function byteFrequencyToFloat(frequencyData: Uint8Array): Float32Array {
  const float32 = new Float32Array(frequencyData.length);
  for (let i = 0; i < frequencyData.length; i++) {
    float32[i] = (frequencyData[i] - 128) / 128;
  }
  return float32;
}

/**
 * Detectar pitch usando autocorrelação
 */
export function detectPitch(frequencyData: Uint8Array, sampleRate: number = 44100): { frequency: number; confidence: number } {
  const buffer = byteFrequencyToFloat(frequencyData);

  // AMDF - Average Magnitude Difference Function
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let best_offset = -1;
  let best_difference = Infinity;

  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let difference = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      const delta = buffer[i] - buffer[i + offset];
      difference += delta * delta;
    }

    if (difference < best_difference) {
      best_difference = difference;
      best_offset = offset;
    }
  }

  const T0 = best_offset;
  const frequency = T0 > 0 ? sampleRate / T0 : 0;

  // Confidence baseado na qualidade do match
  const confidence = best_difference === Infinity ? 0 : Math.max(0, 1 - (best_difference / (SIZE * 0.1)));

  return { frequency: Math.max(0, frequency), confidence: Math.min(1, confidence) };
}

/**
 * Calcular energia do sinal (RMS)
 */
export function calculateEnergy(frequencyData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    const normalized = (frequencyData[i] - 128) / 128;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / frequencyData.length);
  return Math.min(1, rms);
}

/**
 * Calcular centróide espectral (indicador de "brilho" do áudio)
 */
export function calculateSpectralCentroid(frequencyData: Uint8Array): number {
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = frequencyData[i];
    numerator += i * magnitude;
    denominator += magnitude;
  }

  if (denominator === 0) return 0;
  return (numerator / denominator) / frequencyData.length;
}

/**
 * Taxa de cruzamento zero (Zero Crossing Rate)
 * Mais alto = sinal mais percussivo/ruidoso
 */
export function calculateZeroCrossingRate(frequencyData: Uint8Array): number {
  let crossings = 0;
  const buffer = byteFrequencyToFloat(frequencyData);

  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) {
      crossings++;
    }
  }

  return crossings / buffer.length;
}

/**
 * Calcular MFCCs (Mel-Frequency Cepstral Coefficients) - 13 coeficientes
 * Simula a percepção auditiva humana
 */
export function calculateMFCC(frequencyData: Uint8Array, numCoefficients: number = 13): number[] {
  const buffer = byteFrequencyToFloat(frequencyData);
  const mfcc: number[] = new Array(numCoefficients).fill(0);

  // Aplicar janela Hamming
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (buffer.length - 1));
  }

  // Calcular energia em diferentes bandas de frequência
  const melBands = 40;
  const melEnergies = new Array(melBands).fill(0);

  for (let band = 0; band < melBands; band++) {
    const startBin = Math.floor((band / melBands) * buffer.length);
    const endBin = Math.floor(((band + 1) / melBands) * buffer.length);

    for (let i = startBin; i < endBin; i++) {
      melEnergies[band] += buffer[i] * buffer[i];
    }
  }

  // Calcular logaritmo da energia (semelhante ao ouvido humano)
  for (let i = 0; i < melBands; i++) {
    melEnergies[i] = Math.log(melEnergies[i] + 1e-10);
  }

  // DCT (Discrete Cosine Transform) para extrair MFCCs
  for (let i = 0; i < numCoefficients; i++) {
    let sum = 0;
    for (let j = 0; j < melBands; j++) {
      sum += melEnergies[j] * Math.cos((Math.PI * i * (j + 0.5)) / melBands);
    }
    mfcc[i] = sum;
  }

  return mfcc;
}

/**
 * Comparar dois conjuntos de MFCCs
 * Retorna distância (0 = idêntico, maior = mais diferente)
 */
export function compareMFCC(mfcc1: number[], mfcc2: number[]): number {
  if (mfcc1.length !== mfcc2.length) {
    throw new Error('MFCC arrays must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < mfcc1.length; i++) {
    const diff = mfcc1[i] - mfcc2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Extrair todas as features de áudio
 */
export function extractAudioFeatures(
  frequencyData: Uint8Array,
  sampleRate: number = 44100
): AudioFeatures {
  const { frequency, confidence } = detectPitch(frequencyData, sampleRate);
  const energy = calculateEnergy(frequencyData);
  const spectralCentroid = calculateSpectralCentroid(frequencyData);
  const zeroCrossingRate = calculateZeroCrossingRate(frequencyData);
  const mfcc = calculateMFCC(frequencyData);

  return {
    pitch: frequency,
    confidence,
    energy,
    spectralCentroid,
    zeroCrossingRate,
    mfcc,
  };
}

/**
 * Suavizar pitch ao longo do tempo (remover saltos aleatórios)
 */
export function smoothPitchBuffer(pitches: number[], windowSize: number = 5): number[] {
  const smoothed: number[] = [];

  for (let i = 0; i < pitches.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(pitches.length, i + Math.ceil(windowSize / 2));

    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      if (pitches[j] > 0) {
        sum += pitches[j];
        count++;
      }
    }

    smoothed[i] = count > 0 ? sum / count : 0;
  }

  return smoothed;
}

/**
 * Detectar vibratos (oscilações de pitch)
 */
export function detectVibrato(pitches: number[], sampleRate: number = 44100): { rate: number; depth: number } {
  if (pitches.length < 10) return { rate: 0, depth: 0 };

  // Calcular desvio padrão
  const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const variance = pitches.reduce((a, b) => a + (b - mean) ** 2, 0) / pitches.length;
  const depth = Math.sqrt(variance);

  // Estimar frequência de vibrato através de FFT simples
  let rate = 0;
  if (depth > 10) {
    // Vibrato típico é 4-8 Hz
    rate = 5; // Valor aproximado
  }

  return { rate, depth };
}

/**
 * Detectar afinação em relação a uma nota alvo
 */
export function detectTuning(frequency: number, targetFrequency: number): { cents: number; inTune: boolean } {
  if (frequency <= 0 || targetFrequency <= 0) {
    return { cents: 0, inTune: false };
  }

  // Calcular diferença em cents (100 cents = 1 semitom)
  const cents = 1200 * Math.log2(frequency / targetFrequency);

  // Considerado "afinado" se dentro de ±50 cents
  const inTune = Math.abs(cents) < 50;

  return { cents, inTune };
}

/**
 * Mapa de frequências de notas (C4 até C8)
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

/**
 * Encontrar a nota mais próxima
 */
export function findClosestNote(frequency: number): { note: string; cents: number } {
  let closestNote = 'A4';
  let closestDifference = Infinity;

  for (const [note, noteFreq] of Object.entries(NOTE_FREQUENCIES)) {
    const cents = Math.abs(1200 * Math.log2(frequency / noteFreq));
    if (cents < closestDifference) {
      closestDifference = cents;
      closestNote = note;
    }
  }

  return { note: closestNote, cents: closestDifference };
}
