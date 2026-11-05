import { describe, expect, it } from 'vitest';
import { JAIL_INDEX } from '../src/data/board';
import { gameReducer } from '../src/engine/game';
import { maxRaisableCash } from '../src/engine/bankruptcy';
import { calculateRent } from '../src/engine/rent';
import type { GameAction, GameState } from '../src/types/game';
import { newGame, own, patch, roll, run } from './helpers';

const house = (propertyId: string): GameAction => ({ type: 'BUILD_HOUSE', propertyId });
const hotel = (propertyId: string): GameAction => ({ type: 'BUILD_HOTEL', propertyId });
const sell = (propertyId: string): GameAction => ({ type: 'SELL_BUILDING', propertyId });
const mortgage = (propertyId: string): GameAction => ({ type: 'MORTGAGE', propertyId });
const unmortgage = (propertyId: string): GameAction => ({ type: 'UNMORTGAGE', propertyId });

/** Asserts the action was rejected (state object unchanged). */
function rejected(s: GameState, action: GameAction) {
  expect(gameReducer(s, action)).toBe(s);
}

/** Every property's owner and every player's property list agree. */
function assertOwnershipConsistent(s: GameState) {
  for (const [id, ps] of Object.entries(s.properties)) {
    if (ps.ownerId) expect(s.players.find((p) => p.id === ps.ownerId)!.properties).toContain(id);
  }
  for (const p of s.players) for (const id of p.properties) expect(s.properties[id].ownerId).toBe(p.id);
}

const brown = () => own(newGame(), 0, 'rupsha', 'sabujbag');

describe('houses and hotels', () => {
  it('requires the full colour group', () => {
    rejected(own(newGame(), 0, 'rupsha'), house('rupsha'));
  });

  it('builds a house and charges the house cost', () => {
    const s = run(brown(), house('rupsha'));
    expect(s.properties.rupsha.houses).toBe(1);
    expect(s.players[0].cash).toBe(15000 - 500);
    expect(calculateRent(s, 'rupsha', 7)).toBe(240);
  });

  it('enforces even building', () => {
    const s = run(brown(), house('rupsha'));
    rejected(s, house('rupsha'));
    const both = run(s, house('sabujbag'), house('rupsha'));
    expect(both.properties.rupsha.houses).toBe(2);
  });

  it('builds a hotel only after four houses on every property in the group', () => {
    let s = run(brown(), house('rupsha'), house('sabujbag'));
    rejected(s, hotel('rupsha'));
    s = patch(s, (d) => { d.properties.rupsha.houses = 4; d.properties.sabujbag.houses = 3; });
    rejected(s, house('rupsha'));
    rejected(s, hotel('rupsha'));
    s = run(s, house('sabujbag'), hotel('rupsha'));
    expect(s.properties.rupsha).toMatchObject({ hotel: true, houses: 0 });
    rejected(s, house('rupsha'));
    rejected(s, hotel('rupsha'));
  });

  it('cannot build without enough cash', () => {
    rejected(patch(brown(), (d) => { d.players[0].cash = 499; }), house('rupsha'));
  });

  it('sells buildings for half price, most developed first', () => {
    let s = patch(brown(), (d) => { d.properties.rupsha.houses = 1; d.properties.sabujbag.houses = 2; });
    rejected(s, sell('rupsha'));
    s = run(s, sell('sabujbag'));
    expect(s.properties.sabujbag.houses).toBe(1);
    expect(s.players[0].cash).toBe(15250);

    let h = patch(brown(), (d) => { d.properties.rupsha.hotel = true; d.properties.sabujbag.houses = 4; });
    h = run(h, sell('rupsha'));
    expect(h.properties.rupsha).toMatchObject({ hotel: false, houses: 4 });
  });

  it('only allows managing own properties, outside buy/card resolution', () => {
    const s = own(newGame(), 1, 'rupsha', 'sabujbag');
    rejected(s, house('rupsha'));
    const inCard = patch(brown(), (d) => { d.phase = 'card'; });
    rejected(inCard, house('rupsha'));
  });
});

