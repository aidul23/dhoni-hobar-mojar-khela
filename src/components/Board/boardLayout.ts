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

/**
 * Owner sticker (the owner's token) sits at the start of the colour strip; buildings sit at its end.
 * Corners and other unownable spaces never show it.
 */
export const OWNER_POSITION: Record<Side, string> = {
  bottom: 'top-[2%] left-[4%]',
  top: 'bottom-[2%] left-[4%]',
  left: 'top-[4%] right-[1%]',
  right: 'top-[4%] left-[1%]',
  corner: 'hidden',
};

/** Pushes the building badge to the far end of the strip, away from the owner sticker. */
export const STRIP_ALIGN: Record<Side, string> = {
  bottom: 'justify-end pr-[4%]',
  top: 'justify-end pr-[4%]',
  left: 'flex-col justify-end pb-[4%]',
  right: 'flex-col justify-end pb-[4%]',
  corner: '',
};

/** Nudges a space's label away from its colour strip so the text keeps the full free area. */
export const CONTENT_OFFSET: Record<Side, string> = {
  bottom: 'mt-[18%]',
  top: 'mb-[18%]',
  left: 'mr-[12%]',
  right: 'ml-[12%]',
  corner: 'mb-[18%]',
};
