import { PLAYER_COLORS, TOKENS } from '../src/data/tokens';
import { rollDice, type Rng } from '../src/engine/dice';
import { gameReducer } from '../src/engine/game';
import { canPlayerAct } from '../src/engine/permissions';
import { buildSettings, createGame } from '../src/engine/setup';
import { MAX_SEATS, type ErrorCode, type RoomRules, type RoomSnapshot, type SeatInfo } from '../src/net/protocol';
import type { GameAction, GameState, PlayerSetup } from '../src/types/game';

interface Seat extends SeatInfo {
  token: string; // emoji token (shown to everyone)
  secret: string; // rejoin credential (never sent to other players)
}

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: ErrorCode };
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: ErrorCode): Result<never> => ({ ok: false, error });

let seatCounter = 0;

/**
 * One online game room: seats, rules and the authoritative game state.
 * Pure logic with no sockets, so it can be unit-tested directly.
 */
export class Room {
  readonly code: string;
  private seats: Seat[] = [];
  private hostSeat = '';
  private rules: RoomRules;
  private game: GameState | null = null;
  private gameNumber = 0;
  lastActivity = Date.now();

  constructor(code: string, rules: RoomRules, private rng: Rng, private makeSecret: () => string) {
    this.code = code;
    this.rules = rules;
  }

  get status(): 'lobby' | 'playing' {
    return this.game ? 'playing' : 'lobby';
  }

  get isEmpty(): boolean {
    return this.seats.every((s) => s.left);
  }

  private touch() {
    this.lastActivity = Date.now();
  }

  private seat(id: string): Seat | undefined {
    return this.seats.find((s) => s.id === id);
  }

  private activeSeats(): Seat[] {
    return this.seats.filter((s) => !s.left);
  }

  /** Gives a joining player a colour/token nobody else uses, keeping their choice when free. */
  private uniqueLook(player: PlayerSetup, exceptSeat?: string) {
    const others = this.activeSeats().filter((s) => s.id !== exceptSeat);
    const usedColors = new Set(others.map((s) => s.color));
    const usedTokens = new Set(others.map((s) => s.token));
    const color = usedColors.has(player.color) ? PLAYER_COLORS.find((c) => !usedColors.has(c))! : player.color;
    const token = usedTokens.has(player.token) ? TOKENS.find((t) => !usedTokens.has(t))! : player.token;
    return { color, token };
  }

  /** "Aidul" → "Aidul 2" when someone in the room already uses the name. */
  private uniqueName(name: string, exceptSeat?: string): string {
    const taken = new Set(this.activeSeats().filter((s) => s.id !== exceptSeat).map((s) => s.name));
    if (!taken.has(name)) return name;
    for (let n = 2; ; n++) {
      const candidate = `${name.slice(0, 13)} ${n}`;
      if (!taken.has(candidate)) return candidate;
    }
  }

  join(player: PlayerSetup): Result<{ seatId: string; secret: string }> {
    if (this.game) return fail('alreadyStarted');
    if (this.activeSeats().length >= MAX_SEATS) return fail('roomFull');
    const id = `s${++seatCounter}`;
    const secret = this.makeSecret();
    this.seats.push({ id, name: this.uniqueName(player.name), ...this.uniqueLook(player), connected: true, playerId: null, left: false, secret });
    if (!this.hostSeat) this.hostSeat = id;
    this.touch();
    return ok({ seatId: id, secret });
  }

  rejoin(secret: string): Result<string> {
    const seat = this.seats.find((s) => s.secret === secret && !s.left);
    if (!seat) return fail('badToken');
    seat.connected = true;
    this.touch();
    return ok(seat.id);
  }

  setConnected(seatId: string, connected: boolean) {
    const seat = this.seat(seatId);
    if (seat) seat.connected = connected;
  }

  updateSeat(seatId: string, player: PlayerSetup): Result {
    const seat = this.seat(seatId);
    if (!seat || seat.left) return fail('notAllowed');
    if (this.game) return fail('alreadyStarted');
    const others = this.activeSeats().filter((s) => s.id !== seatId);
    if (others.some((s) => s.color === player.color || s.token === player.token)) return fail('lookTaken');
    Object.assign(seat, { name: this.uniqueName(player.name, seatId), color: player.color, token: player.token });
    this.touch();
    return ok(undefined);
  }

  setRules(bySeat: string, rules: RoomRules): Result {
    if (bySeat !== this.hostSeat) return fail('notHost');
    if (this.game) return fail('alreadyStarted');
    this.rules = rules;
    return ok(undefined);
  }

