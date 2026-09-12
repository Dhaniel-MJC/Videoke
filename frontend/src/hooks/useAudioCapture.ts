import { useEffect, useRef, useCallback, useState } from 'react';

export interface AudioMetrics {
  frequency: number;
  confidence: number;
  timestamp: number;
  rms: number;
}

interface UseAudioCaptureOptions {
  onMetrics?: (metrics: AudioMetrics) => void;
  onError?: (error: Error) => void;
  fftSize?: number;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}) {
  const {
    onMetrics,
    onError,
    fftSize = 4096,
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef(false);
  const metricsBufferRef = useRef<AudioMetrics[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detectar frequência fundamental usando autocorrelação
  const detectPitch = useCallback((buffer: Uint8Array): { frequency: number; confidence: number } => {
    try {
      // Converter para Float32Array
      const float32Buffer = new Float32Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        float32Buffer[i] = (buffer[i] - 128) / 128;
      }

      // Correlação automática para detecção de pitch
      const SIZE = float32Buffer.length;
      const MAX_SAMPLES = Math.floor(SIZE / 2);
      let best_offset = -1;
      let best_correlation = 0;
      let shift_quality = 0;

      // Encontrar o melhor offset correlacionado
      for (let offset = 0; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;
        for (let i = 0; i < MAX_SAMPLES; i++) {
          correlation += Math.abs(float32Buffer[i] - float32Buffer[i + offset]);
        }

        if (correlation < best_correlation || best_offset === -1) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }

      if (best_correlation < SIZE / 2) {
        shift_quality = 1.0 - best_correlation / (SIZE / 2);
      }

      // Calcular frequência em Hz
      const T0 = best_offset;
      const frequency = audioContextRef.current ?
        audioContextRef.current.sampleRate / T0 :
        44100 / T0;

      // Confidence entre 0 e 1
      const confidence = Math.min(1, shift_quality);

      return { frequency, confidence };
    } catch (e) {
      console.error('Pitch detection error:', e);
      return { frequency: 0, confidence: 0 };
    }
  }, []);

  // Calcular RMS (Root Mean Square) para medir volume
  const calculateRMS = useCallback((buffer: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = (buffer[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / buffer.length);
  }, []);

  // Iniciar captura de áudio
  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      // Criar contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Criar analisador
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.3;

      analyserRef.current = analyser;

      // Conectar microfone ao analisador
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsCapturing(true);
      processingRef.current = true;

      // Loop de processamento de áudio
      const processAudio = () => {
        if (!processingRef.current || !analyserRef.current) return;

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);

        // Detectar pitch
        const { frequency, confidence } = detectPitch(frequencyData);

        // Calcular RMS
        const rms = calculateRMS(frequencyData);

        // Criar métrica
        const metric: AudioMetrics = {
          frequency,
          confidence,
          timestamp: Date.now(),
          rms,
        };

        // Adicionar ao buffer
        metricsBufferRef.current.push(metric);

        // Manter apenas os últimos 100 samples
        if (metricsBufferRef.current.length > 100) {
          metricsBufferRef.current.shift();
        }

        // Callback com as métricas
        onMetrics?.(metric);

        requestAnimationFrame(processAudio);
      };

      processAudio();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      onError?.(error);
      setIsCapturing(false);
    }
  }, [detectPitch, calculateRMS, fftSize, onMetrics, onError]);

  // Parar captura
  const stopCapture = useCallback(() => {
    processingRef.current = false;
    setIsCapturing(false);

    // Parar todas as tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Fechar contexto de áudio
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        // Pode gerar erro se já estiver fechado
      });
      audioContextRef.current = null;
    }
  }, []);

  // Obter métricas atuais
  const getMetrics = useCallback(() => {
    return [...metricsBufferRef.current];
  }, []);

  // Obter última métrica
  const getLastMetric = useCallback(() => {
    return metricsBufferRef.current[metricsBufferRef.current.length - 1] || null;
  }, []);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isCapturing,
    error,
    startCapture,
    stopCapture,
    getMetrics,
    getLastMetric,
  };
}
