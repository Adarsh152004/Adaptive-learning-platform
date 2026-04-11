import { useState, useEffect, useRef, useCallback } from "react";

// Types for emotion detection
export type EmotionState = "neutral" | "happy" | "sad" | "angry" | "surprised" | "fearful" | "disgusted";

export interface DetectionResult {
  emotion: EmotionState;
  stressScore: number;
  pitch: number;
  energy: number;
}

export const useEmotionEngine = (isActive: boolean) => {
  const [result, setResult] = useState<DetectionResult>({
    emotion: "neutral",
    stressScore: 10,
    pitch: 0,
    energy: 0,
  });
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Sensors
  useEffect(() => {
    if (isActive) {
      setupSensors();
    } else {
      stopSensors();
    }
    return () => stopSensors();
  }, [isActive]);

  const setupSensors = async () => {
    try {
      // 1. Setup Camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: true 
      });
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }

      // 2. Setup Audio Context for Voice Analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      startAnalysisLoop();
    } catch (err) {
      console.error("Error setting up emotion sensors:", err);
    }
  };

  const stopSensors = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    setIsCameraReady(false);
  };

  const startAnalysisLoop = () => {
    if (!isActive) return;

    // Smoothing buffers
    const stressBuffer: number[] = [];
    const emotionHistory: Record<string, number> = {};
    const smoothingWindow = 30; // ~1 second of frames

    const analyze = () => {
      if (!isActive || !analyserRef.current) return;

      // --- 1. Audio Analysis ---
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const energy = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      let maxVal = 0;
      let maxIdx = 0;
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxVal) {
          maxVal = dataArray[i];
          maxIdx = i;
        }
      }
      const pitch = maxIdx * (audioContextRef.current?.sampleRate || 44100) / analyserRef.current.fftSize;

      // --- 2. Facial Analysis (Stabilized Mock) ---
      const mockEmotions: EmotionState[] = ["neutral", "happy", "sad", "angry", "surprised"];
      // Weighted mock: 80% chance to keep previous emotion to avoid flicker
      let currentSampleEmotion = result.emotion;
      if (Math.random() > 0.95) {
        currentSampleEmotion = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
      }

      // --- 3. Composite Stress Score Logic with Smoothing ---
      let rawStress = 10;
      if (currentSampleEmotion === "sad" || currentSampleEmotion === "angry") rawStress += 40;
      if (energy > 50) rawStress += 20;
      if (pitch > 300) rawStress += 15;

      // Update stress buffer and calculate rolling average
      stressBuffer.push(rawStress);
      if (stressBuffer.length > smoothingWindow) stressBuffer.shift();
      const avgStress = stressBuffer.reduce((a, b) => a + b, 0) / stressBuffer.length;

      setResult({
        emotion: currentSampleEmotion,
        stressScore: Math.round(avgStress),
        pitch: Math.round(pitch),
        energy: Math.round(energy),
      });

      if (isActive) {
        requestAnimationFrame(analyze);
      }
    };

    analyze();
  };

  return { videoRef, result, isCameraReady };
};
