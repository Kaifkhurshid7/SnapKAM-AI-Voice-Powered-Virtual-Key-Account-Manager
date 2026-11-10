/** Handle for a running microphone level meter. */
export interface AudioLevelMeter {
  stop: () => void;
}

/** Frames between level updates: ~30 updates per second keeps the visualiser smooth and cheap. */
const FRAME_SKIP = 2;

/**
 * Open the microphone and report its loudness as a value between 0 and 1.
 * This is a visual aid only; speech recognition runs independently.
 * Rejects if microphone access is unavailable, which callers may safely ignore.
 */
export async function startAudioLevelMeter(
  onLevel: (level: number) => void,
): Promise<AudioLevelMeter> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });

  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  context.createMediaStreamSource(stream).connect(analyser);

  const samples = new Uint8Array(analyser.fftSize);
  let frame = 0;
  let raf = 0;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    frame += 1;
    if (frame % FRAME_SKIP !== 0) return;

    analyser.getByteTimeDomainData(samples);
    let sumSquares = 0;
    for (const sample of samples) {
      const centred = (sample - 128) / 128;
      sumSquares += centred * centred;
    }
    // Scale RMS so normal speech fills most of the range.
    onLevel(Math.min(1, Math.sqrt(sumSquares / samples.length) * 4));
  };
  tick();

  return {
    stop: () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    },
  };
}
