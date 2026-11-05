import { describe, expect, it } from 'vitest';
import { JAIL_INDEX } from '../src/data/board';
import { CHANCE_CARDS, FORTUNE_CARDS } from '../src/data/cards';
import { gameReducer } from '../src/engine/game';
import { getPrice } from '../src/engine/property';
import { calculateRent } from '../src/engine/rent';
import { nextActivePlayerIndex } from '../src/engine/turn';
import { newGame, own, patch, roll, run } from './helpers';

describe('setup', () => {
  it('creates players with starting cash and shuffled 20-card decks', () => {
    const s = newGame(3);
    expect(s.players).toHaveLength(3);
    expect(s.players.every((p) => p.cash === 15000 && p.position === 0)).toBe(true);
    expect(s.chanceDeck).toHaveLength(20);
    expect(s.fortuneDeck).toHaveLength(20);
    expect(CHANCE_CARDS).toHaveLength(20);
    expect(FORTUNE_CARDS).toHaveLength(20);
    expect(s.phase).toBe('roll');
  });

  it('fast mode adds cash and makes properties cheaper', () => {
    const s = newGame(2, 'fast');
    expect(s.players[0].cash).toBe(20000);
    expect(getPrice(s.settings, 'sonargaon')).toBeLessThan(4000);
  });

  it('rejects invalid player counts', () => {
    expect(() => newGame(1)).toThrow();
    expect(() => newGame(5)).toThrow();
  });
});

describe('dice movement', () => {
  it('moves the current player by the dice total', () => {
    const s = run(newGame(), roll(1, 2));
    expect(s.players[0].position).toBe(3);
    expect(s.dice).toEqual([1, 2]);
  });

  it('rejects invalid dice values and rolling outside the roll phase', () => {
    const s = newGame();
    expect(gameReducer(s, roll(0, 7))).toBe(s);
    const afterRoll = run(s, roll(1, 2)); // now in buy phase
    expect(gameReducer(afterRoll, roll(1, 2))).toBe(afterRoll);
  });

  it('pays the start bonus when passing Start', () => {
    let s = patch(newGame(), (d) => { d.players[0].position = 38; });
    s = run(s, roll(2, 3)); // 38 + 5 = 43 -> 3
    expect(s.players[0].position).toBe(3);
    expect(s.players[0].cash).toBe(15000 + 2000);
  });

  it('pays the start bonus when landing exactly on Start', () => {
    let s = patch(newGame(), (d) => { d.players[0].position = 36; });
    s = run(s, roll(1, 3));
    expect(s.players[0].position).toBe(0);
    expect(s.players[0].cash).toBe(17000);
  });
});

describe('property purchase', () => {
  it('offers the property and buys it', () => {
    let s = run(newGame(), roll(1, 2)); // sabujbag
    expect(s.phase).toBe('buy');
    expect(s.pendingPurchase).toBe('sabujbag');
    s = run(s, { type: 'BUY' });
    expect(s.players[0].cash).toBe(15000 - 600);
    expect(s.players[0].properties).toEqual(['sabujbag']);
    expect(s.properties.sabujbag.ownerId).toBe('p1');
    expect(s.phase).toBe('end');
  });

  it('cannot buy without landing on the property', () => {
    const s = newGame();
    expect(gameReducer(s, { type: 'BUY' })).toBe(s);
  });

  it('cannot buy without enough cash', () => {
    let s = patch(newGame(), (d) => { d.players[0].cash = 100; });
    s = run(s, roll(1, 2));
    expect(gameReducer(s, { type: 'BUY' })).toBe(s);
    s = run(s, { type: 'DECLINE_BUY' });
    expect(s.properties.sabujbag.ownerId).toBeNull();
    expect(s.phase).toBe('end');
  });
});

