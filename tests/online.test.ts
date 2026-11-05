import { describe, expect, it } from 'vitest';
import { gameReducer } from '../src/engine/game';
import { canPlayerAct } from '../src/engine/permissions';
import type { GameAction } from '../src/types/game';
import { Room, RoomManager } from '../server/rooms';
import { parseAction, parseClientMessage } from '../server/validate';
import { newGame, own, patch, roll, run } from './helpers';

const A = { name: 'Aidul', color: '#dc2626', token: '🛺' };
const B = { name: 'Nasir', color: '#2563eb', token: '⛵' };
const C = { name: 'Rumi', color: '#16a34a', token: '🐯' };
const D = { name: 'Tania', color: '#9333ea', token: '🐘' };
const RULES = { mode: 'classic' as const, startingCash: 15000 };

let secretN = 0;
const makeRoom = (rng = () => 0.5) => new Room('ABC234', RULES, rng, () => `secret-${++secretN}`);

describe('permissions', () => {
  const s = newGame(3);
  it('turn actions belong to the current player only', () => {
    for (const a of [roll(1, 2), { type: 'END_TURN' }, { type: 'BUY' }, { type: 'BUILD_HOUSE', propertyId: 'rupsha' }] as GameAction[]) {
      expect(canPlayerAct(s, 'p1', a)).toBe(true);
      expect(canPlayerAct(s, 'p2', a)).toBe(false);
    }
  });

  it('the debtor acts while a debt is open, even on someone else\'s turn', () => {
    const d = patch(s, (g) => { g.debts = [{ debtorId: 'p3', creditorId: 'p1', amount: 100, reason: 'other' }]; });
    expect(canPlayerAct(d, 'p3', { type: 'MORTGAGE', propertyId: 'rupsha' })).toBe(true);
    expect(canPlayerAct(d, 'p3', { type: 'PAY_DEBT' })).toBe(true);
    expect(canPlayerAct(d, 'p1', { type: 'PAY_DEBT' })).toBe(false);
  });

  it('only the trade target accepts; either side may reject', () => {
    const t = patch(s, (g) => {
      g.pendingTrade = { fromId: 'p1', toId: 'p2', offerCash: 10, offerProperties: [], requestCash: 0, requestProperties: [] };
    });
    expect(canPlayerAct(t, 'p2', { type: 'ACCEPT_TRADE' })).toBe(true);
    expect(canPlayerAct(t, 'p1', { type: 'ACCEPT_TRADE' })).toBe(false);
    expect(canPlayerAct(t, 'p1', { type: 'REJECT_TRADE' })).toBe(true);
    expect(canPlayerAct(t, 'p3', { type: 'REJECT_TRADE' })).toBe(false);
  });

  it('nobody may send FORFEIT, and bankrupt players cannot act', () => {
    expect(canPlayerAct(s, 'p1', { type: 'FORFEIT', playerId: 'p2' })).toBe(false);
    const b = patch(s, (g) => { g.players[0].bankrupt = true; });
    expect(canPlayerAct(b, 'p1', roll(1, 2))).toBe(false);
  });
});

describe('forfeit', () => {
  it('returns assets to the bank and passes the turn on', () => {
    let s = own(newGame(3), 0, 'rupsha');
    s = gameReducer(s, { type: 'FORFEIT', playerId: 'p1' });
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.properties.rupsha.ownerId).toBeNull();
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.phase).toBe('roll');
  });

  it('ends the game when only one player remains', () => {
    const s = gameReducer(newGame(2), { type: 'FORFEIT', playerId: 'p2' });
    expect(s.phase).toBe('gameOver');
    expect(s.winnerId).toBe('p1');
  });

  it('clears debts and trades involving the player', () => {
    let s = run(own(own(newGame(3), 1, 'sabujbag'), 0, 'rupsha'), roll(1, 2));
    s = patch(s, (g) => { g.debts = [{ debtorId: 'p1', creditorId: 'p2', amount: 999999, reason: 'rent' }]; });
    s = gameReducer(s, { type: 'FORFEIT', playerId: 'p1' });
    expect(s.debts).toEqual([]);
    expect(s.currentPlayerIndex).toBe(1);
  });
});

