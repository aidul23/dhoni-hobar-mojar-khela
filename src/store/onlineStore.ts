import { create } from 'zustand';
import { canPlayerAct } from '../engine/permissions';
import { NetClient, type ConnectionStatus } from '../net/client';
import type { ErrorCode, RoomRules, RoomSnapshot, ServerMessage } from '../net/protocol';
import type { GameAction, PlayerSetup } from '../types/game';
import { useGameStore } from './gameStore';

const CREDS_KEY = 'dhmk-online';

/** Rejoin credentials live in sessionStorage: a refresh keeps the seat, and each tab is its own player. */
interface Creds { code: string; token: string }

function readCreds(): Creds | null {
  try {
    const raw = sessionStorage.getItem(CREDS_KEY);
    return raw ? (JSON.parse(raw) as Creds) : null;
  } catch {
    return null;
  }
}

function writeCreds(creds: Creds | null) {
  try {
    if (creds) sessionStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    else sessionStorage.removeItem(CREDS_KEY);
  } catch {
    // storage unavailable: rejoin after refresh will not work, play still does
  }
}

/** Removes ?room=… from the address bar once used. */
function clearRoomParam() {
  const url = new URL(location.href);
  if (!url.searchParams.has('room')) return;
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

interface OnlineStore {
  /** The online screens are shown (lobby or online game). */
  active: boolean;
  status: ConnectionStatus;
  room: RoomSnapshot | null;
  mySeatId: string | null;
  error: ErrorCode | null;
  /** An action was sent and the server has not answered yet. */
  pending: boolean;
  /** Room code from an invite link, to prefill the join form. */
  inviteCode: string;
  open: (inviteCode?: string) => void;
  close: () => void;
  createRoom: (player: PlayerSetup, rules: RoomRules) => void;
  joinRoom: (code: string, player: PlayerSetup) => void;
  updateSeat: (player: PlayerSetup) => void;
  kick: (seatId: string) => void;
  start: () => void;
  removePlayer: (seatId: string) => void;
  restart: () => void;
  leave: () => void;
  clearError: () => void;
}

let lastGameNumber = -1;

const net = new NetClient({
  onStatus: (status) => useOnlineStore.setState({ status }),
  onOpen: (send) => {
    const creds = readCreds();
    if (creds) send({ type: 'rejoin', code: creds.code, token: creds.token });
  },
  onMessage: (msg) => handleMessage(msg),
});

function handleMessage(msg: ServerMessage) {
  const set = useOnlineStore.setState;
  switch (msg.type) {
    case 'joined':
      writeCreds({ code: msg.code, token: msg.token });
      clearRoomParam();
      set({ mySeatId: msg.seatId, error: null });
      return;

    case 'room': {
      set({ room: msg.room, mySeatId: msg.you, pending: false });
      // A fresh state after an error re-syncs the screen; clear errors only on real progress.
      if (msg.room.gameNumber !== lastGameNumber) set({ error: null });
      const game = msg.room.status === 'playing' ? msg.room.game : null;
      useGameStore.setState((st) => {
        const newGame = msg.room.gameNumber !== lastGameNumber;
        lastGameNumber = msg.room.gameNumber;
        return {
          game,
          sessionId: newGame ? st.sessionId + 1 : st.sessionId,
          onlineDispatch: (action: GameAction) => {
            set({ pending: true });
            net.send({ type: 'action', action });
          },
        };
      });
      return;
    }

    case 'left':
      resetToLobby();
      return;

    case 'error':
      // A stale rejoin (room expired or seat removed): forget it and show the join form.
      if (msg.code === 'roomNotFound' || msg.code === 'badToken') {
        if (useOnlineStore.getState().room || readCreds()) resetToLobby();
      }
      set({ error: msg.code, pending: false });
      return;
  }
}

function resetToLobby() {
  writeCreds(null);
  lastGameNumber = -1;
  useOnlineStore.setState({ room: null, mySeatId: null, pending: false });
  useGameStore.setState({ game: null, onlineDispatch: null });
}

export const useOnlineStore = create<OnlineStore>((set, get) => ({
  active: false,
  status: 'idle',
  room: null,
  mySeatId: null,
  error: null,
  pending: false,
  inviteCode: '',

  open: (inviteCode = '') => {
    set({ active: true, inviteCode: inviteCode.toUpperCase(), error: null });
    useGameStore.setState({ game: null });
    net.connect();
  },

  close: () => {
    if (get().room) net.send({ type: 'leave' });
    resetToLobby();
    clearRoomParam();
    // Give the leave message a moment to go out before closing the socket.
    setTimeout(() => net.disconnect(), 200);
    set({ active: false, error: null });
  },

  createRoom: (player, rules) => net.send({ type: 'create_room', player, rules }),
  joinRoom: (code, player) => net.send({ type: 'join_room', code: code.trim().toUpperCase(), player }),
  updateSeat: (player) => net.send({ type: 'update_seat', player }),
  kick: (seatId) => net.send({ type: 'kick_seat', seatId }),
  start: () => net.send({ type: 'start_game' }),
  removePlayer: (seatId) => net.send({ type: 'remove_player', seatId }),
  restart: () => net.send({ type: 'restart' }),
  leave: () => {
    net.send({ type: 'leave' });
    resetToLobby();
  },
  clearError: () => set({ error: null }),
}));

/** Resumes an online session after a refresh, or opens the join form from an invite link. */
export function resumeOnlineSession() {
  const code = new URL(location.href).searchParams.get('room');
  if (readCreds() || code) useOnlineStore.getState().open(code ?? '');
}

/** My game player id when playing online; null offline (then everyone may act). */
export function useMyPlayerId(): string | null {
  return useOnlineStore((s) => {
    if (!s.active || !s.room || s.room.status !== 'playing') return null;
    return s.room.seats.find((seat) => seat.id === s.mySeatId)?.playerId ?? null;
  });
}

/** Whether this screen may send the action: always offline, only the right player online. */
export function useCanAct() {
  const myId = useMyPlayerId();
  const game = useGameStore((s) => s.game);
  return (action: GameAction) => (myId === null || !game ? true : canPlayerAct(game, myId, action));
}

export function inviteLink(code: string): string {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', code);
  return url.toString();
}

/** Everything the game screen needs to know about the online room (or `online: false`). */
export function useOnlineView() {
  const active = useOnlineStore((s) => s.active);
  const room = useOnlineStore((s) => s.room);
  const mySeatId = useOnlineStore((s) => s.mySeatId);
  const myId = useMyPlayerId();
  if (!active || !room || room.status !== 'playing') {
    return { online: false as const, myId: null, isHost: false, seatOf: () => undefined, room: null };
  }
  return {
    online: true as const,
    myId,
    isHost: room.hostSeat === mySeatId,
    seatOf: (playerId: string) => room.seats.find((s) => s.playerId === playerId),
    room,
  };
}
