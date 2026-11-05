import { PLAYER_COLORS, TOKENS } from '../src/data/tokens';
import type { ClientMessage, RoomRules } from '../src/net/protocol';
import type { GameAction, PlayerSetup } from '../src/types/game';

/** Runtime checks for untrusted client messages. Returns null when invalid. */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = 64): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 40 && v.every((x) => isStr(x));

export const MAX_NAME = 16;

export function parsePlayer(v: unknown): PlayerSetup | null {
  if (!isObj(v) || typeof v.name !== 'string') return null;
  const name = v.name.trim().slice(0, MAX_NAME);
  if (!name || !PLAYER_COLORS.includes(v.color as string) || !TOKENS.includes(v.token as string)) return null;
  return { name, color: v.color as string, token: v.token as string };
}

function parseRules(v: unknown): RoomRules | null {
  if (!isObj(v) || !['classic', 'fast', 'custom'].includes(v.mode as string) || !isNum(v.startingCash)) return null;
  const rules: RoomRules = { mode: v.mode as RoomRules['mode'], startingCash: v.startingCash };
  if (isObj(v.custom)) {
    const c = v.custom;
    const n = (x: unknown) => (isNum(x) ? x : 0);
    rules.custom = {
      startBonus: n(c.startBonus), jailFine: n(c.jailFine), victoryPercent: n(c.victoryPercent),
      turnLimit: n(c.turnLimit), houseLimit: n(c.houseLimit), hotelLimit: n(c.hotelLimit),
    };
  }
  return rules;
}

const SIMPLE_ACTIONS = new Set([
  'ROLL', 'BUY', 'DECLINE_BUY', 'RESOLVE_CARD', 'PAY_JAIL_FINE', 'USE_JAIL_CARD', 'END_TURN',
  'ACCEPT_TRADE', 'REJECT_TRADE', 'PAY_DEBT', 'DECLARE_BANKRUPTCY',
]);
const PROPERTY_ACTIONS = new Set(['BUILD_HOUSE', 'BUILD_HOTEL', 'SELL_BUILDING', 'MORTGAGE', 'UNMORTGAGE']);

export function parseAction(v: unknown): GameAction | null {
  if (!isObj(v) || typeof v.type !== 'string') return null;
  // Dice from the client are ignored: the server rolls.
  if (v.type === 'ROLL') return { type: 'ROLL', dice: [1, 1] };
  if (SIMPLE_ACTIONS.has(v.type)) return { type: v.type } as GameAction;
  if (PROPERTY_ACTIONS.has(v.type)) {
    return isStr(v.propertyId) ? ({ type: v.type, propertyId: v.propertyId } as GameAction) : null;
  }
  if (v.type === 'PROPOSE_TRADE' && isObj(v.offer)) {
    const o = v.offer;
    if (!isStr(o.toId) || !isNum(o.offerCash) || !isNum(o.requestCash)) return null;
    if (!isStrArray(o.offerProperties) || !isStrArray(o.requestProperties)) return null;
    return {
      type: 'PROPOSE_TRADE',
      offer: {
        toId: o.toId, offerCash: o.offerCash, requestCash: o.requestCash,
        offerProperties: o.offerProperties, requestProperties: o.requestProperties,
      },
    };
  }
  return null; // includes FORFEIT, which clients may never send
}

export function parseClientMessage(raw: string): ClientMessage | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(v)) return null;
  switch (v.type) {
    case 'create_room': {
      const player = parsePlayer(v.player);
      const rules = parseRules(v.rules);
      return player && rules ? { type: 'create_room', player, rules } : null;
    }
    case 'join_room': {
      const player = parsePlayer(v.player);
      return player && isStr(v.code, 12) ? { type: 'join_room', code: v.code.toUpperCase(), player } : null;
    }
    case 'rejoin':
      return isStr(v.code, 12) && isStr(v.token, 100) ? { type: 'rejoin', code: v.code.toUpperCase(), token: v.token } : null;
    case 'update_seat': {
      const player = parsePlayer(v.player);
      return player ? { type: 'update_seat', player } : null;
    }
    case 'kick_seat':
    case 'remove_player':
      return isStr(v.seatId, 20) ? { type: v.type, seatId: v.seatId } : null;
    case 'action': {
      const action = parseAction(v.action);
      return action ? { type: 'action', action } : null;
    }
    case 'start_game':
    case 'restart':
    case 'leave':
      return { type: v.type };
    default:
      return null;
  }
}