describe('room', () => {
  const lobby = (...players: typeof A[]) => {
    const room = makeRoom();
    const seats = players.map((p) => {
      const r = room.join(p);
      if (!r.ok) throw new Error(r.error);
      return r.value;
    });
    return { room, seats };
  };

  it('makes duplicate names unique', () => {
    const { room } = lobby(A, { ...B, name: A.name }, { ...C, name: A.name });
    expect(room.snapshot().seats.map((s) => s.name)).toEqual(['Aidul', 'Aidul 2', 'Aidul 3']);
  });

  it('first joiner is host; a 5th player is refused', () => {
    const { room, seats } = lobby(A, B, C, D);
    expect(room.snapshot().hostSeat).toBe(seats[0].seatId);
    expect(room.join({ ...A, name: 'E' })).toEqual({ ok: false, error: 'roomFull' });
  });

  it('gives a free colour/token when the chosen one is taken, and never leaks secrets', () => {
    const { room } = lobby(A, { ...B, color: A.color, token: A.token });
    const [s1, s2] = room.snapshot().seats;
    expect(s2.color).not.toBe(s1.color);
    expect(s2.token).not.toBe(s1.token);
    expect(JSON.stringify(room.snapshot())).not.toContain('secret-');
  });

  it('only the host starts, and only with 2+ players', () => {
    const solo = lobby(A);
    expect(solo.room.start(solo.seats[0].seatId)).toEqual({ ok: false, error: 'needPlayers' });
    const { room, seats } = lobby(A, B);
    expect(room.start(seats[1].seatId)).toEqual({ ok: false, error: 'notHost' });
    expect(room.start(seats[0].seatId).ok).toBe(true);
    expect(room.status).toBe('playing');
    expect(room.snapshot().seats.map((s) => s.playerId)).toEqual(['p1', 'p2']);
    expect(room.join(C)).toEqual({ ok: false, error: 'alreadyStarted' });
  });

  it('rejects actions from the wrong seat and ignores client dice', () => {
    const { room, seats } = lobby(A, B);
    room.start(seats[0].seatId);
    expect(room.act(seats[1].seatId, roll(1, 2))).toEqual({ ok: false, error: 'notAllowed' });
    expect(room.act(seats[0].seatId, roll(6, 6)).ok).toBe(true);
    // rng 0.5 -> both dice are 4, regardless of the 6+6 the client sent
    expect(room.snapshot().game!.dice).toEqual([4, 4]);
  });

  it('survives malformed actions without throwing', () => {
    const { room, seats } = lobby(A, B);
    room.start(seats[0].seatId);
    expect(room.act(seats[0].seatId, { type: 'BUILD_HOUSE', propertyId: 'nope' }).ok).toBe(false);
  });

  it('rejoins with the secret token; a wrong token is refused', () => {
    const { room, seats } = lobby(A, B);
    room.setConnected(seats[1].seatId, false);
    expect(room.rejoin('wrong')).toEqual({ ok: false, error: 'badToken' });
    expect(room.rejoin(seats[1].secret)).toEqual({ ok: true, value: seats[1].seatId });
    expect(room.snapshot().seats[1].connected).toBe(true);
  });

  it('host can remove a player; the last player standing wins; host restarts', () => {
    const { room, seats } = lobby(A, B);
    room.start(seats[0].seatId);
    expect(room.removePlayer(seats[1].seatId, seats[0].seatId).ok).toBe(false); // not host
    expect(room.removePlayer(seats[0].seatId, seats[1].seatId).ok).toBe(true);
    const game = room.snapshot().game!;
    expect(game.phase).toBe('gameOver');
    expect(game.winnerId).toBe('p1');
    // The removed seat is gone, so a restart needs another player.
    expect(room.restart(seats[0].seatId)).toEqual({ ok: false, error: 'needPlayers' });
  });

  it('restart keeps the same seats and bumps the game number', () => {
    const { room, seats } = lobby(A, B, C);
    room.start(seats[0].seatId);
    expect(room.restart(seats[0].seatId)).toEqual({ ok: false, error: 'notAllowed' }); // not over yet
    room.leave(seats[2].seatId); // C forfeits; A and B play on
    expect(room.snapshot().game!.phase).not.toBe('gameOver');
    // Finish the game (white-box: no quick legal path to a win with two solvent players).
    (room as unknown as { game: { phase: string } }).game.phase = 'gameOver';
    expect(room.restart(seats[1].seatId)).toEqual({ ok: false, error: 'notHost' });
    expect(room.restart(seats[0].seatId).ok).toBe(true);
    const snap = room.snapshot();
    expect(snap.gameNumber).toBe(2);
    expect(snap.seats.map((s) => s.name)).toEqual(['Aidul', 'Nasir']);
    expect(snap.game!.phase).toBe('roll');
    expect(snap.game!.players).toHaveLength(2);
  });

  it('a client cannot forfeit another player through act()', () => {
    const { room, seats } = lobby(A, B);
    room.start(seats[0].seatId);
    expect(room.act(seats[0].seatId, { type: 'FORFEIT', playerId: 'p2' }).ok).toBe(false);
    expect(room.snapshot().game!.players[1].bankrupt).toBe(false);
  });

  it('leaving in the lobby frees the seat and passes host on', () => {
    const { room, seats } = lobby(A, B);
    room.leave(seats[0].seatId);
    const snap = room.snapshot();
    expect(snap.seats).toHaveLength(1);
    expect(snap.hostSeat).toBe(seats[1].seatId);
  });
});

