# Browser VAD

A client-side Voice Activity Detection (VAD) library using Silero VAD and ONNX Runtime Web. Runs entirely in the browser with no server dependencies.

## Features

- 🎤 **Real-time VAD**: Detect speech activity in real-time audio streams
- 🧠 **Silero VAD**: Uses the enterprise-grade Silero VAD model via ONNX Runtime Web
- 🔧 **Web Worker**: Non-blocking processing in a separate thread
- 📡 **EventTarget API**: Standard web API for event handling
- ⚙️ **Minimal Configuration**: Works out-of-the-box with sensible defaults
- 🎯 **TypeScript**: Full type safety and IntelliSense support
- 📱 **Browser Native**: No server required, runs entirely client-side

## Installation

```bash
npm install browser-vad
```

## Quick Start

```javascript
import BrowserVAD from 'browser-vad';

// Create VAD instance with default configuration
const vad = await BrowserVAD.create();

// Add event listeners
vad.addEventListener('speech_start', (event) => {
  console.log('Speech started!', event.detail);
});

vad.addEventListener('speech_stop', (event) => {
  console.log('Speech stopped!', event.detail);
});

vad.addEventListener('speech_data', (event) => {
  console.log('Speech data chunk', event.detail);
});

// Get microphone access
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true
});

// Attach audio stream to VAD
await vad.attachAudioStream(stream);

// Stop processing
vad.detachAudioStream();
```

## Configuration

```javascript
const vad = await BrowserVAD.create({
  modelUrl: '/models/silero_vad.onnx',     // Path to Silero VAD model
  sampleRate: 16000,                       // Audio sample rate (Hz)
  frameSize: 512,                          // Frame size for processing
  threshold: 0.5,                          // Speech detection threshold (0-1)
  minSilenceDuration: 250,                 // Min silence to end speech (ms)
  minSpeechDuration: 250,                  // Min duration for valid speech (ms)
  maxSpeechDuration: 30000                 // Max continuous speech duration (ms)
});
```

## Events

### `speech_start`
Fired when speech activity begins.

```javascript
vad.addEventListener('speech_start', (event) => {
  const { probability, isSpeech, timestamp } = event.detail;
});
```

### `speech_stop`
Fired when speech activity ends.

```javascript
vad.addEventListener('speech_stop', (event) => {
  const { probability, isSpeech, timestamp } = event.detail;
});
```

### `speech_data`
Fired continuously during speech with audio chunks.

```javascript
vad.addEventListener('speech_data', (event) => {
  const { data, timestamp, sampleRate } = event.detail;
  // data is Float32Array containing audio samples
});
```

## API Reference

### `BrowserVAD.create(config?)`
Creates and initializes a new VAD instance.

### `attachAudioStream(stream: MediaStream)`
Attaches a MediaStream (from microphone) to the VAD for processing.

### `detachAudioStream()`
Stops processing the attached audio stream.

### `reset()`
Resets the VAD internal state.

### `destroy()`
Cleans up resources and destroys the VAD instance.

## Development

```bash
# Install dependencies
npm install

# Start development server with demo
npm run dev

# Build library
npm run build

# Run TypeScript checking
npm run typecheck
```

## Demo

The project includes a comprehensive demo at `public/index.html` that shows:

- Microphone access and audio stream handling
- Real-time speech detection visualization
- Event logging and probability display
- Configurable VAD parameters

Visit the demo at `http://localhost:5174` after running `npm run dev`.

## Browser Support

- Modern browsers with Web Workers support
- WebAssembly (WASM) support required
- Microphone access via getUserMedia API

## License

MIT

## Acknowledgments

- [Silero VAD](https://github.com/snakers4/silero-vad) for the VAD model
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript.html) for browser ML inference