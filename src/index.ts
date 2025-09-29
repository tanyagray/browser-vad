import { VadEngine } from './core/vad-engine';
import type { VadConfig } from './types';

export class BrowserVAD extends VadEngine {
  constructor(config?: VadConfig) {
    super(config);
  }

  static async create(config?: VadConfig): Promise<BrowserVAD> {
    const vad = new BrowserVAD(config);
    await vad.initialize();
    return vad;
  }
}

// Export types for TypeScript users
export type {
  VadConfig,
  VadEventType,
  VadResult,
  AudioChunk,
  VadEventMap
} from './types';

// Export default for convenience
export default BrowserVAD;