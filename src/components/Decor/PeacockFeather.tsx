/** A peacock feather "eye", a classic rickshaw-art motif. Points up; flip with -scale-x-100. */
export function PeacockFeather({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 64" className={className} aria-hidden>
      {/* stem with fine barbs */}
      <path d="M20 62 C19 50 21 40 20 30" stroke="#7c2d12" strokeWidth="2" fill="none" strokeLinecap="round" />
      {[34, 40, 46, 52].map((y) => (
        <g key={y} stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round">
          <path d={`M20 ${y} L11 ${y - 6}`} />
          <path d={`M20 ${y} L29 ${y - 6}`} />
        </g>
      ))}
      {/* the eye: green, gold, teal and navy rings */}
      <ellipse cx="20" cy="20" rx="15" ry="18" fill="#16a34a" stroke="#fff" strokeWidth="1.5" />
      <ellipse cx="20" cy="21" rx="11" ry="13" fill="#facc15" />
      <ellipse cx="20" cy="22" rx="7.5" ry="9" fill="#0d9488" />
      <ellipse cx="20" cy="23" rx="4.2" ry="5" fill="#1e3a8a" />
      <ellipse cx="18.6" cy="21" rx="1.3" ry="1.6" fill="#fff" opacity="0.8" />
    </svg>
  );
}
