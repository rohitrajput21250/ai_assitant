import { useEffect, useRef, useState } from 'react';

export function useMicrophoneLevel(enabled: boolean) {
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setLevel((current) => current * 0.35);
      return undefined;
    }

    let cancelled = false;
    let audioContext: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let lastCommit = 0;

    async function startMeter() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);

        const tick = (time: number) => {
          analyser.getByteTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const value = (data[i] - 128) / 128;
            sum += value * value;
          }

          const rms = Math.sqrt(sum / data.length);
          const boosted = Math.min(1, rms * 7.8);

          if (time - lastCommit > 32) {
            lastCommit = time;
            setLevel((current) => current * 0.64 + boosted * 0.36);
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (meterError) {
        setError(
          meterError instanceof Error
            ? meterError.message
            : 'Unable to access the microphone level meter.'
        );
      }
    }

    startMeter();

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close();
    };
  }, [enabled]);

  return { level, error };
}
