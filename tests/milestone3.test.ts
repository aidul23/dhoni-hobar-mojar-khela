import { describe, expect, it } from 'vitest';
import { finalRanking, netWorth } from '../src/engine/ranking';
import { buildSettings, createGame, migrateSave } from '../src/engine/setup';
import type { GameAction } from '../src/types/game';
import { newGame, own, patch, roll, run } from './helpers';

const END: GameAction = { type: 'END_TURN' };

describe('statistics', () => {
  it('tracks rent paid and received, including rent settled through a debt', () => {
    let s = run(own(newGame(), 1, 'sabujbag'), roll(1, 2));
    expect(s.stats.p1.rentPaid).toBe(50);
    expect(s.stats.p2.rentReceived).toBe(50);

    let d = patch(own(own(newGame(), 1, 'sabujbag'), 0, 'rupsha'), (g) => { g.players[0].cash = 10; });
    d = run(d, roll(1, 2));
    expect(d.stats.p1.rentPaid).toBe(0); // not paid yet
    d = run(d, { type: 'MORTGAGE', propertyId: 'rupsha' }, { type: 'PAY_DEBT' });
    expect(d.stats.p1.rentPaid).toBe(50);
    expect(d.stats.p2.rentReceived).toBe(50);
  });

  it('tracks purchases, taxes, doubles, start passes, jail and turns', () => {
    let s = run(newGame(), roll(2, 2)); // doubles -> income tax
    expect(s.stats.p1.doublesRolled).toBe(1);
    expect(s.stats.p1.taxesPaid).toBe(1000);
    s = run(s, roll(1, 2)); // 4 + 3 = 7: Chance
    expect(s.stats.p1.cardsDrawn).toBe(1);

    let b = run(newGame(), roll(1, 2), { type: 'BUY' }, END);
    expect(b.stats.p1.propertiesBought).toBe(1);
    expect(b.stats.p1.turnsPlayed).toBe(1);
    expect(b.stats.p2.turnsPlayed).toBe(1);

    let start = patch(newGame(), (g) => { g.players[0].position = 38; });
    start = run(start, roll(2, 3));
    expect(start.stats.p1.passedStart).toBe(1);

    let jail = patch(newGame(), (g) => { g.players[0].position = 25; });
    jail = run(jail, roll(2, 3));
    expect(jail.stats.p1.jailVisits).toBe(1);
  });

  it('tracks houses, hotels and trades', () => {
    let s = run(own(newGame(), 0, 'rupsha', 'sabujbag'), { type: 'BUILD_HOUSE', propertyId: 'rupsha' });
    expect(s.stats.p1.housesBuilt).toBe(1);
    s = patch(s, (g) => { g.properties.rupsha.houses = 4; g.properties.sabujbag.houses = 4; });
    s = run(s, { type: 'BUILD_HOTEL', propertyId: 'rupsha' });
    expect(s.stats.p1.hotelsBuilt).toBe(1);

    const t = run(
      own(newGame(), 1, 'rail'),
      { type: 'PROPOSE_TRADE', offer: { toId: 'p2', offerCash: 2500, offerProperties: [], requestCash: 0, requestProperties: ['rail'] } },
      { type: 'ACCEPT_TRADE' },
    );
    expect(t.stats.p1.tradesCompleted).toBe(1);
    expect(t.stats.p2.tradesCompleted).toBe(1);
  });
});

