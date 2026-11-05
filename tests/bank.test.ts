import { describe, expect, it } from 'vitest';
import { hotelsLeft, housesLeft, unsoldProperties } from '../src/engine/bank';
import { gameReducer } from '../src/engine/game';
import { buildSettings } from '../src/engine/setup';
import type { GameAction, GameState } from '../src/types/game';
import { newGame, own, patch, roll, run } from './helpers';

const house = (propertyId: string): GameAction => ({ type: 'BUILD_HOUSE', propertyId });
const hotel = (propertyId: string): GameAction => ({ type: 'BUILD_HOTEL', propertyId });
const sell = (propertyId: string): GameAction => ({ type: 'SELL_BUILDING', propertyId });

/** Brown group owned by P1 with the given bank supply. */
const brownWithSupply = (houseLimit: number | null, hotelLimit: number | null) =>
  patch(own(newGame(), 0, 'rupsha', 'sabujbag'), (g) => {
    g.settings.houseLimit = houseLimit;
    g.settings.hotelLimit = hotelLimit;
  });

const rejected = (s: GameState, a: GameAction) => expect(gameReducer(s, a)).toBe(s);

describe('building supply', () => {
  it('defaults to 32 houses and 12 hotels; custom 0 means unlimited', () => {
    expect(newGame().settings).toMatchObject({ houseLimit: 32, hotelLimit: 12 });
    const custom = buildSettings('custom', 15000, { startBonus: 2000, jailFine: 500, victoryPercent: 0, turnLimit: 0, houseLimit: 0, hotelLimit: 5 });
    expect(custom.houseLimit).toBeNull();
    expect(custom.hotelLimit).toBe(5);
  });

  it('counts houses left and blocks building when the bank runs out', () => {
    let s = brownWithSupply(2, 12);
    expect(housesLeft(s)).toBe(2);
    s = run(s, house('rupsha'), house('sabujbag'));
    expect(housesLeft(s)).toBe(0);
    rejected(s, house('rupsha'));
    s = run(s, sell('sabujbag'));
    expect(housesLeft(s)).toBe(1);
    expect(run(s, house('sabujbag')).properties.sabujbag.houses).toBe(1);
  });

  it('a hotel returns its 4 houses to the bank and uses one hotel', () => {
    let s = patch(brownWithSupply(32, 1), (g) => { g.properties.rupsha.houses = 4; g.properties.sabujbag.houses = 4; });
    expect(housesLeft(s)).toBe(24);
    s = run(s, hotel('rupsha'));
    expect(housesLeft(s)).toBe(28);
    expect(hotelsLeft(s)).toBe(0);
    rejected(s, hotel('sabujbag'));
  });

  it('selling a hotel during a house shortage drops to the houses available', () => {
    // 6 houses in total: 4 on Sabujbag, so only 2 left in the bank.
    let s = patch(brownWithSupply(6, 12), (g) => { g.properties.rupsha.hotel = true; g.properties.sabujbag.houses = 4; });
    expect(housesLeft(s)).toBe(2);
    s = run(s, sell('rupsha'));
    expect(s.properties.rupsha).toMatchObject({ hotel: false, houses: 2 });
    // 3 levels sold (hotel -> 2 houses) at ৳250 each
    expect(s.players[0].cash).toBe(15000 + 750);
  });

  it('unlimited supply never blocks building', () => {
    const s = run(brownWithSupply(null, null), house('rupsha'));
    expect(housesLeft(s)).toBeNull();
    expect(s.properties.rupsha.houses).toBe(1);
  });
});

describe('bank totals', () => {
  it('records money the bank receives and pays out', () => {
    let s = run(newGame(), roll(1, 2), { type: 'BUY' }); // pays 600
    expect(s.bank).toEqual({ received: 600, paid: 0 });
    s = run(s, { type: 'MORTGAGE', propertyId: 'sabujbag' }); // bank lends 300
    expect(s.bank.paid).toBe(300);
    s = run(s, { type: 'UNMORTGAGE', propertyId: 'sabujbag' }); // 330 back
    expect(s.bank.received).toBe(930);

    let start = patch(newGame(), (g) => { g.players[0].position = 38; });
    start = run(start, roll(2, 3)); // passes Start
    expect(start.bank.paid).toBe(2000);

    const tax = run(newGame(), roll(2, 2)); // income tax 1000
    expect(tax.bank.received).toBe(1000);
  });

  it('player-to-player rent does not touch the bank', () => {
    const s = run(own(newGame(), 1, 'sabujbag'), roll(1, 2));
    expect(s.bank).toEqual({ received: 0, paid: 0 });
  });

  it('lists unsold properties', () => {
    const s = own(newGame(), 0, 'rupsha');
    expect(unsoldProperties(s)).not.toContain('rupsha');
    expect(unsoldProperties(s)).toHaveLength(27);
  });
});
