# 🎵 Análise de Áudio - Documentação Técnica

## Visão Geral

O sistema de análise de áudio do Videoke implementa detecção de pitch em tempo real, cálculo de métricas de performance e geração de feedback automático baseado em técnicas de processamento de sinal digital.

## Componentes Principais

### 1. `useAudioCapture` Hook

**Localização:** `frontend/src/hooks/useAudioCapture.ts`

Responsável por capturar áudio do microfone do usuário utilizando a Web Audio API.

#### Funcionalidades:
- Captura de stream de áudio em tempo real
- Análise com FFT (Fast Fourier Transform)
- Detecção de pitch usando autocorrelação
- Cálculo de RMS (volume)
- Buffer gerenciável com últimos 100 samples

#### Uso:
```typescript
const { isCapturing, startCapture, stopCapture, getMetrics } = useAudioCapture({
  onMetrics: (metrics) => console.log(metrics),
  fftSize: 4096,
});

await startCapture();
// ... capturando
stopCapture();
```

### 2. `audioAnalysis.ts` - Utilities

**Localização:** `frontend/src/utils/audioAnalysis.ts`

Funções para análise de características de áudio:

#### Principais Funções:

**`detectPitch(frequencyData, sampleRate)`**
- Detecção de frequência fundamental usando AMDF
- Retorna: `{ frequency: number, confidence: number }`
- Range típico: 80-400 Hz (voz humana)

**`calculateEnergy(frequencyData)`**
- Calcula RMS (volume) do sinal
- Retorna: número 0-1

**`calculateSpectralCentroid(frequencyData)`**
- Mede "brilho" do áudio (frequências altas vs baixas)
- Usado para análise de timbre

**`calculateMFCC(frequencyData, numCoefficients)`**
- Extrai 13 Mel-Frequency Cepstral Coefficients
- Simula percepção auditiva humana
- Usado para análise avançada de timbre

**`extractAudioFeatures(frequencyData, sampleRate)`**
- Extrai todas as features de uma vez
- Retorna: `AudioFeatures` object

**`detectTuning(frequency, targetFrequency)`**
- Compara frequência detectada com nota alvo
- Retorna diferença em cents (100 cents = 1 semitom)
- Ideal para afinação

**`findClosestNote(frequency)`**
- Encontra a nota musical mais próxima
- Suporta notas C4 a B5

### 3. `scoring.ts` - Sistema de Pontuação

**Localização:** `frontend/src/utils/scoring.ts`

Classe `PerformanceAnalyzer` que calcula métricas de performance.

#### Métricas Calculadas:

1. **Pitch Accuracy (50% do score)**
   - % de tempo que o usuário está dentro de ±50 cents da nota alvo
   - Score: 0-100

2. **Energy Consistency (20% do score)**
   - Consistência de volume ao longo do tempo
   - Baseado em coeficiente de variação
   - Score: 0-100

3. **Vibrato Quality (15% do score)**
   - Qualidade de vibrato na voz
   - Avalia variação natural de pitch
   - Score: 0-100

4. **Timing Consistency (15% do score)**
   - Consistência temporal de amostragem
   - Avalia estabilidade rítmica
   - Score: 0-100

#### Overall Score (Final)
```
Score Final = (Pitch × 0.50) + (Energy × 0.20) + (Vibrato × 0.15) + (Timing × 0.15)
```

#### Uso:
```typescript
const analyzer = new PerformanceAnalyzer();
analyzer.setTargetKey('A4'); // Nota alvo

// Adicionar features conforme chegam
analyzer.addFeatures(audioFeatures);

// Obter métricas
const metrics = analyzer.getMetrics();
// {
//   pitchAccuracy: 85,
//   energyConsistency: 90,
//   vibrato: 70,
//   timing: 88,
//   overallScore: 83
// }

// Gerar feedback
const feedback = analyzer.generateFeedback();
// ["🎵 Excelente afinação!", "🔊 Bom controle de volume", ...]
```

## Fluxo de Processamento

```
Microfone (getUserMedia)
    ↓
AudioContext + AnalyserNode (FFT)
    ↓
Web Audio API (frequencyData)
    ↓
audioAnalysis.extractAudioFeatures()
    ↓
PerformanceAnalyzer.addFeatures()
    ↓
PerformanceAnalyzer.getMetrics()
    ↓
WebSocket.emit('audio_metrics') → Backend
```