  kick(bySeat: string, seatId: string): Result {
    if (bySeat !== this.hostSeat || seatId === bySeat) return fail('notHost');
    if (this.game) return fail('alreadyStarted');
    this.seats = this.seats.filter((s) => s.id !== seatId);
    this.touch();
    return ok(undefined);
  }

  start(bySeat: string): Result {
    if (bySeat !== this.hostSeat) return fail('notHost');
    if (this.game) return fail('alreadyStarted');
    return this.newGame();
  }

  private newGame(): Result {
    const seats = this.activeSeats();
    if (seats.length < 2) return fail('needPlayers');
    const settings = buildSettings(this.rules.mode, this.rules.startingCash, this.rules.custom);
    this.game = createGame(seats.map(({ name, color, token }) => ({ name, color, token })), settings, this.rng);
    seats.forEach((s, i) => { s.playerId = `p${i + 1}`; });
    // Seats that left an earlier game are dropped for good.
    this.seats = seats;
    this.gameNumber += 1;
    this.touch();
    return ok(undefined);
  }

  restart(bySeat: string): Result {
    if (bySeat !== this.hostSeat) return fail('notHost');
    if (!this.game || this.game.phase !== 'gameOver') return fail('notAllowed');
    return this.newGame();
  }

  /** Applies a player's action if it is their call. The server always rolls the dice. */
  act(seatId: string, action: GameAction): Result {
    const seat = this.seat(seatId);
    if (!this.game || !seat?.playerId || seat.left) return fail('notAllowed');
    if (!canPlayerAct(this.game, seat.playerId, action)) return fail('notAllowed');
    const real: GameAction = action.type === 'ROLL' ? { type: 'ROLL', dice: rollDice(this.rng) } : action;
    return this.applyToGame(real);
  }

  private applyToGame(action: GameAction): Result {
    try {
      const next = gameReducer(this.game!, action);
      if (next === this.game) return fail('notAllowed');
      this.game = next;
      this.touch();
      return ok(undefined);
    } catch {
      // Malformed input (e.g. an unknown property id) must never crash the server.
      return fail('invalidMessage');
    }
  }

  /** Host removes a player from a running game (e.g. they disconnected and are not coming back). */
  removePlayer(bySeat: string, seatId: string): Result {
    if (bySeat !== this.hostSeat || seatId === bySeat) return fail('notHost');
    return this.forfeit(seatId);
  }

  private forfeit(seatId: string): Result {
    const seat = this.seat(seatId);
    if (!this.game || !seat?.playerId) return fail('notAllowed');
    if (this.game.phase !== 'gameOver') this.applyToGame({ type: 'FORFEIT', playerId: seat.playerId });
    seat.left = true;
    seat.connected = false;
    return ok(undefined);
  }

  /** A player leaves: in the lobby they free their seat; in a game they forfeit. */
  leave(seatId: string): Result {
    const seat = this.seat(seatId);
    if (!seat) return fail('notAllowed');
    if (this.game) this.forfeit(seatId);
    else this.seats = this.seats.filter((s) => s.id !== seatId);
    if (this.hostSeat === seatId) {
      this.hostSeat = this.activeSeats().find((s) => s.connected)?.id ?? this.activeSeats()[0]?.id ?? '';
    }
    this.touch();
    return ok(undefined);
  }

  snapshot(): RoomSnapshot {
    return {
      code: this.code,
      hostSeat: this.hostSeat,
      seats: this.seats.map(({ secret: _secret, ...info }) => info),
      status: this.status,
      rules: this.rules,
      gameNumber: this.gameNumber,
      game: this.game,
    };
  }
}

/** All rooms in this server process. */
export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor(
    private rng: Rng,
    private makeCode: () => string,
    private makeSecret: () => string,
    private maxRooms = 500,
  ) {}

  create(rules: RoomRules): Room | null {
    if (this.rooms.size >= this.maxRooms) return null;
    let code = this.makeCode();
    while (this.rooms.has(code)) code = this.makeCode();
    const room = new Room(code, rules, this.rng, this.makeSecret);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  delete(code: string) {
    this.rooms.delete(code);
  }

  /** Removes rooms idle for longer than `maxIdleMs`. Returns the removed codes. */
  sweep(maxIdleMs: number, now = Date.now()): string[] {
    const removed: string[] = [];
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity > maxIdleMs || room.isEmpty) {
        this.rooms.delete(code);
        removed.push(code);
      }
    }
    return removed;
  }

  get size() {
    return this.rooms.size;
  }
}
