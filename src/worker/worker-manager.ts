import type { WorkerMessage, WorkerResponse, VadConfig, AudioChunk } from '../types';
import { isWorkerResponse } from '../utils/type-guards';

export class WorkerManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  async initialize(config: Required<VadConfig>): Promise<void> {
    if (this.worker) {
      throw new Error('Worker already initialized');
    }

    this.worker = new Worker(new URL('./vad-worker.ts', import.meta.url), { type: 'module' });

    this.setupMessageHandler();
    await this.sendMessage({ type: 'init', config });
    this.isInitialized = true;
  }

  private setupMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event) => {
      const response = event.data;

      if (!isWorkerResponse(response)) {
        console.warn('Invalid worker response:', response);
        return;
      }

      this.handleWorkerResponse(response);
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.rejectAllPendingMessages(new Error('Worker error'));
    };
  }

  private handleWorkerResponse(response: WorkerResponse): void {
    if (response.type === 'error') {
      const error = new Error(response.error || 'Unknown worker error');
      this.rejectAllPendingMessages(error);
      return;
    }

    // Handle ready and result responses
    const pendingMessage = this.pendingMessages.get(this.messageId - 1);
    if (pendingMessage) {
      this.pendingMessages.delete(this.messageId - 1);
      pendingMessage.resolve(response);
    }
  }

  async processAudio(chunk: AudioChunk): Promise<WorkerResponse> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    return this.sendMessage({
      type: 'process',
      chunk: {
        data: chunk.data,
        timestamp: chunk.timestamp,
        sampleRate: chunk.sampleRate
      }
    });
  }

  private sendMessage(message: WorkerMessage): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = this.messageId++;
      this.pendingMessages.set(id, { resolve, reject });

      // Transfer audio data efficiently
      const transferable: Transferable[] = [];
      if (message.chunk?.data) {
        transferable.push(message.chunk.data.buffer);
      }

      this.worker.postMessage(message, transferable);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker message timeout'));
        }
      }, 5000);
    });
  }

  private rejectAllPendingMessages(error: Error): void {
    for (const { reject } of this.pendingMessages.values()) {
      reject(error);
    }
    this.pendingMessages.clear();
  }

  async reset(): Promise<void> {
    if (!this.isInitialized || !this.worker) return;
    await this.sendMessage({ type: 'reset' });
  }

  async destroy(): Promise<void> {
    if (this.worker) {
      await this.sendMessage({ type: 'destroy' });
      this.worker.terminate();
      this.worker = null;
    }

    this.isInitialized = false;
    this.rejectAllPendingMessages(new Error('Worker destroyed'));
  }
}