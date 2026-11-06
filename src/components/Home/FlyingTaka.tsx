import { useMemo } from 'react';

/** Note colours loosely inspired by Bangladeshi taka notes. */
const NOTE_COLORS = [
  { body: '#86efac', edge: '#15803d' }, // green
  { body: '#f9a8d4', edge: '#be185d' }, // pink
  { body: '#93c5fd', edge: '#1d4ed8' }, // blue
  { body: '#c4b5fd', edge: '#6d28d9' }, // purple
];

function Note({ body, edge }: { body: string; edge: string }) {
  return (
    <svg viewBox="0 0 64 32" className="h-full w-full drop-shadow" aria-hidden>
      <rect x="1" y="1" width="62" height="30" rx="3" fill={body} stroke={edge} strokeWidth="2" />
      <rect x="5" y="5" width="54" height="22" rx="2" fill="none" stroke={edge} strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="32" cy="16" r="8" fill="#fff" fillOpacity="0.7" stroke={edge} strokeWidth="1.2" />
      <text x="32" y="20.5" textAnchor="middle" fontSize="12" fontWeight="700" fill={edge}>৳</text>
    </svg>
  );
}

function Coin() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow" aria-hidden>
      <circle cx="16" cy="16" r="14.5" fill="#facc15" stroke="#a16207" strokeWidth="2" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#a16207" strokeWidth="1" strokeDasharray="1.5 1.5" />
      <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill="#a16207">৳</text>
    </svg>
  );
}

/**
 * টাকা উড়ানো: taka notes and coins drifting up the page while turning and flipping.
 * Decorative only: behind the content, never clickable, and hidden for reduced motion.
 */
export function FlyingTaka({ count = 16 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const isCoin = i % 3 === 2;
        const duration = 14 + Math.random() * 12; // seconds to cross the screen
        return {
          isCoin,
          color: NOTE_COLORS[i % NOTE_COLORS.length],
          left: (i / count) * 100 + Math.random() * (100 / count),
          width: isCoin ? 22 + Math.random() * 10 : 46 + Math.random() * 22,
          duration,
          // Negative delay: the money is already mid-flight when the page opens.
          delay: -Math.random() * duration,
          flutter: 2.2 + Math.random() * 2,
          opacity: 0.35 + Math.random() * 0.25,
        };
      }),
    [count],
  );

  return (
    <div className="taka-layer pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {items.map((it, i) => (
        <div
          key={i}
          className="taka-rise absolute top-full"
          style={{
            left: `${it.left}%`,
            width: it.width,
            height: it.isCoin ? it.width : it.width / 2,
            opacity: it.opacity,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          <div className="taka-flutter h-full w-full" style={{ animationDuration: `${it.flutter}s` }}>
            {it.isCoin ? <Coin /> : <Note {...it.color} />}
          </div>
        </div>
      ))}
    </div>
  );
}
