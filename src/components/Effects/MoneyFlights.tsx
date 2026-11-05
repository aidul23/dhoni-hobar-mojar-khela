import { useLayoutEffect, useRef, useState } from 'react';
import { formatMoney } from '../../utils/currency';

export interface Flight {
  id: number;
  fromId: string;
  toId: string;
  amount: number;
}

const DURATION = 900;

function center(playerId: string) {
  const el = document.querySelector(`[data-player-card="${playerId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** One coin flying from the payer's card to the receiver's card. */
function FlyingCoin({ flight, onDone }: { flight: Flight; onDone: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    const from = center(flight.fromId);
    const to = center(flight.toId);
    const el = ref.current;
    if (!from || !to || !el) {
      setVisible(false);
      onDone(flight.id);
      return;
    }
    el.style.transform = `translate(${from.x}px, ${from.y}px) translate(-50%, -50%) scale(0.8)`;
    el.getBoundingClientRect(); // commit the start position before transitioning
    el.style.transition = `transform ${DURATION}ms cubic-bezier(.5,0,.3,1), opacity 200ms ease ${DURATION - 150}ms`;
    el.style.transform = `translate(${to.x}px, ${to.y}px) translate(-50%, -50%) scale(1.1)`;
    el.style.opacity = '0';
    const timer = setTimeout(() => onDone(flight.id), DURATION + 100);
    return () => clearTimeout(timer);
  }, [flight, onDone]);

  if (!visible) return null;
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-50 rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-stone-900 shadow-lg ring-2 ring-amber-200"
    >
      🪙 {formatMoney(flight.amount)}
    </div>
  );
}

export function MoneyFlights({ flights, onDone }: { flights: Flight[]; onDone: (id: number) => void }) {
  return (
    <>
      {flights.map((f) => <FlyingCoin key={f.id} flight={f} onDone={onDone} />)}
    </>
  );
}