## Algoritmos Implementados

### 1. Detecção de Pitch - AMDF (Average Magnitude Difference Function)

```
Para cada lag (0 a MAX_SAMPLES):
  difference = SUM(|signal[i] - signal[i+lag]|)
  Se difference for mínima → encontrou o lag
  
frequency = sampleRate / lag
```

**Vantagens:**
- Robusto a ruído
- Não é sensível a harmônicos
- Computacionalmente eficiente

### 2. MFCC - Mel-Frequency Cepstral Coefficients

```
1. Aplicar janela Hamming ao sinal
2. Dividir em bandas de frequência Mel (40 bandas)
3. Calcular energia em cada banda
4. Aplicar log (percepção auditiva)
5. DCT (Discrete Cosine Transform)
6. Extrair 13 coeficientes principais
```

**Aplicações:**
- Análise de timbre
- Comparação de performances
- Detecção de características vocais

### 3. Zero Crossing Rate

```
crossings = número de vezes que o sinal cruza zero
zcr = crossings / comprimento_do_sinal
```

**Significado:**
- Valores baixos = sinal suave (notas sustentadas)
- Valores altos = sinal ruidoso/percussivo

## Calibração e Limites

### Range de Frequências (Voz Humana)
- Soprano: 250-1000 Hz
- Alto: 150-500 Hz
- Tenor: 130-520 Hz
- Barítono: 100-390 Hz
- Baixo: 80-300 Hz

**Valor Padrão Usado:** A4 (440 Hz)

### Confidence Threshold
- < 0.3: Descartado (ruído)
- 0.3-0.7: Incerto
- > 0.7: Confiável

### Intonação (Tuning)
- ±50 cents: Considerado "afinado"
- 1 cent = 1/100 de semitom
- Ouvido humano detecta ~5 cents de diferença

## Limitações e Considerações

1. **Accuracy de Pitch**
   - Afetada por ruído ambiente
   - Requer confiança > 50% para ser válida
   - Pitch muito baixo (<50 Hz) é difícil de detectar

2. **Latência**
   - Web Audio API: ~50-100ms
   - FFT (4096 samples @ 44.1kHz): ~93ms
   - Total: ~150ms (imperceptível para usuário)

3. **Noise Robustness**
   - SNR ideal: > 20dB
   - Teste em ambiente controlado primeiro

4. **Browser Compatibility**
   - Chrome/Edge: Suporte completo
   - Firefox: Suporte completo
   - Safari: Suporte limitado (pode pedir permissão extra)

## Testes Recomendados

### Teste 1: Detecção de Pitch
```typescript
// Reproduzir tons puros (440 Hz)
// Verificar se detecta frequência corretamente
```

### Teste 2: Nota Sustentada
```typescript
// Cantar uma nota e verificar score
// Esperado: pitchAccuracy ~80%+ em ambiente silencioso
```

### Teste 3: Escala Ascendente
```typescript
// Cantar uma escala (C-D-E-F-G-A-B-C)
// Verificar se cada nota é detectada
```

### Teste 4: Performance Comparativa
```typescript
// Mesmo usuário cantando 2x
// Verificar reproducibilidade de scores
```

## Melhorias Futuras

1. **Integração Essentia.js**
   - Biblioteca ML especializada em áudio
   - Pitch detection mais preciso
   - Feature extraction avançado

2. **Crepe.js**
   - Detecção de pitch baseada em redes neurais
   - Melhor performance em áudio ruidoso
   - Modelo treinado em 24 horas de voz

3. **Harmonic-Percussive Separation**
   - Separar componentes harmônicos de ruído
   - Melhorar análise de pitch

4. **Beat Tracking**
   - Sincronização com o ritmo da música
   - Melhorar análise de timing

5. **Voice Activity Detection (VAD)**
   - Detectar automaticamente quando usuário está cantando
   - Ignorar silêncios

## Referências

- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Essentia: https://essentia.upf.edu/
- MFCC: https://en.wikipedia.org/wiki/Mel-frequency_cepstrum
- Pitch Detection: https://en.wikipedia.org/wiki/Pitch_detection_algorithm

## Contato & Suporte

Para dúvidas ou sugestões sobre o sistema de análise de áudio, abra uma issue no repositório.
