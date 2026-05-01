import { ArrowUpRight, Cpu, ExternalLink, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AssistantAction, AssistantPhase, CommandResponse, ConversationTurn } from '../../types/assistant';
import { GlassPanel } from './GlassPanel';
import { SignalMeter } from './SignalMeter';
import { StatusPill } from './StatusPill';

interface AssistantPanelProps {
  actionHandler: (action: AssistantAction) => void;
  audioLevel: number;
  error: string;
  history: ConversationTurn[];
  interimTranscript: string;
  lastResponse: CommandResponse | null;
  phase: AssistantPhase;
  transcript: string;
}

function confidenceLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function AssistantPanel({
  actionHandler,
  audioLevel,
  error,
  history,
  interimTranscript,
  lastResponse,
  phase,
  transcript
}: AssistantPanelProps) {
  const visibleTranscript = transcript || interimTranscript;

  return (
    <div className="pointer-events-none flex h-full w-full flex-col justify-between gap-4 p-4 pb-32 md:p-6 md:pb-32 lg:pb-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyanGlow/75">
            3D AI Voice Assistant
          </p>
          <h1 className="mt-2 max-w-[14ch] text-3xl font-semibold leading-none text-white sm:text-4xl md:text-5xl">
            Neural Orb
          </h1>
        </div>
        <StatusPill phase={phase} />
      </header>

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(280px,420px)] lg:items-end lg:justify-between">
        <GlassPanel className="pointer-events-auto order-2 max-h-[46vh] overflow-hidden lg:order-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Transcript</p>
              <p className="mt-1 text-sm text-cyanGlow/80">
                {lastResponse ? lastResponse.intentLabel : 'Awaiting signal'}
              </p>
            </div>
            <SignalMeter level={audioLevel} />
          </div>

          <div className="scrollbar-thin max-h-[19vh] overflow-y-auto rounded-md border border-white/10 bg-black/20 p-3">
            <p className="min-h-14 text-sm leading-6 text-white/[0.86]">
              {visibleTranscript || '...'}
            </p>
          </div>

          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
              <Cpu className="h-4 w-4" aria-hidden />
              Response
            </div>
            <p className="min-h-16 text-sm leading-6 text-white/[0.82]">
              {error || lastResponse?.response || '...'}
            </p>

            {lastResponse?.action ? (
              <button
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-cyanGlow/30 bg-cyanGlow/10 px-3 text-sm font-semibold text-cyanGlow transition hover:border-cyanGlow/70 hover:bg-cyanGlow/15"
                onClick={() => actionHandler(lastResponse.action!)}
                type="button"
              >
                {lastResponse.action.type === 'openUrl' ? (
                  <ExternalLink className="h-4 w-4" aria-hidden />
                ) : (
                  <RotateCcw className="h-4 w-4" aria-hidden />
                )}
                {lastResponse.action.label}
              </button>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel className="pointer-events-auto order-1 lg:order-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Intent</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {lastResponse?.intentLabel || 'Standby'}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Score</p>
              <p className="font-mono text-lg text-plasmaGreen">
                {lastResponse ? confidenceLabel(lastResponse.confidence) : '--'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(lastResponse?.matches || []).slice(0, 4).map((match) => (
              <div key={match.intent} className="grid grid-cols-[1fr_52px] items-center gap-3">
                <span className="truncate text-xs uppercase tracking-[0.14em] text-white/60">
                  {match.intent.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-xs text-cyanGlow">{confidenceLabel(match.score)}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-cyanGlow via-plasmaGreen to-signalPink"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, Math.round(match.score * 100))}%` }}
                  />
                </span>
              </div>
            ))}
          </div>

          {history.length ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Recent</p>
              <div className="mt-3 space-y-2">
                {history.slice(0, 3).map((turn) => (
                  <div key={turn.id} className="rounded-md border border-white/10 bg-white/[0.035] p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-white/70">{turn.transcript}</p>
                      {turn.action?.type === 'openUrl' ? <ArrowUpRight className="h-3.5 w-3.5 text-cyanGlow" aria-hidden /> : null}
                    </div>
                  <p className="mt-1 truncate text-xs text-white/40">{turn.intent}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </GlassPanel>
      </div>
    </div>
  );
}
