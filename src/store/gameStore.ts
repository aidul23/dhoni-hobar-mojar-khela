import { create } from 'zustand';
import { gameReducer } from '../engine/game';
import { createGame, migrateSave } from '../engine/setup';
import type { GameAction, GameSettings, GameState, Lang, PlayerSetup } from '../types/game';
import { t } from '../utils/translations';

const SAVE_KEY = 'dhmk-save';
const LANG_KEY = 'dhmk-lang';
const MUTE_KEY = 'dhmk-muted';
const LOOK_KEY = 'dhmk-look';

/** Visual style of the home page: Bangladeshi rickshaw art (default) or the original classic design. */
export type Look = 'rickshaw' | 'classic';

function readLook(): Look {
  try {
    return localStorage.getItem(LOOK_KEY) === 'classic' ? 'classic' : 'rickshaw';
  } catch {
    return 'rickshaw';
  }
}

function readSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return migrateSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeSave(game: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn';
  }
}

interface GameStore {
  lang: Lang;
  game: GameState | null;
  /** Changes whenever a different game is loaded, so the UI can remount. */
  sessionId: number;
  muted: boolean;
  toggleMute: () => void;
  look: Look;
  setLook: (look: Look) => void;
  setLang: (lang: Lang) => void;
  startGame: (players: PlayerSetup[], settings: GameSettings) => void;
  dispatch: (action: GameAction) => void;
  saveGame: () => boolean;
  continueGame: () => boolean;
  hasSavedGame: () => boolean;
  /** Leaves the current game and returns to the setup screen (save is kept). */
  exitToSetup: () => void;
  /** Restarts with the same players and settings. */
  resetGame: () => void;
  /** Set while in an online room: actions go to the server instead of the local reducer. */
  onlineDispatch: ((action: GameAction) => void) | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  lang: readLang(),
  game: null,
  sessionId: 0,
  muted: readMuted(),
  look: readLook(),

  setLook: (look) => {
    try { localStorage.setItem(LOOK_KEY, look); } catch { /* ignore */ }
    set({ look });
  },
  onlineDispatch: null,

  toggleMute: () => {
    const muted = !get().muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
    set({ muted });
  },

  setLang: (lang) => {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
    set({ lang });
  },

  startGame: (players, settings) => {
    const game = createGame(players, settings);
    writeSave(game);
    set((st) => ({ game, sessionId: st.sessionId + 1 }));
  },

  dispatch: (action) => {
    const { game, onlineDispatch } = get();
    if (!game) return;
    if (onlineDispatch) return onlineDispatch(action);
    const next = gameReducer(game, action);
    if (next === game) return; // invalid action, nothing changed
    writeSave(next);
    set({ game: next });
  },

  saveGame: () => {
    const { game } = get();
    return game ? writeSave(game) : false;
  },

  continueGame: () => {
    const saved = readSave();
    if (saved) set((st) => ({ game: saved, sessionId: st.sessionId + 1 }));
    return !!saved;
  },

  hasSavedGame: () => readSave() !== null,

  exitToSetup: () => set({ game: null }),

  resetGame: () => {
    const { game } = get();
    if (!game) return;
    const setups = game.players.map(({ name, color, token }) => ({ name, color, token }));
    get().startGame(setups, game.settings);
  },
}));

/** Convenience hook for translated strings in the current language. */
export function useT() {
  const lang = useGameStore((s) => s.lang);
  return (key: string, params?: Record<string, string | number>) => t(lang, key, params);
}
