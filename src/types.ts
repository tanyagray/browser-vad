export interface VadConfig {
  modelUrl?: string;
  sampleRate?: number;
  frameSize?: number;
  threshold?: number;
  minSilenceDuration?: number;
  minSpeechDuration?: number;
  maxSpeechDuration?: number;
}

export interface VadResult {
  probability: number;
  isSpeech: boolean;
  timestamp: number;
}

export interface AudioChunk {
  data: Float32Array;
  timestamp: number;
  sampleRate: number;
}

export interface WorkerMessage {
  type: 'init' | 'process' | 'reset' | 'destroy';
  data?: any;
  config?: VadConfig;
  chunk?: AudioChunk;
}

export interface WorkerResponse {
  type: 'ready' | 'result' | 'error';
  data?: VadResult;
  error?: string;
}

export type VadEventType = 'speech_start' | 'speech_stop' | 'speech_data';

export interface VadEventMap {
  'speech_start': CustomEvent<VadResult>;
  'speech_stop': CustomEvent<VadResult>;
  'speech_data': CustomEvent<AudioChunk>;
}