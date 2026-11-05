import { randomBytes, randomInt } from 'node:crypto';

/** No O/0, I/1/L to avoid confusion when codes are read aloud or typed. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function roomCode(length = 6): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

export function secretToken(): string {
  return randomBytes(18).toString('base64url');
}

/** Cryptographically strong replacement for Math.random, used for dice and shuffles. */
export function secureRandom(): number {
  return randomInt(0, 2 ** 32) / 2 ** 32;
}
