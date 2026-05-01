export function SignalMeter({ level }: { level: number }) {
  const bars = Array.from({ length: 14 }, (_, index) => index);

  return (
    <div className="flex h-10 items-end gap-1" aria-label="Microphone level meter">
      {bars.map((bar) => {
        const threshold = (bar + 1) / bars.length;
        const active = level >= threshold * 0.72;
        return (
          <span
            key={bar}
            className="w-1.5 rounded-full bg-cyanGlow/20 transition-all duration-100"
            style={{
              height: `${18 + Math.sin(bar * 0.7) * 7 + bar * 1.15}px`,
              opacity: active ? 0.92 : 0.24,
              background: active
                ? `linear-gradient(to top, #56ddff, ${bar > 9 ? '#ff4fd8' : '#8fffca'})`
                : 'rgba(255,255,255,0.16)'
            }}
          />
        );
      })}
    </div>
  );
}
