import type { Lang } from '../types/game';

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

/**
 * The language numbers are shown in. Kept here (set by the store when the language
 * changes) so the many formatMoney/formatNumber calls don't each need a `lang` argument.
 */
let displayLang: Lang = 'bn';

export function setNumberLanguage(lang: Lang): void {
  displayLang = lang;
}

/** Replaces 0-9 with Bengali digits when showing Bangla. */
export function localizeDigits(text: string, lang: Lang = displayLang): string {
  return lang === 'bn' ? text.replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]) : text;
}

/** 1500 -> "1,500" (English) or "১,৫০০" (Bangla). */
export function formatNumber(n: number, lang: Lang = displayLang): string {
  return localizeDigits(Math.round(n).toLocaleString('en-US'), lang);
}

/** Formats a taka amount: 1500 -> "৳1,500" (English) or "৳১,৫০০" (Bangla). */
export function formatMoney(amount: number, lang: Lang = displayLang): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}৳${formatNumber(Math.abs(amount), lang)}`;
}
