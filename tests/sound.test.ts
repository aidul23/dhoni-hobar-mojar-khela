import { describe, expect, it } from 'vitest';
import { soundForEvents } from '../src/utils/sound';

const rent = { key: 'paidRent', params: { payerId: 'p1', payeeId: 'p2' } };

describe('soundForEvents', () => {
  it('plays a sad sound for the payer and a happy one for the owner online', () => {
    expect(soundForEvents([rent], 'p1')).toBe('rentPaid');
    expect(soundForEvents([rent], 'p2')).toBe('rentGot');
  });

  it('plays the combined rent sound on a shared screen or for onlookers', () => {
    expect(soundForEvents([rent], null)).toBe('rent');
    expect(soundForEvents([rent], 'p3')).toBe('rent');
  });

  it('prefers jail over other events in the same batch', () => {
    expect(soundForEvents([{ key: 'rolledDoubles', params: {} }, { key: 'wentToJail', params: {} }])).toBe('jail');
  });

  it('returns null for silent events', () => {
    expect(soundForEvents([{ key: 'landed', params: {} }])).toBeNull();
  });
});
