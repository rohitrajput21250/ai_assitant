import type { AssistantPhase } from '../../types/assistant';
import { cn } from '../../lib/classNames';

const phaseCopy: Record<AssistantPhase, string> = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
  responding: 'Responding',
  error: 'Error'
};

const phaseClass: Record<AssistantPhase, string> = {
  idle: 'border-cyanGlow/25 bg-cyanGlow/10 text-cyanGlow',
  listening: 'border-plasmaGreen/30 bg-plasmaGreen/10 text-plasmaGreen',
  processing: 'border-violetGlow/30 bg-violetGlow/10 text-violetGlow',
  responding: 'border-signalPink/30 bg-signalPink/10 text-signalPink',
  error: 'border-red-400/35 bg-red-500/10 text-red-200'
};

export function StatusPill({ phase }: { phase: AssistantPhase }) {
  return (
    <div
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.16em]',
        phaseClass[phase]
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-55" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {phaseCopy[phase]}
    </div>
  );
}
