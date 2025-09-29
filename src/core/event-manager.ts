import type { VadEventType, VadResult, AudioChunk } from '../types';

export class EventManager extends EventTarget {
  emitSpeechStart(result: VadResult): void {
    this.dispatchEvent(new CustomEvent('speech_start', { detail: result }));
  }

  emitSpeechStop(result: VadResult): void {
    this.dispatchEvent(new CustomEvent('speech_stop', { detail: result }));
  }

  emitSpeechData(chunk: AudioChunk): void {
    this.dispatchEvent(new CustomEvent('speech_data', { detail: chunk }));
  }

  addVadEventListener<K extends VadEventType>(
    type: K,
    listener: (event: CustomEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }

  removeVadEventListener<K extends VadEventType>(
    type: K,
    listener: (event: CustomEvent) => void,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener as EventListener, options);
  }
}