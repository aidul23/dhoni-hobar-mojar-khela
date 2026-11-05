import { CHANCE_CARDS, FORTUNE_CARDS } from '../data/cards';
import { PROPERTY_LIST } from '../data/properties';
import type { GameMode, GameSettings, GameState, PlayerSetup } from '../types/game';
import { shuffle } from './cards';
import type { Rng } from './dice';
import { freshPropertyState } from './property';
import { addLog } from './state';
import { emptyStats } from './stats';

/** Bump when GameState changes shape. Older saves are upgraded by `migrateSave` when possible. */
export const SAVE_VERSION = 4;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'classic',
  startingCash: 15000,
  startBonus: 2000,
  jailFine: 500,
  priceMultiplier: 1,
  victoryPercent: null,
  turnLimit: null,
  houseLimit: 32,
  hotelLimit: 12,
};

export const FAST_CASH_BONUS = 5000;
export const FAST_TURN_LIMIT = 25;

/** Allowed ranges for custom rules (inclusive). */
export const LIMITS = {
  startingCash: { min: 1000, max: 100000 },
  startBonus: { min: 0, max: 10000 },
  jailFine: { min: 0, max: 5000 },
  victoryPercent: { min: 0, max: 100 },
  turnLimit: { min: 0, max: 200 },
  houseLimit: { min: 0, max: 100 },
  hotelLimit: { min: 0, max: 50 },
} as const;

export interface CustomOptions {
  startBonus: number;
  jailFine: number;
  /** 0 or null = off */
  victoryPercent: number | null;
  /** 0 or null = off */
  turnLimit: number | null;
  /** 0 or null = unlimited */
  houseLimit?: number | null;
  hotelLimit?: number | null;
}

const clamp = (n: number, key: keyof typeof LIMITS) => {
  const { min, max } = LIMITS[key];
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));
};

/** 0 means "off". */
const optional = (n: number | null | undefined, key: keyof typeof LIMITS) =>
  n ? clamp(n, key) || null : null;

/** Builds the final settings for a game mode. Custom values are clamped to `LIMITS`. */
export function buildSettings(mode: GameMode, startingCash: number, custom?: CustomOptions): GameSettings {
  const cash = clamp(startingCash, 'startingCash');
  switch (mode) {
    case 'classic':
      return { ...DEFAULT_SETTINGS, mode, startingCash: cash };
    case 'fast':
      return {
        mode,
        startingCash: cash + FAST_CASH_BONUS,
        startBonus: 3000,
        jailFine: 300,
        priceMultiplier: 0.7,
        victoryPercent: 40,
        turnLimit: FAST_TURN_LIMIT,
        houseLimit: DEFAULT_SETTINGS.houseLimit,
        hotelLimit: DEFAULT_SETTINGS.hotelLimit,
      };
    case 'custom':
      return {
        ...DEFAULT_SETTINGS,
        mode,
        startingCash: cash,
        startBonus: clamp(custom?.startBonus ?? DEFAULT_SETTINGS.startBonus, 'startBonus'),
        jailFine: clamp(custom?.jailFine ?? DEFAULT_SETTINGS.jailFine, 'jailFine'),
        victoryPercent: optional(custom?.victoryPercent, 'victoryPercent'),
        turnLimit: optional(custom?.turnLimit, 'turnLimit'),
        houseLimit: optional(custom?.houseLimit === undefined ? DEFAULT_SETTINGS.houseLimit : custom.houseLimit, 'houseLimit'),
        hotelLimit: optional(custom?.hotelLimit === undefined ? DEFAULT_SETTINGS.hotelLimit : custom.hotelLimit, 'hotelLimit'),
      };
  }
}

/** Upgrades an older saved game to the current shape, or returns null if unusable. */
export function migrateSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!Array.isArray(g.players)) return null;

  if (g.version === 2) {
    g.settings = { ...g.settings, turnLimit: g.settings?.turnLimit ?? null };
    g.stats = Object.fromEntries(g.players.map((p: { id: string }) => [p.id, emptyStats()]));
    g.bankruptOrder = g.players.filter((p: { bankrupt: boolean }) => p.bankrupt).map((p: { id: string }) => p.id);
    g.round = Math.max(1, Math.ceil((g.turnNumber ?? 1) / g.players.length));
    g.winReason = g.winnerId ? 'lastStanding' : null;
    g.debts = (g.debts ?? []).map((d: object) => ({ reason: 'other', ...d }));
    g.version = 3;
  }
  if (g.version === 3) {
    // Saved games keep the unlimited building supply they were started with.
    g.settings = { ...g.settings, houseLimit: null, hotelLimit: null };
    g.bank = { received: 0, paid: 0 };
    g.version = 4;
  }
  return g.version === SAVE_VERSION ? (g as GameState) : null;
}

export function createGame(setups: PlayerSetup[], settings: GameSettings, rng: Rng = Math.random): GameState {
  if (setups.length < MIN_PLAYERS || setups.length > MAX_PLAYERS) {
    throw new Error(`A game needs ${MIN_PLAYERS}-${MAX_PLAYERS} players`);
  }

  const state: GameState = {
    version: SAVE_VERSION,
    settings,
    players: setups.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name.trim() || `Player ${i + 1}`,
      color: p.color,
      token: p.token,
      position: 0,
      cash: settings.startingCash,
      properties: [],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      bankrupt: false,
    })),
    currentPlayerIndex: 0,
    properties: Object.fromEntries(PROPERTY_LIST.map((p) => [p.id, freshPropertyState()])),
    phase: 'roll',
    dice: null,
    doublesCount: 0,
    canRollAgain: false,
    pendingPurchase: null,
    pendingCard: null,
    chanceDeck: shuffle(CHANCE_CARDS.map((c) => c.id), rng),
    fortuneDeck: shuffle(FORTUNE_CARDS.map((c) => c.id), rng),
    log: [],
    notice: null,
    nextLogId: 1,
    turnNumber: 1,
    winnerId: null,
    debts: [],
    pendingTrade: null,
    stats: Object.fromEntries(setups.map((_, i) => [`p${i + 1}`, emptyStats()])),
    bankruptOrder: [],
    round: 1,
    winReason: null,
    bank: { received: 0, paid: 0 },
  };
  state.stats.p1.turnsPlayed = 1;

  addLog(state, 'gameStarted');
  addLog(state, 'turnStart', { player: state.players[0].name });
  return state;
}
