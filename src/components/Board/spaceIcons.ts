import {
  Bus, CircleHelp, Droplet, Flag, Gift, Lock, Plane, Receipt, Ship, Siren, TrainFront, Trees, Zap,
  type LucideIcon,
} from 'lucide-react';

/** Icon and colour for each special space, keyed by space type or property id. */
export const SPACE_ICONS: Record<string, { Icon: LucideIcon; color: string }> = {
  start: { Icon: Flag, color: '#16a34a' },
  jail: { Icon: Lock, color: '#57534e' },
  rest: { Icon: Trees, color: '#15803d' },
  goToJail: { Icon: Siren, color: '#dc2626' },
  chance: { Icon: CircleHelp, color: '#ea580c' },
  fortune: { Icon: Gift, color: '#0284c7' },
  tax: { Icon: Receipt, color: '#be123c' },
  rail: { Icon: TrainFront, color: '#374151' },
  launch: { Icon: Ship, color: '#1d4ed8' },
  bus: { Icon: Bus, color: '#b45309' },
  airport: { Icon: Plane, color: '#0f766e' },
  power: { Icon: Zap, color: '#ca8a04' },
  water: { Icon: Droplet, color: '#0284c7' },
};