describe('room manager', () => {
  it('creates unique codes and sweeps idle rooms', () => {
    const codes = ['AAAAAA', 'AAAAAA', 'BBBBBB'];
    const m = new RoomManager(() => 0.5, () => codes.shift()!, () => 'x');
    const r1 = m.create(RULES)!;
    const r2 = m.create(RULES)!;
    expect(r1.code).not.toBe(r2.code);
    r1.join(A);
    r2.join(B);
    r1.lastActivity = 0;
    expect(m.sweep(1000, 5000)).toEqual(['AAAAAA']);
    expect(m.get('bbbbbb')).toBe(r2);
  });
});

describe('message validation', () => {
  it('accepts well-formed messages and strips client dice', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'join_room', code: 'abc234', player: A })))
      .toEqual({ type: 'join_room', code: 'ABC234', player: A });
    expect(parseAction({ type: 'ROLL', dice: [6, 6] })).toEqual({ type: 'ROLL', dice: [1, 1] });
  });

  it('rejects garbage, unknown colours/tokens, FORFEIT and bad trade shapes', () => {
    expect(parseClientMessage('not json')).toBeNull();
    expect(parseClientMessage(JSON.stringify({ type: 'join_room', code: 'X', player: { ...A, color: 'red' } }))).toBeNull();
    expect(parseAction({ type: 'FORFEIT', playerId: 'p2' })).toBeNull();
    expect(parseAction({ type: 'PROPOSE_TRADE', offer: { toId: 'p2', offerCash: 1, requestCash: 0, offerProperties: 'x', requestProperties: [] } })).toBeNull();
    expect(parseAction({ type: 'MORTGAGE' })).toBeNull();
  });

  it('trims long names', () => {
    const msg = parseClientMessage(JSON.stringify({ type: 'update_seat', player: { ...A, name: '  ' + 'ক'.repeat(30) } }));
    expect(msg && msg.type === 'update_seat' && msg.player.name.length).toBe(16);
  });
});
