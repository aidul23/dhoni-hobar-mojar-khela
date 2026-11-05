export type Rng = () => number;

export function rollDie(rng: Rng = Math.random): number {
  return Math.floor(rng() * 6) + 1;
}

export function rollDice(rng: Rng = Math.random): [number, number] {
  return [rollDie(rng), rollDie(rng)];
}

export function isDoubles(dice: [number, number]): boolean {
  return dice[0] === dice[1];
}

export function isValidDice(dice: unknown): dice is [number, number] {
  return (
    Array.isArray(dice) &&
    dice.length === 2 &&
    dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)
  );
}
