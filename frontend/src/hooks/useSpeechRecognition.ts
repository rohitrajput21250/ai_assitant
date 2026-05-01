import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechStatus = 'idle' | 'listening' | 'error';

export function useSpeechRecognition(language = 'en-US') {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  const SpeechRecognitionCtor = useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }, []);

  const isSupported = Boolean(SpeechRecognitionCtor);

  useEffect(() => {
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not available in this browser.');
      return undefined;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setError('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let committed = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          committed += transcript;
        } else {
          interim += transcript;
        }
      }

      if (committed.trim()) {
        setFinalTranscript((current) => `${current} ${committed}`.trim());
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      shouldListenRef.current = false;
      setStatus('error');
      setError(event.message || `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (_error) {
          setStatus('idle');
        }
        return;
      }
      setStatus('idle');
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionCtor, language]);

  const resetTranscript = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setStatus('error');
      setError('Speech recognition is not available in this browser.');
      return;
    }

    resetTranscript();
    shouldListenRef.current = true;
    setError('');

    try {
      recognitionRef.current.start();
    } catch (_error) {
      setStatus('listening');
    }
  }, [isSupported, resetTranscript]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (!recognitionRef.current) {
      setStatus('idle');
      return;
    }
    recognitionRef.current.stop();
  }, []);

  const transcript = useMemo(
    () => [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim(),
    [finalTranscript, interimTranscript]
  );

  return {
    error,
    finalTranscript,
    interimTranscript,
    isListening: status === 'listening',
    isSupported,
    resetTranscript,
    startListening,
    status,
    stopListening,
    transcript
  };
}
