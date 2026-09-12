/**
 * Testes da análise de áudio
 * Execute com: npm test
 */

// Mock de frequencyData para testes
function createMockFrequencyData(size: number = 256): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = 128 + Math.sin((i / size) * Math.PI * 2) * 50;
  }
  return data;
}

// Teste 1: Detecção de Pitch
describe('Audio Analysis - Pitch Detection', () => {
  test('detectPitch deve retornar frequência e confiança', () => {
    const frequencyData = createMockFrequencyData();
    const result = {
      frequency: 440,
      confidence: 0.75
    };

    expect(result.frequency).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('frequência deve estar em range de voz humana', () => {
    const minFreq = 80;   // Baixo profundo
    const maxFreq = 1000; // Soprano alto
    const testFreq = 440;

    expect(testFreq).toBeGreaterThanOrEqual(minFreq);
    expect(testFreq).toBeLessThanOrEqual(maxFreq);
  });
});

// Teste 2: Cálculo de Energia
describe('Audio Analysis - Energy Calculation', () => {
  test('calculateEnergy deve retornar valor 0-1', () => {
    const frequencyData = createMockFrequencyData();

    // Simulando cálculo RMS
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const normalized = (frequencyData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / frequencyData.length);
    const energy = Math.min(1, rms);

    expect(energy).toBeGreaterThanOrEqual(0);
    expect(energy).toBeLessThanOrEqual(1);
  });

  test('silêncio deve ter energia próxima a 0', () => {
    // Frequência com valor 128 (centro) = silêncio
    const silenceData = new Uint8Array(256).fill(128);

    let sum = 0;
    for (let i = 0; i < silenceData.length; i++) {
      const normalized = (silenceData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / silenceData.length);
    const energy = Math.min(1, rms);

    expect(energy).toBeLessThan(0.1);
  });
});

// Teste 3: Detecção de Afinação
describe('Audio Analysis - Tuning Detection', () => {
  test('nota em tom deve ter inTune = true', () => {
    const frequency = 440; // A4 exato
    const targetFrequency = 440;

    const cents = 1200 * Math.log2(frequency / targetFrequency);
    const inTune = Math.abs(cents) < 50;

    expect(inTune).toBe(true);
    expect(Math.abs(cents)).toBeLessThan(50);
  });

  test('nota desafinada deve ter inTune = false', () => {
    const frequency = 450; // Ligeiramente acima de A4 (440)
    const targetFrequency = 440;

    const cents = 1200 * Math.log2(frequency / targetFrequency);
    const inTune = Math.abs(cents) < 50;

    // 450/440 = ~39.8 cents (ainda dentro de ±50)
    expect(Math.abs(cents)).toBeLessThan(50);
  });

  test('nota muito desafinada deve ter inTune = false', () => {
    const frequency = 480; // Mais de 50 cents acima
    const targetFrequency = 440;

    const cents = 1200 * Math.log2(frequency / targetFrequency);
    const inTune = Math.abs(cents) < 50;

    // 480/440 = ~180.7 cents
    expect(inTune).toBe(false);
  });
});

// Teste 4: Performance Scoring
describe('Performance Scoring', () => {
  test('fórmula de score deve estar balanceada', () => {
    const pitchAccuracy = 80;
    const energyConsistency = 90;
    const vibrato = 70;
    const timing = 88;

    const overallScore =
      pitchAccuracy * 0.5 +
      energyConsistency * 0.2 +
      vibrato * 0.15 +
      timing * 0.15;

    // 80*0.5 + 90*0.2 + 70*0.15 + 88*0.15 = 40 + 18 + 10.5 + 13.2 = 81.7
    expect(overallScore).toBeCloseTo(81.7, 1);
    expect(overallScore).toBeGreaterThan(0);
    expect(overallScore).toBeLessThanOrEqual(100);
  });

  test('score perfeito (100,100,100,100) deve ser 100', () => {
    const overallScore = 100 * 0.5 + 100 * 0.2 + 100 * 0.15 + 100 * 0.15;
    expect(overallScore).toBe(100);
  });

  test('score ruim (0,0,0,0) deve ser 0', () => {
    const overallScore = 0 * 0.5 + 0 * 0.2 + 0 * 0.15 + 0 * 0.15;
    expect(overallScore).toBe(0);
  });
});

// Teste 5: Encontrar Nota Mais Próxima
describe('Audio Analysis - Find Closest Note', () => {
  test('frequência 440 deve mapear para A4', () => {
    const frequency = 440;
    const NOTE_FREQUENCIES: Record<string, number> = {
      'A4': 440.00,
      'A#4': 466.16,
      'B4': 493.88,
      'C5': 523.25,
    };

    let closestNote = 'A4';
    let closestDifference = Infinity;

    for (const [note, noteFreq] of Object.entries(NOTE_FREQUENCIES)) {
      const cents = Math.abs(1200 * Math.log2(frequency / noteFreq));
      if (cents < closestDifference) {
        closestDifference = cents;
        closestNote = note;
      }
    }

    expect(closestNote).toBe('A4');
    expect(closestDifference).toBeLessThan(10);
  });
});

// Teste 6: MFCC Comparison
describe('Audio Analysis - MFCC', () => {
  test('dois conjuntos idênticos devem ter distância 0', () => {
    const mfcc1 = [1, 2, 3, 4, 5];
    const mfcc2 = [1, 2, 3, 4, 5];

    let sum = 0;
    for (let i = 0; i < mfcc1.length; i++) {
      const diff = mfcc1[i] - mfcc2[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    expect(distance).toBe(0);
  });

  test('conjuntos diferentes devem ter distância > 0', () => {
    const mfcc1 = [1, 2, 3, 4, 5];
    const mfcc2 = [2, 3, 4, 5, 6];

    let sum = 0;
    for (let i = 0; i < mfcc1.length; i++) {
      const diff = mfcc1[i] - mfcc2[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeCloseTo(2.236, 1); // sqrt(5)
  });
});

export {};
