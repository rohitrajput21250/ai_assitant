import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/classNames';

export function GlassPanel({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn('glass-panel rounded-lg p-4 shadow-glass', className)}>
      {children}
    </section>
  );
}
