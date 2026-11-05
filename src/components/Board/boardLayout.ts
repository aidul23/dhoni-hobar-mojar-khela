export type Side = 'bottom' | 'left' | 'top' | 'right' | 'corner';

/** Maps a board index (0 = Start, bottom-right) to an 11×11 CSS grid cell. */
export function gridCell(index: number): { row: number; col: number; side: Side } {
  if (index % 10 === 0) {
    const corners = { 0: [11, 11], 10: [11, 1], 20: [1, 1], 30: [1, 11] } as const;
    const [row, col] = corners[index as 0 | 10 | 20 | 30];
    return { row, col, side: 'corner' };
  }
  if (index < 10) return { row: 11, col: 11 - index, side: 'bottom' };
  if (index < 20) return { row: 11 - (index - 10), col: 1, side: 'left' };
  if (index < 30) return { row: 1, col: 1 + (index - 20), side: 'top' };
  return { row: 1 + (index - 30), col: 11, side: 'right' };
}

/** Where the colour strip sits: on the edge facing the board centre. */
export const STRIP_POSITION: Record<Side, string> = {
  bottom: 'top-0 left-0 right-0 h-[22%]',
  top: 'bottom-0 left-0 right-0 h-[22%]',
  left: 'top-0 bottom-0 right-0 w-[16%]',
  right: 'top-0 bottom-0 left-0 w-[16%]',
  corner: 'hidden',
};

/** Owner marker sits on the outer edge, opposite the colour strip. */
export const OWNER_POSITION: Record<Side, string> = {
  bottom: 'bottom-0 left-0 right-0 h-[12%]',
  top: 'top-0 left-0 right-0 h-[12%]',
  left: 'top-0 bottom-0 left-0 w-[9%]',
  right: 'top-0 bottom-0 right-0 w-[9%]',
  corner: 'hidden',
};
