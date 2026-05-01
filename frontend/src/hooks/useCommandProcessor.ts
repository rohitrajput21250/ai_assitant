import { useCallback, useState } from 'react';
import type { CommandResponse, ConversationTurn } from '../types/assistant';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function endpoint(path: string) {
  return apiBase ? `${apiBase}${path}` : path;
}

function makeTurn(response: CommandResponse): ConversationTurn {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    transcript: response.transcript,
    response: response.response,
    intent: response.intentLabel,
    confidence: response.confidence,
    action: response.action
  };
}

export function useCommandProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState('');

  const clear = useCallback(() => {
    setLastResponse(null);
    setHistory([]);
    setError('');
  }, []);

  const processText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(endpoint('/api/command'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: trimmed,
          locale: navigator.language || 'en-US'
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Command processing failed.');
      }

      const commandResponse = payload as CommandResponse;
      setLastResponse(commandResponse);
      setHistory((current) => [makeTurn(commandResponse), ...current].slice(0, 5));
      return commandResponse;
    } catch (processError) {
      const message =
        processError instanceof Error
          ? processError.message
          : 'Command processing failed.';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    clear,
    error,
    history,
    isProcessing,
    lastResponse,
    processText
  };
}
