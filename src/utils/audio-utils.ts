export function normalizeAudio(audioData: Float32Array): Float32Array {
  const normalized = new Float32Array(audioData.length);
  let max = 0;

  for (let i = 0; i < audioData.length; i++) {
    max = Math.max(max, Math.abs(audioData[i]));
  }

  if (max === 0) return normalized;

  for (let i = 0; i < audioData.length; i++) {
    normalized[i] = audioData[i] / max;
  }

  return normalized;
}

export function resampleAudio(
  inputData: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return inputData;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(inputData.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const index = i * ratio;
    const leftIndex = Math.floor(index);
    const rightIndex = Math.ceil(index);
    const fraction = index - leftIndex;

    if (rightIndex >= inputData.length) {
      output[i] = inputData[leftIndex];
    } else {
      output[i] = inputData[leftIndex] * (1 - fraction) + inputData[rightIndex] * fraction;
    }
  }

  return output;
}

export function createAudioBuffer(
  audioData: Float32Array,
  sampleRate: number,
  timestamp: number = Date.now()
) {
  return {
    data: audioData,
    sampleRate,
    timestamp
  };
}