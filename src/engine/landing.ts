import { BOARD } from '../data/board';
import type { GameState, Player } from '../types/game';
import { chargePlayer } from './bankruptcy';
import { drawCard } from './cards';
import { sendToJail } from './jail';
import { calculateRent } from './rent';
import { addLog, currentPlayer, getPlayer } from './state';
import { addStat } from './stats';
import { finishAction } from './turn';

/** Resolves the space the current player is standing on. */
export function landOn(s: GameState): void {
  const player = currentPlayer(s);
  const space = BOARD[player.position];

  switch (space.type) {
    case 'property':
      landOnProperty(s, player, space.propertyId!);
      return;

    case 'tax': {
      const tax = space.taxAmount ?? 0;
      if (chargePlayer(s, player, tax, null, 'tax')) {
        addLog(s, 'paidTax', { player: player.name, amount: tax, space: space.index }, true);
      }
      finishAction(s);
      return;
    }

    case 'chance':
    case 'fortune': {
      const card = drawCard(s, space.type);
      s.pendingCard = { deck: space.type, cardId: card.id };
      s.phase = 'card';
      addStat(s, player.id, 'cardsDrawn');
      addLog(s, 'drewCard', { player: player.name, deck: space.type, card: card.id });
      return;
    }

    case 'goToJail':
      sendToJail(s, player);
      finishAction(s);
      return;

    default:
      finishAction(s);
  }
}

function landOnProperty(s: GameState, player: Player, propertyId: string): void {
  const ps = s.properties[propertyId];
  const spaceIndex = player.position;

  if (ps.ownerId === null) {
    s.pendingPurchase = propertyId;
    s.phase = 'buy';
    return;
  }

  if (ps.ownerId !== player.id) {
    const owner = getPlayer(s, ps.ownerId);
    if (ps.mortgaged) {
      addLog(s, 'mortgagedNoRent', { player: player.name, space: spaceIndex });
    } else {
      const diceTotal = s.dice ? s.dice[0] + s.dice[1] : 0;
      const rent = calculateRent(s, propertyId, diceTotal);
      if (chargePlayer(s, player, rent, owner.id, 'rent')) {
        addLog(s, 'paidRent', {
          payer: player.name, owner: owner.name, amount: rent, space: spaceIndex,
          payerId: player.id, payeeId: owner.id,
        }, true);
      }
    }
  }
  finishAction(s);
}
