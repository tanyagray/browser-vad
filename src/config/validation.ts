import type { VadConfig } from '../types';

export function validateConfig(config: VadConfig): void {
  if (config.sampleRate && config.sampleRate <= 0) {
    throw new Error('Sample rate must be positive');
  }

  if (config.frameSize && config.frameSize <= 0) {
    throw new Error('Frame size must be positive');
  }

  if (config.threshold && (config.threshold < 0 || config.threshold > 1)) {
    throw new Error('Threshold must be between 0 and 1');
  }

  if (config.minSilenceDuration && config.minSilenceDuration < 0) {
    throw new Error('Min silence duration must be non-negative');
  }

  if (config.minSpeechDuration && config.minSpeechDuration < 0) {
    throw new Error('Min speech duration must be non-negative');
  }

  if (config.maxSpeechDuration && config.maxSpeechDuration < 0) {
    throw new Error('Max speech duration must be non-negative');
  }
}