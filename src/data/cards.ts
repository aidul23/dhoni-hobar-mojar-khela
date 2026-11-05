import type { Card } from '../types/game';
import { CHANCE_CARDS } from './chanceCards';
import { FORTUNE_CARDS } from './fortuneCards';

export const ALL_CARDS: Record<string, Card> = Object.fromEntries(
  [...CHANCE_CARDS, ...FORTUNE_CARDS].map((card) => [card.id, card]),
);

export { CHANCE_CARDS, FORTUNE_CARDS };
