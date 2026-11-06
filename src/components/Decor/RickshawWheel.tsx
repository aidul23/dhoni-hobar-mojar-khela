/** A spoked rickshaw wheel with a painted, multicolour rim. */
export function RickshawWheel({ className = '' }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  const rim = ['#e11d48', '#facc15', '#16a34a', '#2563eb'];
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* painted rim made of coloured arcs */}
      {Array.from({ length: 12 }, (_, i) => {
        const a1 = (i * Math.PI) / 6;
        const a2 = ((i + 1) * Math.PI) / 6;
        const p = (a: number) => `${24 + Math.cos(a) * 21} ${24 + Math.sin(a) * 21}`;
        return <path key={i} d={`M ${p(a1)} A 21 21 0 0 1 ${p(a2)}`} stroke={rim[i % 4]} strokeWidth="5" fill="none" />;
      })}
      <circle cx="24" cy="24" r="23" fill="none" stroke="#7c2d12" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18.3" fill="none" stroke="#7c2d12" strokeWidth="1" />
      {spokes.map((a, i) => (
        <line key={i} x1="24" y1="24" x2={24 + Math.cos(a) * 18} y2={24 + Math.sin(a) * 18} stroke="#e5e7eb" strokeWidth="1.3" />
      ))}
      <circle cx="24" cy="24" r="5" fill="#facc15" stroke="#7c2d12" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="1.8" fill="#be123c" />
    </svg>
  );
}
