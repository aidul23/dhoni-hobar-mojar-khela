const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Pip slots are a 3×3 grid (0..8), placed with absolute percentages. */
const slotStyle = (slot: number) => ({
  left: `${14 + (slot % 3) * 27}%`,
  top: `${14 + Math.floor(slot / 3) * 27}%`,
});

function Die({ value, rolling, size }: { value: number; rolling: boolean; size: string }) {
  return (
    <div
      className={`relative rounded-[18%] bg-white shadow-md ring-1 ring-stone-300 ${rolling ? 'animate-dice' : ''}`}
      style={{ width: size, height: size }}
      aria-label={String(value)}
    >
      {(PIPS[value] ?? []).map((slot) => (
        <span key={slot} className="absolute h-[18%] w-[18%] rounded-full bg-rose-700" style={slotStyle(slot)} />
      ))}
    </div>
  );
}

export function Dice({ faces, rolling, size = '3rem' }: {
  faces: [number, number];
  rolling: boolean;
  size?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Die value={faces[0]} rolling={rolling} size={size} />
      <Die value={faces[1]} rolling={rolling} size={size} />
    </div>
  );
}
