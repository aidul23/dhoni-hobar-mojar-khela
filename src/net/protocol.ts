import type { CustomOptions } from '../engine/setup';
import type { GameAction, GameMode, GameState, PlayerSetup } from '../types/game';

/** Rules chosen by the host; the server turns them into GameSettings (with clamping). */
export interface RoomRules {
  mode: GameMode;
  startingCash: number;
  custom?: CustomOptions;
}

export interface SeatInfo {
  id: string;
  name: string;
  color: string;
  token: string;
  connected: boolean;
  /** Game player id (p1..p4) once the game has started. */
  playerId: string | null;
  /** True once the player has left a running game. */
  left: boolean;
}

export interface RoomSnapshot {
  code: string;
  hostSeat: string;
  seats: SeatInfo[];
  status: 'lobby' | 'playing';
  rules: RoomRules;
  /** Increments on every start/restart so clients can reset their animations. */
  gameNumber: number;
  game: GameState | null;
}

export type ClientMessage =
  | { type: 'create_room'; player: PlayerSetup; rules: RoomRules }
  | { type: 'join_room'; code: string; player: PlayerSetup }
  | { type: 'rejoin'; code: string; token: string }
  | { type: 'update_seat'; player: PlayerSetup }
  | { type: 'kick_seat'; seatId: string }
  | { type: 'start_game' }
  | { type: 'action'; action: GameAction }
  | { type: 'remove_player'; seatId: string }
  | { type: 'restart' }
  | { type: 'leave' };

export type ErrorCode =
  | 'roomNotFound'
  | 'roomFull'
  | 'alreadyStarted'
  | 'notHost'
  | 'needPlayers'
  | 'notAllowed'
  | 'invalidMessage'
  | 'badToken'
  | 'lookTaken'
  | 'tooManyRequests';

export type ServerMessage =
  /** Sent once after create/join: the client stores the token to rejoin later. */
  | { type: 'joined'; code: string; seatId: string; token: string }
  | { type: 'room'; room: RoomSnapshot; you: string }
  | { type: 'left' }
  | { type: 'error'; code: ErrorCode };

export const MAX_SEATS = 4;
export const WS_PATH = '/ws';
