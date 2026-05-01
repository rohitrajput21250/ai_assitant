import { Loader2, Mic, MicOff, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AssistantPhase } from '../../types/assistant';
import { cn } from '../../lib/classNames';

interface MicButtonProps {
  disabled?: boolean;
  isSupported: boolean;
  onClick: () => void;
  phase: AssistantPhase;
}

function iconForPhase(phase: AssistantPhase, isSupported: boolean) {
  if (!isSupported) return <MicOff className="h-8 w-8" aria-hidden />;
  if (phase === 'processing') return <Loader2 className="h-8 w-8 animate-spin" aria-hidden />;
  if (phase === 'listening') return <Square className="h-7 w-7 fill-current" aria-hidden />;
  return <Mic className="h-8 w-8" aria-hidden />;
}

export function MicButton({ disabled, isSupported, onClick, phase }: MicButtonProps) {
  const isActive = phase === 'listening' || phase === 'processing' || phase === 'responding';
  const label = phase === 'listening' ? 'Stop listening' : 'Start listening';

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <motion.div
        className={cn(
          'absolute h-24 w-24 rounded-full border',
          isActive ? 'border-cyanGlow/50' : 'border-white/10'
        )}
        animate={{
          opacity: isActive ? [0.3, 0.76, 0.3] : 0.28,
          scale: isActive ? [0.92, 1.18, 0.92] : 1
        }}
        transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.button
        aria-label={label}
        title={label}
        className={cn(
          'neon-border relative flex h-20 w-20 items-center justify-center rounded-full border text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyanGlow/70',
          'bg-[radial-gradient(circle_at_50%_35%,rgba(86,221,255,0.34),rgba(157,99,255,0.18)_46%,rgba(5,7,19,0.84)_72%)]',
          disabled || !isSupported
            ? 'cursor-not-allowed border-white/10 opacity-50'
            : 'border-cyanGlow/35 hover:border-cyanGlow/70 hover:text-cyanGlow'
        )}
        disabled={disabled || !isSupported}
        onClick={onClick}
        whileHover={disabled ? undefined : { scale: 1.045 }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
      >
        {iconForPhase(phase, isSupported)}
      </motion.button>
    </div>
  );
}
