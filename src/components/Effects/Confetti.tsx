import { useMemo } from 'react';

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#a855f7'];

/** Lightweight CSS confetti for the winner screen. */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 2.8 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [pieces],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute -top-4 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
