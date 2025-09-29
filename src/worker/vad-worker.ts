import type { WorkerResponse, VadConfig } from '../types';
import { SileroProcessor } from './silero-processor';
import { isWorkerMessage } from '../utils/type-guards';

class VadWorker {
  private processor: SileroProcessor | null = null;

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    const message = event.data;

    if (!isWorkerMessage(message)) {
      this.sendError('Invalid message format');
      return;
    }

    try {
      switch (message.type) {
        case 'init':
          await this.initialize(message.config!);
          break;
        case 'process':
          await this.processAudio(message.chunk!);
          break;
        case 'reset':
          this.reset();
          break;
        case 'destroy':
          this.destroy();
          break;
        default:
          this.sendError(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.sendError(`Worker error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async initialize(config: VadConfig): Promise<void> {
    if (this.processor) {
      this.processor.destroy();
    }

    this.processor = new SileroProcessor(config);
    await this.processor.initialize();

    this.sendResponse({ type: 'ready' });
  }

  private async processAudio(chunk: any): Promise<void> {
    if (!this.processor) {
      this.sendError('Processor not initialized');
      return;
    }

    const result = await this.processor.processAudio(chunk);
    this.sendResponse({ type: 'result', data: result });
  }

  private reset(): void {
    if (this.processor) {
      this.processor.reset();
    }
    this.sendResponse({ type: 'ready' });
  }

  private destroy(): void {
    if (this.processor) {
      this.processor.destroy();
      this.processor = null;
    }
    this.sendResponse({ type: 'ready' });
  }

  private sendResponse(response: WorkerResponse): void {
    self.postMessage(response);
  }

  private sendError(error: string): void {
    self.postMessage({ type: 'error', error });
  }
}

// Initialize worker
new VadWorker();