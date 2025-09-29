import type { AudioChunk, VadConfig } from '../types';
import { resampleAudio, createAudioBuffer } from '../utils/audio-utils';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private config: Required<VadConfig>;

  constructor(config: Required<VadConfig>) {
    this.config = config;
  }

  async initializeAudioContext(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate
    });

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  connectStream(
    stream: MediaStream,
    onAudioData: (chunk: AudioChunk) => void
  ): void {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.scriptProcessor = this.audioContext.createScriptProcessor(
      this.config.frameSize,
      1,
      1
    );

    this.analyser.fftSize = this.config.frameSize * 2;
    this.analyser.smoothingTimeConstant = 0;

    this.scriptProcessor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer.getChannelData(0);
      const audioData = this.processAudioFrame(inputBuffer);

      if (audioData) {
        onAudioData(audioData);
      }
    };

    source.connect(this.analyser);
    this.analyser.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  private processAudioFrame(inputData: Float32Array): AudioChunk | null {
    if (!this.audioContext) return null;

    const resampledData = resampleAudio(
      inputData,
      this.audioContext.sampleRate,
      this.config.sampleRate
    );

    return createAudioBuffer(
      resampledData,
      this.config.sampleRate,
      this.audioContext.currentTime * 1000
    );
  }

  disconnect(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }

  async destroy(): Promise<void> {
    this.disconnect();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}