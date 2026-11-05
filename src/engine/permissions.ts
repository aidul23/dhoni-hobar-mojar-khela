import type { GameAction, GameState } from '../types/game';
import { actingPlayer, currentPlayer } from './state';

/**
 * Who may send an action in online play. The reducer still decides whether the
 * action is valid right now; this only answers "is it this player's call?".
 * FORFEIT is never allowed from a client; the server issues it.
 */
export function canPlayerAct(s: GameState, playerId: string, action: GameAction): boolean {
  const me = s.players.find((p) => p.id === playerId);
  if (!me || me.bankrupt || s.phase === 'gameOver') return false;

  switch (action.type) {
    case 'ROLL':
    case 'BUY':
    case 'DECLINE_BUY':
    case 'RESOLVE_CARD':
    case 'END_TURN':
    case 'PAY_JAIL_FINE':
    case 'USE_JAIL_CARD':
    case 'BUILD_HOUSE':
    case 'BUILD_HOTEL':
    case 'UNMORTGAGE':
      return currentPlayer(s).id === playerId;

    case 'SELL_BUILDING':
    case 'MORTGAGE':
    case 'PROPOSE_TRADE':
    case 'PAY_DEBT':
    case 'DECLARE_BANKRUPTCY':
      return actingPlayer(s).id === playerId;

    case 'ACCEPT_TRADE':
      return s.pendingTrade?.toId === playerId;

    case 'REJECT_TRADE':
      // The receiver declines, or the proposer withdraws.
      return s.pendingTrade?.toId === playerId || s.pendingTrade?.fromId === playerId;

    case 'FORFEIT':
      return false;
  }
}
