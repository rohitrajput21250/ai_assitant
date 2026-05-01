export type AssistantPhase = 'idle' | 'listening' | 'processing' | 'responding' | 'error';

export type AssistantAction =
  | {
      type: 'openUrl';
      label: string;
      url: string;
    }
  | {
      type: 'resetConversation';
      label: string;
    };

export interface CommandMatch {
  intent: string;
  score: number;
}

export interface CommandResponse {
  ok: boolean;
  transcript: string;
  intent: string;
  intentLabel: string;
  confidence: number;
  response: string;
  action: AssistantAction | null;
  tokens: string[];
  matches: CommandMatch[];
  engine: {
    name: string;
    executable: string;
    normalized: string;
  };
}

export interface ConversationTurn {
  id: string;
  transcript: string;
  response: string;
  intent: string;
  confidence: number;
  action: AssistantAction | null;
}
