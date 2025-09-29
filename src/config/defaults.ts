import type { VadConfig } from '../types';

export const DEFAULT_CONFIG: Required<VadConfig> = {
  modelUrl: '/models/silero_vad.onnx',
  sampleRate: 16000,
  frameSize: 512,
  threshold: 0.5,
  minSilenceDuration: 250, // ms
  minSpeechDuration: 250,  // ms
  maxSpeechDuration: 30000 // ms
};

export function createConfig(userConfig: VadConfig = {}): Required<VadConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig
  };
}