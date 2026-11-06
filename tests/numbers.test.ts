import { describe, expect, it } from 'vitest';
import { formatMoney, formatNumber, localizeDigits } from '../src/utils/currency';
import { formatLog, t } from '../src/utils/translations';

describe('Bengali numbers', () => {
  it('formats money with Bengali digits in Bangla and Latin digits in English', () => {
    expect(formatMoney(15000, 'bn')).toBe('৳১৫,০০০');
    expect(formatMoney(15000, 'en')).toBe('৳15,000');
    expect(formatMoney(-350, 'bn')).toBe('-৳৩৫০');
    expect(formatNumber(1234567, 'bn')).toBe('১,২৩৪,৫৬৭');
    expect(localizeDigits('Room 12', 'bn')).toBe('Room ১২');
  });

  it('localizes numbers inside translated messages', () => {
    expect(t('bn', 'turnNo', { n: 12 })).toBe('চাল #১২');
    expect(t('en', 'turnNo', { n: 12 })).toBe('Turn #12');
  });

  it('keeps placeholders containing digits working (e.g. {d1})', () => {
    const entry = { id: 1, key: 'rolled', params: { player: 'Nasir', d1: 4, d2: 6, total: 10 } };
    expect(formatLog('bn', entry)).toBe('Nasir ১০ ফেলেছেন (৪ + ৬)।');
    expect(formatLog('en', entry)).toBe('Nasir rolled 10 (4 + 6).');
  });

  it('leaves player names exactly as typed', () => {
    const entry = { id: 1, key: 'paidRent', params: { payer: 'Nasir 2', owner: 'Aidul', amount: 350, space: 1 } };
    expect(formatLog('bn', entry)).toBe('Nasir 2 Aidul-কে ৳৩৫০ ভাড়া দিয়েছেন।');
  });

  it('converts amounts written inside Bangla card texts and templates', () => {
    const entry = { id: 1, key: 'drewCard', params: { player: 'A', deck: 'chance', card: 'chance-1' } };
    expect(formatLog('bn', entry)).toContain('৳৫০০');
    expect(t('bn', 'modeFastDesc')).toContain('৳৫,০০০');
  });
});
