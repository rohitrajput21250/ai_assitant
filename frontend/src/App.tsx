import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssistantPanel } from './components/ui/AssistantPanel';
import { MicButton } from './components/ui/MicButton';
import { ExperienceCanvas } from './components/scene/ExperienceCanvas';
import { useCommandProcessor } from './hooks/useCommandProcessor';
import { useMicrophoneLevel } from './hooks/useMicrophoneLevel';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import type { AssistantAction, AssistantPhase, CommandResponse } from './types/assistant';

export default function App() {
  const {
    error: speechError,
    interimTranscript,
    isListening,
    isSupported,
    resetTranscript,
    startListening,
    status: speechStatus,
    stopListening,
    transcript
  } = useSpeechRecognition('en-US');
  const {
    clear,
    error: commandError,
    history,
    isProcessing,
    lastResponse,
    processText
  } = useCommandProcessor();
  const mic = useMicrophoneLevel(isListening);
  const [responsePulse, setResponsePulse] = useState(false);
  const processedTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const lastAutoActionRef = useRef('');

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  const phase = useMemo<AssistantPhase>(() => {
    if (speechStatus === 'error' || commandError) return 'error';
    if (isListening) return 'listening';
    if (isProcessing) return 'processing';
    if (responsePulse) return 'responding';
    return 'idle';
  }, [commandError, isListening, isProcessing, responsePulse, speechStatus]);

  const runAction = useCallback(
    (action: AssistantAction) => {
      if (action.type === 'openUrl') {
        window.open(action.url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (action.type === 'resetConversation') {
        clear();
        resetTranscript();
        processedTranscriptRef.current = '';
      }
    },
    [clear, resetTranscript]
  );

  const handleCommandResponse = useCallback(
    (response: CommandResponse | null) => {
      if (!response) return;

      setResponsePulse(true);
      window.setTimeout(() => setResponsePulse(false), 2800);

      if (response.action) {
        const actionKey = `${response.intent}-${response.action.label}-${response.action.type}`;
        if (lastAutoActionRef.current !== actionKey) {
          lastAutoActionRef.current = actionKey;
          runAction(response.action);
        }
      }
    },
    [runAction]
  );

  useEffect(() => {
    if (isListening || isProcessing) {
      return;
    }

    const text = latestTranscriptRef.current.trim();
    if (!text || text === processedTranscriptRef.current) {
      return;
    }

    processedTranscriptRef.current = text;
    void processText(text).then(handleCommandResponse);
  }, [handleCommandResponse, isListening, isProcessing, processText]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    processedTranscriptRef.current = '';
    lastAutoActionRef.current = '';
    startListening();
  }, [isListening, startListening, stopListening]);

  const combinedError = speechError || commandError || mic.error;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-void text-white">
      <div className="absolute inset-0">
        <ExperienceCanvas audioLevel={mic.level} phase={phase} />
      </div>

      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,7,19,0.72),rgba(5,7,19,0.04)_32%,rgba(5,7,19,0.6))]" />

      <div className="absolute inset-0 z-10">
        <AssistantPanel
          actionHandler={runAction}
          audioLevel={mic.level}
          error={combinedError}
          history={history}
          interimTranscript={interimTranscript}
          lastResponse={lastResponse}
          phase={phase}
          transcript={transcript}
        />
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:bottom-6">
        <MicButton
          disabled={isProcessing}
          isSupported={isSupported}
          onClick={handleMicClick}
          phase={phase}
        />
      </div>
    </main>
  );
}
