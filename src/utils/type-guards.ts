import type { WorkerMessage, WorkerResponse, VadResult, AudioChunk } from '../types';

export function isWorkerMessage(data: any): data is WorkerMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.type === 'string' &&
    ['init', 'process', 'reset', 'destroy'].includes(data.type)
  );
}

export function isWorkerResponse(data: any): data is WorkerResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.type === 'string' &&
    ['ready', 'result', 'error'].includes(data.type)
  );
}

export function isVadResult(data: any): data is VadResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.probability === 'number' &&
    typeof data.isSpeech === 'boolean' &&
    typeof data.timestamp === 'number'
  );
}

export function isAudioChunk(data: any): data is AudioChunk {
  return (
    typeof data === 'object' &&
    data !== null &&
    data.data instanceof Float32Array &&
    typeof data.timestamp === 'number' &&
    typeof data.sampleRate === 'number'
  );
}

export function isMediaStream(stream: any): stream is MediaStream {
  return stream instanceof MediaStream;
}