describe('net worth and ranking', () => {
  it('counts cash, properties, buildings, mortgage equity and debts', () => {
    let s = own(newGame(), 0, 'rupsha', 'sabujbag');
    s = patch(s, (g) => { g.properties.rupsha.houses = 2; g.properties.sabujbag.mortgaged = true; });
    // 15000 + 600 + 2*500 + (600 - 300)
    expect(netWorth(s, s.players[0])).toBe(16900);
    s = patch(s, (g) => { g.debts = [{ debtorId: 'p1', creditorId: null, amount: 900, reason: 'other' }]; });
    expect(netWorth(s, s.players[0])).toBe(16000);
  });

  it('ranks winner first, then by net worth, then bankrupt players by exit order', () => {
    const s = patch(newGame(4), (g) => {
      g.players[0].bankrupt = true;
      g.players[2].bankrupt = true;
      g.bankruptOrder = ['p3', 'p1'];
      g.players[1].cash = 100;
      g.winnerId = 'p2';
    });
    expect(finalRanking(s).map((p) => p.id)).toEqual(['p2', 'p4', 'p1', 'p3']);
  });
});

describe('rounds and turn limit', () => {
  it('increments the round when play wraps around', () => {
    let s = run(newGame(3), roll(1, 2), { type: 'DECLINE_BUY' }, END);
    expect(s.round).toBe(1);
    s = patch(s, (g) => { g.currentPlayerIndex = 2; g.phase = 'end'; });
    s = run(s, END);
    expect(s.round).toBe(2);
  });

  it('ends the game after the last round and crowns the richest player', () => {
    const settings = { ...buildSettings('classic', 15000), turnLimit: 1 };
    let s = createGame([
      { name: 'A', color: 'r', token: 'a' },
      { name: 'B', color: 'b', token: 'b' },
    ], settings, () => 0.5);
    s = patch(s, (g) => { g.players[1].cash = 20000; });
    s = run(s, roll(1, 2), { type: 'DECLINE_BUY' }, END);
    expect(s.phase).toBe('roll'); // round 1, B's turn
    s = run(s, roll(1, 2), { type: 'DECLINE_BUY' }, END);
    expect(s.phase).toBe('gameOver');
    expect(s.winnerId).toBe('p2');
    expect(s.winReason).toBe('turnLimit');
  });

  it('records the win reason for last-standing and ownership wins', () => {
    const s = run(
      patch(own(newGame(), 1, 'sabujbag'), (g) => { g.players[0].cash = 10; }),
      roll(1, 2),
      { type: 'DECLARE_BANKRUPTCY' },
    );
    expect(s.winReason).toBe('lastStanding');
    expect(s.bankruptOrder).toEqual(['p1']);
  });
});

describe('custom rules', () => {
  it('clamps custom values to safe ranges and treats 0 as off', () => {
    const s = buildSettings('custom', 50, { startBonus: -100, jailFine: 999999, victoryPercent: 0, turnLimit: 500 });
    expect(s.startingCash).toBe(1000);
    expect(s.startBonus).toBe(0);
    expect(s.jailFine).toBe(5000);
    expect(s.victoryPercent).toBeNull();
    expect(s.turnLimit).toBe(200);
  });

  it('fast mode has a turn limit', () => {
    expect(buildSettings('fast', 15000).turnLimit).toBe(25);
    expect(buildSettings('classic', 15000).turnLimit).toBeNull();
  });
});

describe('save migration', () => {
  it('upgrades a version 2 save', () => {
    const v3 = newGame();
    const v2 = JSON.parse(JSON.stringify(v3));
    for (const k of ['stats', 'bankruptOrder', 'round', 'winReason']) delete v2[k];
    delete v2.settings.turnLimit;
    v2.version = 2;
    v2.debts = [{ debtorId: 'p1', creditorId: null, amount: 5 }];
    const m = migrateSave(v2)!;
    expect(m.version).toBe(4); // upgraded through v3 to the current version
    expect(m.settings.houseLimit).toBeNull();
    expect(m.bank).toEqual({ received: 0, paid: 0 });
    expect(m.stats.p1.rentPaid).toBe(0);
    expect(m.settings.turnLimit).toBeNull();
    expect(m.debts[0].reason).toBe('other');
  });

  it('rejects garbage and unknown versions', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave({ version: 1, players: [] })).toBeNull();
    expect(migrateSave('x')).toBeNull();
  });
});