describe('mortgage', () => {
  it('pays the mortgage value and blocks rent', () => {
    const s = run(brown(), mortgage('rupsha'));
    expect(s.properties.rupsha.mortgaged).toBe(true);
    expect(s.players[0].cash).toBe(15300);
    expect(calculateRent(s, 'rupsha', 7)).toBe(0);
    rejected(s, mortgage('rupsha'));
  });

  it('costs mortgage value + 10% to lift', () => {
    const s = run(brown(), mortgage('rupsha'), unmortgage('rupsha'));
    expect(s.properties.rupsha.mortgaged).toBe(false);
    expect(s.players[0].cash).toBe(15300 - 330);
  });

  it('cannot mortgage while the group has buildings, nor build on a mortgaged group', () => {
    rejected(run(brown(), house('rupsha')), mortgage('sabujbag'));
    rejected(run(brown(), mortgage('sabujbag')), house('rupsha'));
  });
});

describe('trading', () => {
  const offer = (extra: Partial<Extract<GameAction, { type: 'PROPOSE_TRADE' }>['offer']> = {}): GameAction => ({
    type: 'PROPOSE_TRADE',
    offer: { toId: 'p2', offerCash: 100, offerProperties: ['rupsha'], requestCash: 0, requestProperties: ['rail'], ...extra },
  });
  const setup = () => own(own(newGame(), 0, 'rupsha'), 1, 'rail');

  it('swaps cash and properties when accepted', () => {
    let s = run(setup(), offer());
    expect(s.pendingTrade?.fromId).toBe('p1');
    rejected(s, roll(1, 2)); // play waits for the answer
    s = run(s, { type: 'ACCEPT_TRADE' });
    expect(s.pendingTrade).toBeNull();
    expect(s.properties.rupsha.ownerId).toBe('p2');
    expect(s.properties.rail.ownerId).toBe('p1');
    expect(s.players[0].cash).toBe(14900);
    expect(s.players[1].cash).toBe(15100);
    assertOwnershipConsistent(s);
  });

  it('changes nothing when rejected', () => {
    const s = run(setup(), offer(), { type: 'REJECT_TRADE' });
    expect(s.properties.rupsha.ownerId).toBe('p1');
    expect(s.players[0].cash).toBe(15000);
  });

  it('rejects invalid offers', () => {
    const s = setup();
    rejected(s, offer({ toId: 'p1' }));
    rejected(s, offer({ offerCash: 999999 }));
    rejected(s, offer({ requestCash: -5 }));
    rejected(s, offer({ offerCash: 0, offerProperties: [], requestProperties: [] }));
    rejected(s, offer({ offerProperties: ['sabujbag'] })); // not owned
    rejected(run(s, mortgage('rupsha')), offer());
    rejected(patch(s, (d) => { d.phase = 'buy'; }), offer());
  });

  it('rejects groups with buildings', () => {
    const s = run(brown(), house('rupsha'));
    rejected(s, offer({ offerProperties: ['sabujbag'], requestProperties: [] }));
  });
});

