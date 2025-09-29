import { InferenceSession, Tensor } from 'onnxruntime-web';
import type { VadConfig, VadResult, AudioChunk } from '../types';

export class SileroProcessor {
  private session: InferenceSession | null = null;
  private config: VadConfig;
  private h: Tensor | null = null;
  private c: Tensor | null = null;
  private sampleBuffer: Float32Array = new Float32Array(0);

  constructor(config: VadConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.session = await InferenceSession.create(this.config.modelUrl || '/models/silero_vad.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      // Log model inputs and outputs for debugging
      console.log('Model inputs:', this.session.inputNames);
      console.log('Model outputs:', this.session.outputNames);

      this.resetState();
    } catch (error) {
      throw new Error(`Failed to initialize Silero VAD: ${error}`);
    }
  }

  private resetState(): void {
    // Initialize hidden states for LSTM
    this.h = new Tensor('float32', new Float32Array(128).fill(0), [1, 1, 128]);
    this.c = new Tensor('float32', new Float32Array(128).fill(0), [1, 1, 128]);
    this.sampleBuffer = new Float32Array(0);
  }

  async processAudio(chunk: AudioChunk): Promise<VadResult> {
    if (!this.session) {
      throw new Error('Silero processor not initialized');
    }

    // Accumulate samples
    this.sampleBuffer = this.concatenateAudio(this.sampleBuffer, chunk.data);

    // Process if we have enough samples
    const frameSize = this.config.frameSize || 512;
    if (this.sampleBuffer.length >= frameSize) {
      const frame = this.sampleBuffer.slice(0, frameSize);
      this.sampleBuffer = this.sampleBuffer.slice(frameSize);

      const probability = await this.runInference(frame);
      const isSpeech = probability > (this.config.threshold || 0.5);

      return {
        probability,
        isSpeech,
        timestamp: chunk.timestamp
      };
    }

    // Not enough data yet, return neutral result
    return {
      probability: 0,
      isSpeech: false,
      timestamp: chunk.timestamp
    };
  }

  private concatenateAudio(buffer1: Float32Array, buffer2: Float32Array): Float32Array {
    const result = new Float32Array(buffer1.length + buffer2.length);
    result.set(buffer1, 0);
    result.set(buffer2, buffer1.length);
    return result;
  }

  private async runInference(audioFrame: Float32Array): Promise<number> {
    if (!this.session || !this.h || !this.c) {
      throw new Error('Session not properly initialized');
    }

    try {
      // Prepare input tensor
      const input = new Tensor('float32', audioFrame, [1, audioFrame.length]);
      const sr = new Tensor('int64', BigInt64Array.from([BigInt(this.config.sampleRate || 16000)]), [1]);

      // Build feeds based on actual model input names
      const feeds: Record<string, Tensor> = {};
      const inputNames = this.session.inputNames;

      // Add required inputs based on what the model expects
      if (inputNames.includes('input')) {
        feeds.input = input;
      }
      if (inputNames.includes('sr')) {
        feeds.sr = sr;
      }

      // Handle state inputs
      if (inputNames.includes('state')) {
        // Newer model format: concatenate h and c into state tensor
        const stateData = new Float32Array(256); // 128 + 128
        stateData.set(this.h.data as Float32Array, 0);
        stateData.set(this.c.data as Float32Array, 128);
        feeds.state = new Tensor('float32', stateData, [2, 1, 128]);
      } else {
        // Older model format: separate h and c inputs
        if (inputNames.includes('h')) {
          feeds.h = this.h;
        }
        if (inputNames.includes('c')) {
          feeds.c = this.c;
        }
      }

      console.log('Using feeds:', Object.keys(feeds));
      const results = await this.session.run(feeds);

      // Update hidden states from results
      if (results.stateN) {
        // Newer format: split state back into h and c
        const stateData = results.stateN.data as Float32Array;
        this.h = new Tensor('float32', stateData.slice(0, 128), [1, 1, 128]);
        this.c = new Tensor('float32', stateData.slice(128, 256), [1, 1, 128]);
      } else {
        // Older format: use separate outputs
        if (results.hn) this.h = results.hn;
        if (results.cn) this.c = results.cn;
      }

      // Extract probability
      const output = results.output;
      if (output && output.data.length > 0) {
        return Number(output.data[0]);
      }

      return 0;
    } catch (error) {
      console.error('Inference error:', error);
      console.error('Available inputs:', this.session.inputNames);
      console.error('Available outputs:', this.session.outputNames);
      return 0;
    }
  }

  reset(): void {
    this.resetState();
  }

  destroy(): void {
    if (this.session) {
      this.session = null;
    }
    this.h = null;
    this.c = null;
    this.sampleBuffer = new Float32Array(0);
  }
}