describe('rent', () => {
  it('charges base rent, doubled for a full colour group', () => {
    let s = own(newGame(), 0, 'sabujbag');
    expect(calculateRent(s, 'sabujbag', 7)).toBe(50);
    s = own(s, 0, 'rupsha');
    expect(calculateRent(s, 'sabujbag', 7)).toBe(100);
  });

  it('uses house and hotel rent levels', () => {
    const s = patch(own(newGame(), 0, 'sabujbag', 'rupsha'), (d) => { d.properties.sabujbag.houses = 2; });
    expect(calculateRent(s, 'sabujbag', 7)).toBe(660);
    const h = patch(s, (d) => { d.properties.sabujbag.houses = 0; d.properties.sabujbag.hotel = true; });
    expect(calculateRent(h, 'sabujbag', 7)).toBe(2520);
  });

  it('scales transport and utility rent with the number owned', () => {
    let s = own(newGame(), 0, 'rail', 'bus');
    expect(calculateRent(s, 'rail', 7)).toBe(500);
    s = own(s, 0, 'power');
    expect(calculateRent(s, 'power', 7)).toBe(280);
    s = own(s, 0, 'water');
    expect(calculateRent(s, 'power', 7)).toBe(700);
  });

  it('transfers rent from visitor to owner when landing', () => {
    let s = own(newGame(), 1, 'sabujbag');
    s = run(s, roll(1, 2));
    expect(s.players[0].cash).toBe(15000 - 50);
    expect(s.players[1].cash).toBe(15000 + 50);
    expect(s.notice?.key).toBe('paidRent');
    expect(s.phase).toBe('end');
  });

  it('charges no rent on own or mortgaged property', () => {
    let s = own(newGame(), 0, 'sabujbag');
    s = run(s, roll(1, 2));
    expect(s.players[0].cash).toBe(15000);

    let m = patch(own(newGame(), 1, 'sabujbag'), (d) => { d.properties.sabujbag.mortgaged = true; });
    m = run(m, roll(1, 2));
    expect(m.players[0].cash).toBe(15000);
    expect(m.players[1].cash).toBe(15000);
  });
});

describe('turn rotation', () => {
  it('passes the turn to the next player and wraps around', () => {
    let s = run(newGame(3), roll(1, 2), { type: 'DECLINE_BUY' }, { type: 'END_TURN' });
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.phase).toBe('roll');
    s = patch(s, (d) => { d.currentPlayerIndex = 2; d.phase = 'end'; });
    s = run(s, { type: 'END_TURN' });
    expect(s.currentPlayerIndex).toBe(0);
  });

  it('cannot end the turn before rolling', () => {
    const s = newGame();
    expect(gameReducer(s, { type: 'END_TURN' })).toBe(s);
  });

  it('skips bankrupt players', () => {
    const s = newGame(4);
    s.players[1].bankrupt = true;
    s.players[2].bankrupt = true;
    expect(nextActivePlayerIndex(s.players, 0)).toBe(3);
    expect(nextActivePlayerIndex(s.players, 3)).toBe(0);
  });

  it('doubles give another roll; three doubles send the player to jail', () => {
    let s = run(newGame(), roll(2, 2)); // Income tax
    expect(s.players[0].cash).toBe(14000);
    expect(s.phase).toBe('roll');
    expect(s.currentPlayerIndex).toBe(0);
    s = run(s, roll(3, 3)); // 10: jail (just visiting)
    expect(s.phase).toBe('roll');
    s = run(s, roll(1, 1));
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].position).toBe(JAIL_INDEX);
    expect(s.phase).toBe('end');
  });
});

