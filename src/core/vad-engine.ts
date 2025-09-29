import type { VadConfig, VadResult, AudioChunk } from '../types';
import { AudioProcessor } from './audio-processor';
import { WorkerManager } from '../worker/worker-manager';
import { EventManager } from './event-manager';
import { createConfig } from '../config/defaults';
import { validateConfig } from '../config/validation';
import { isVadResult } from '../utils/type-guards';

export class VadEngine extends EventManager {
  private audioProcessor: AudioProcessor;
  private workerManager: WorkerManager;
  private config: Required<VadConfig>;
  private isProcessing = false;
  private isInitialized = false;
  private speechState = false;
  private speechStartTime = 0;
  private silenceStartTime = 0;

  constructor(config: VadConfig = {}) {
    super();

    validateConfig(config);
    this.config = createConfig(config);

    this.audioProcessor = new AudioProcessor(this.config);
    this.workerManager = new WorkerManager();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.audioProcessor.initializeAudioContext();
    await this.workerManager.initialize(this.config);
    this.isInitialized = true;
  }

  async attachAudioStream(stream: MediaStream): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Already processing audio stream');
    }

    await this.initialize();

    this.audioProcessor.connectStream(stream, (chunk) => {
      this.processAudioChunk(chunk);
    });

    this.isProcessing = true;
  }

  private async processAudioChunk(chunk: AudioChunk): Promise<void> {
    try {
      const response = await this.workerManager.processAudio(chunk);

      if (response.type === 'result' && response.data && isVadResult(response.data)) {
        this.handleVadResult(response.data, chunk);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  private handleVadResult(result: VadResult, chunk: AudioChunk): void {
    const currentTime = Date.now();

    if (result.isSpeech && !this.speechState) {
      this.startSpeech(result, currentTime);
    } else if (!result.isSpeech && this.speechState) {
      this.checkSilenceDuration(result, currentTime);
    } else if (result.isSpeech && this.speechState) {
      this.continueSpeech(chunk, currentTime);
    }
  }

  private startSpeech(result: VadResult, currentTime: number): void {
    this.speechState = true;
    this.speechStartTime = currentTime;
    this.silenceStartTime = 0;
    this.emitSpeechStart(result);
  }

  private checkSilenceDuration(result: VadResult, currentTime: number): void {
    if (this.silenceStartTime === 0) {
      this.silenceStartTime = currentTime;
      return;
    }

    const silenceDuration = currentTime - this.silenceStartTime;

    if (silenceDuration >= this.config.minSilenceDuration) {
      this.stopSpeech(result);
    }
  }

  private continueSpeech(chunk: AudioChunk, currentTime: number): void {
    this.silenceStartTime = 0;
    this.emitSpeechData(chunk);

    const speechDuration = currentTime - this.speechStartTime;
    if (speechDuration >= this.config.maxSpeechDuration) {
      this.stopSpeech({
        probability: 0,
        isSpeech: false,
        timestamp: currentTime
      });
    }
  }

  private stopSpeech(result: VadResult): void {
    this.speechState = false;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
    this.emitSpeechStop(result);
  }

  detachAudioStream(): void {
    this.isProcessing = false;
    this.speechState = false;
    this.audioProcessor.disconnect();
  }

  async reset(): Promise<void> {
    this.detachAudioStream();
    await this.workerManager.reset();
  }

  async destroy(): Promise<void> {
    this.detachAudioStream();
    await this.audioProcessor.destroy();
    await this.workerManager.destroy();
    this.isInitialized = false;
  }
}