describe('debt and bankruptcy', () => {
  /** P1 at Start with little cash, P2 owns Sabujbag (rent 50) which P1 is about to hit. */
  const owing = (cash: number, players = 2) =>
    patch(own(own(newGame(players), 1, 'sabujbag'), 0, 'rupsha'), (d) => { d.players[0].cash = cash; });

  it('records a debt instead of going straight to bankruptcy', () => {
    const s = run(owing(30), roll(1, 2));
    expect(s.debts).toEqual([{ debtorId: 'p1', creditorId: 'p2', amount: 50, reason: 'rent' }]);
    expect(s.players[0].bankrupt).toBe(false);
    expect(s.players[0].cash).toBe(30);
    expect(s.phase).toBe('end');
    rejected(s, { type: 'END_TURN' });
    rejected(s, { type: 'PAY_DEBT' });
  });

  it('lets the debtor mortgage, then pay', () => {
    let s = run(owing(30), roll(1, 2), mortgage('rupsha'));
    expect(s.players[0].cash).toBe(330);
    rejected(s, { type: 'DECLARE_BANKRUPTCY' }); // can pay now
    s = run(s, { type: 'PAY_DEBT' });
    expect(s.debts).toEqual([]);
    expect(s.players[0].cash).toBe(280);
    expect(s.players[1].cash).toBe(15050);
    s = run(s, { type: 'END_TURN' });
    expect(s.currentPlayerIndex).toBe(1);
  });

  it('bankruptcy gives everything to the creditor and play continues', () => {
    let s = run(owing(30, 3), roll(1, 2), { type: 'DECLARE_BANKRUPTCY' });
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.players[1].cash).toBe(15030);
    expect(s.properties.rupsha.ownerId).toBe('p2');
    expect(s.debts).toEqual([]);
    assertOwnershipConsistent(s);
    s = run(s, { type: 'END_TURN' });
    expect(s.currentPlayerIndex).toBe(1);
  });

  it('declares the last solvent player the winner', () => {
    const s = run(owing(30), roll(1, 2), { type: 'DECLARE_BANKRUPTCY' });
    expect(s.phase).toBe('gameOver');
    expect(s.winnerId).toBe('p2');
  });

  it('sells buildings on bankruptcy and passes the cash to the creditor', () => {
    let s = own(brown(), 1, 'nilachal'); // rent 80
    s = patch(s, (d) => {
      d.players[0].position = 3;
      d.players[0].cash = 0;
      d.properties.rupsha.houses = 1;
      d.properties.sabujbag.houses = 1;
    });
    expect(maxRaisableCash(s, s.players[0])).toBe(500 + 600); // houses + mortgages
    s = run(s, roll(1, 2), { type: 'DECLARE_BANKRUPTCY' });
    expect(s.players[1].cash).toBe(15500);
    expect(s.properties.rupsha).toMatchObject({ ownerId: 'p2', houses: 0 });
  });

  it('bankruptcy to the bank returns properties to the bank', () => {
    let s = patch(own(newGame(3), 0, 'rupsha'), (d) => { d.players[0].position = 1; d.players[0].cash = 100; });
    s = run(s, roll(1, 2), { type: 'DECLARE_BANKRUPTCY' }); // income tax 1000
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.properties.rupsha.ownerId).toBeNull();
  });

  it('queues several debts and lets a non-current debtor act', () => {
    // P1 draws "pay each player 250" with only 100 cash.
    let s = patch(newGame(3), (d) => {
      d.players[0].position = 4;
      d.players[0].cash = 100;
      d.chanceDeck = ['chance-13', ...d.chanceDeck.filter((c) => c !== 'chance-13')];
    });
    s = run(s, roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(s.debts.map((d) => d.creditorId)).toEqual(['p2', 'p3']);

    // P2 draws "collect 200 from each": P3 is broke but owns a property.
    let c = own(newGame(3), 2, 'rail');
    c = patch(c, (d) => {
      d.players[0].position = 4;
      d.players[2].cash = 0;
      d.chanceDeck = ['chance-6', ...d.chanceDeck.filter((x) => x !== 'chance-6')];
    });
    c = run(c, roll(1, 2), { type: 'RESOLVE_CARD' });
    expect(c.debts).toEqual([{ debtorId: 'p3', creditorId: 'p1', amount: 200, reason: 'other' }]);
    rejected(c, { type: 'END_TURN' });
    c = run(c, mortgage('rail'), { type: 'PAY_DEBT' });
    expect(c.players[2].cash).toBe(800);
    expect(c.players[0].cash).toBe(15000 + 200 + 200);
  });

  it('an unaffordable forced jail fine becomes a debt and the player still moves', () => {
    let s = patch(newGame(), (d) => {
      d.players[0].position = JAIL_INDEX;
      d.players[0].inJail = true;
      d.players[0].jailTurns = 2;
      d.players[0].cash = 100;
    });
    s = run(s, roll(1, 2));
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].position).toBe(13);
    expect(s.debts).toEqual([{ debtorId: 'p1', creditorId: null, amount: 500, reason: 'other' }]);
    rejected(s, { type: 'BUY' }); // must settle the debt first
  });
});