describe('jail', () => {
  const jailed = () => patch(newGame(), (d) => {
    d.players[0].position = JAIL_INDEX;
    d.players[0].inJail = true;
  });

  it('Go To Jail space sends the player to jail without extra roll', () => {
    let s = patch(newGame(), (d) => { d.players[0].position = 26; });
    s = run(s, roll(2, 2)); // doubles, lands on 30
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].position).toBe(JAIL_INDEX);
    expect(s.phase).toBe('end');
  });

  it('stays in jail on a failed roll and is forced to pay on the 3rd', () => {
    let s = run(jailed(), roll(1, 2));
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].jailTurns).toBe(1);
    expect(s.phase).toBe('end');
    s = patch(s, (d) => { d.phase = 'roll'; d.players[0].jailTurns = 2; });
    s = run(s, roll(1, 2)); // 13: meghna
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].cash).toBe(15000 - 500);
    expect(s.players[0].position).toBe(13);
  });

  it('rolling doubles releases the player but grants no extra roll', () => {
    const s = run(jailed(), roll(3, 3)); // 16: modhumoti
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].position).toBe(16);
    expect(s.phase).toBe('buy');
    expect(s.canRollAgain).toBe(false);
    const after = run(s, { type: 'DECLINE_BUY' });
    expect(after.phase).toBe('end');
  });

  it('can pay the fine or use a card before rolling', () => {
    const paid = run(jailed(), { type: 'PAY_JAIL_FINE' });
    expect(paid.players[0].inJail).toBe(false);
    expect(paid.players[0].cash).toBe(14500);
    expect(paid.phase).toBe('roll');

    const noCard = jailed();
    expect(gameReducer(noCard, { type: 'USE_JAIL_CARD' })).toBe(noCard);
    const withCard = patch(jailed(), (d) => { d.players[0].getOutOfJailCards = 1; });
    const used = run(withCard, { type: 'USE_JAIL_CARD' });
    expect(used.players[0].inJail).toBe(false);
    expect(used.players[0].getOutOfJailCards).toBe(0);
  });
});

describe('cards', () => {
  /** Puts the player 3 spaces before the Chance space at 7 with a chosen top card. */
  const atChance = (cardId: string, players = 2) =>
    patch(newGame(players), (d) => {
      d.players[0].position = 4;
      d.chanceDeck = [cardId, ...d.chanceDeck.filter((c) => c !== cardId)];
    });

  it('draws a card and waits for confirmation before applying it', () => {
    let s = run(atChance('chance-1'), roll(1, 2));
    expect(s.phase).toBe('card');
    expect(s.pendingCard?.cardId).toBe('chance-1');
    expect(s.chanceDeck.at(-1)).toBe('chance-1');
    s = run(s, { type: 'RESOLVE_CARD' });
    expect(s.players[0].cash).toBe(15500);
    expect(s.phase).toBe('end');
  });

  it('move card resolves the new space', () => {
    const s = run(atChance('chance-3'), roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(s.players[0].position).toBe(10);
    expect(s.phase).toBe('end');
  });

  it('advance-to-Start card pays the start bonus', () => {
    const s = run(atChance('chance-5'), roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(s.players[0].position).toBe(0);
    expect(s.players[0].cash).toBe(17000);
  });

  it('go-to-jail card jails the player', () => {
    const s = run(atChance('chance-4'), roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].position).toBe(JAIL_INDEX);
  });

  it('collect-from-each card takes money from every other player', () => {
    const s = run(atChance('chance-6', 3), roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(s.players[0].cash).toBe(15400);
    expect(s.players[1].cash).toBe(14800);
    expect(s.players[2].cash).toBe(14800);
  });

  it('advance-to-property card can lead to a purchase offer', () => {
    const s = run(atChance('chance-8'), roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(s.players[0].position).toBe(39);
    expect(s.phase).toBe('buy');
    expect(s.pendingPurchase).toBe('sonargaon');
  });
});

describe('victory', () => {
  it('ownership victory triggers in fast mode', () => {
    const ids = ['rupsha', 'sabujbag', 'nilachal', 'shantinagar', 'anandapur', 'karnaphuli', 'meghna', 'padma', 'modhumoti', 'dhansiri'];
    let s = own(newGame(2, 'fast'), 0, ...ids); // 10/28 = 35.7%
    s = patch(s, (d) => { d.players[0].position = 16; });
    s = run(s, roll(1, 2), { type: 'BUY' }); // 19: kashbon -> 11/28 = 39%
    expect(s.phase).not.toBe('gameOver');
    s = own(s, 0, 'krishnachura'); // 12/28 = 42.8%, checked on the next action
    s = patch(s, (d) => { d.phase = 'roll'; d.players[0].position = 20; });
    s = run(s, roll(1, 2), { type: 'BUY' }); // 23: bokultola
    expect(s.phase).toBe('gameOver');
    expect(s.winnerId).toBe('p1');
  });
});
