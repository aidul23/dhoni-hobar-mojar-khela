import { BOARD } from '../data/board';
import { ALL_CARDS } from '../data/cards';
import { PROPERTIES } from '../data/properties';
import type { Card, DeckType, GameState } from '../types/game';
import { bankPay } from './bank';
import { chargePlayer } from './bankruptcy';
import type { Rng } from './dice';
import { sendToJail } from './jail';
import { advanceTo, movePlayerBy, nextSpaceWhere } from './movement';
import { activePlayers, addLog, currentPlayer } from './state';

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getCard(id: string): Card {
  const card = ALL_CARDS[id];
  if (!card) throw new Error(`Unknown card ${id}`);
  return card;
}

/** Takes the top card and puts it at the bottom of the deck. */
export function drawCard(s: GameState, deck: DeckType): Card {
  const key = deck === 'chance' ? 'chanceDeck' : 'fortuneDeck';
  const [top, ...rest] = s[key];
  s[key] = [...rest, top];
  return getCard(top);
}

const isTransport = (index: number) => {
  const id = BOARD[index].propertyId;
  return !!id && PROPERTIES[id].kind === 'transport';
};

/**
 * Applies a card's effect to the current player.
 * Returns 'land' when the player moved and the new space must be resolved.
 */
export function applyCardEffect(s: GameState, card: Card): 'land' | 'done' {
  const player = currentPlayer(s);
  const e = card.effect;

  switch (e.type) {
    case 'gain':
      player.cash += e.amount;
      bankPay(s, e.amount);
      addLog(s, 'cardGain', { player: player.name, amount: e.amount });
      return 'done';

    case 'pay':
      if (chargePlayer(s, player, e.amount, null)) addLog(s, 'cardPay', { player: player.name, amount: e.amount });
      return 'done';

    case 'move':
      movePlayerBy(s, player, e.steps);
      return 'land';

    case 'advanceTo':
      advanceTo(s, player, e.space);
      return 'land';

    case 'nearestTransport':
      advanceTo(s, player, nextSpaceWhere(player.position, isTransport));
      return 'land';

    case 'goToJail':
      sendToJail(s, player);
      return 'done';

    case 'jailFreeCard':
      player.getOutOfJailCards += 1;
      addLog(s, 'gotJailCard', { player: player.name });
      return 'done';

    case 'collectFromEach':
      for (const other of activePlayers(s)) {
        if (other.id === player.id) continue;
        if (chargePlayer(s, other, e.amount, player.id)) {
          addLog(s, 'paidTo', { payer: other.name, payee: player.name, amount: e.amount, payerId: other.id, payeeId: player.id });
        }
      }
      return 'done';

    case 'payEach':
      for (const other of activePlayers(s)) {
        if (other.id === player.id) continue;
        if (chargePlayer(s, player, e.amount, other.id)) {
          addLog(s, 'paidTo', { payer: player.name, payee: other.name, amount: e.amount, payerId: player.id, payeeId: other.id });
        }
      }
      return 'done';

    case 'repairs': {
      let total = 0;
      for (const id of player.properties) {
        const ps = s.properties[id];
        total += ps.hotel ? e.perHotel : ps.houses * e.perHouse;
      }
      if (chargePlayer(s, player, total, null)) addLog(s, 'cardPay', { player: player.name, amount: total });
      return 'done';
    }
  }
}
