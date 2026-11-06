/** A five-petal flower, the most common rickshaw-art motif. */
export function Flower({ className = '', petal = '#e11d48', center = '#facc15' }: {
  className?: string;
  petal?: string;
  center?: string;
}) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    return { cx: 20 + Math.cos(a) * 8, cy: 20 + Math.sin(a) * 8 };
  });
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {petals.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="7" fill={petal} stroke="#fff" strokeWidth="1.5" />
      ))}
      <circle cx="20" cy="20" r="6" fill={center} stroke="#7c2d12" strokeWidth="1.5" />
    </svg>
  );
}
