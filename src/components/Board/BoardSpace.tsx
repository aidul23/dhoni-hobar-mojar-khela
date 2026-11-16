import { PROPERTIES, GROUP_COLORS } from '../../data/properties';
import { Hotel, House } from 'lucide-react';
import { SPACE_ICONS } from './spaceIcons';
import { getPrice } from '../../engine/property';
import type { GameState, Lang, Player, SpaceDef } from '../../types/game';
import type { CSSProperties } from 'react';
import { formatMoney, formatNumber } from '../../utils/currency';
import { CONTENT_OFFSET, gridCell, OWNER_POSITION, STRIP_ALIGN, STRIP_POSITION, type Side } from './boardLayout';

/**
 * Building badge drawn on the colour strip: a house icon with a count, or a hotel icon.
 * On the left/right edges the strip is vertical, so the badge stacks.
 */
function Buildings({ houses, hotel, vertical }: { houses: number; hotel: boolean; vertical: boolean }) {
  if (!hotel && houses === 0) return null;
  const Icon = hotel ? Hotel : House;
  return (
    <span
      key={hotel ? 'hotel' : houses}
      className={`animate-pop flex items-center justify-center rounded-[0.4cqw] bg-white/95 px-[0.25cqw] py-[0.15cqw] font-bold leading-none shadow ${vertical ? 'flex-col' : 'gap-[0.15cqw]'} ${hotel ? 'text-rose-700' : 'text-emerald-800'}`}
      title={hotel ? 'Hotel' : formatNumber(houses)}
    >
      <Icon className="h-[1.5cqw] w-[1.5cqw]" strokeWidth={2.6} aria-hidden />
      {!hotel && <span className="text-[1.25cqw]">{formatNumber(houses)}</span>}
    </span>
  );
}

/** Long English words (e.g. "Krishnachura") can't wrap, so they get a slightly smaller font. */
function nameSize(name: string): string {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length));
  if (longest >= 11) return 'text-[1.2cqw]';
  if (longest >= 9) return 'text-[1.35cqw]';
  return 'text-[1.5cqw]';
}

interface Props {
  space: SpaceDef;
  game: GameState;
  lang: Lang;
  tokens: Player[];
  highlighted: boolean;
  /** A player whose properties are being spotlighted; everything else fades. */
  spotlight: string | null;
  onSelectProperty: (id: string) => void;
}

/** A small square sticker with the owner's token, so ownership never depends on colour alone. */
function OwnerSticker({ owner, side }: { owner: Player; side: Side }) {
  return (
    <span
      key={owner.id}
      className={`animate-pop absolute z-[3] flex h-[2.3cqw] w-[2.3cqw] items-center justify-center rounded-[0.5cqw] border-[0.25cqw] bg-white text-[1.4cqw] leading-none shadow ${OWNER_POSITION[side]}`}
      style={{ borderColor: owner.color }}
      title={owner.name}
    >
      {owner.token}
    </span>
  );
}

export function BoardSpace({ space, game, lang, tokens, highlighted, spotlight, onSelectProperty }: Props) {
  const { row, col, side } = gridCell(space.index);
  const propId = space.propertyId;
  const def = propId ? PROPERTIES[propId] : null;
  const state = propId ? game.properties[propId] : null;
  const owner = state?.ownerId ? game.players.find((p) => p.id === state.ownerId) : null;
  const icon = SPACE_ICONS[propId ?? space.type];
  const name = lang === 'bn' ? space.nameBn : space.nameEn;
  const isCorner = side === 'corner';
  const lit = spotlight !== null && owner?.id === spotlight;
  const faded = spotlight !== null && !lit;

  return (
    <div
      key={owner?.id ?? 'unowned'}
      className={`relative flex flex-col items-center justify-center overflow-hidden border ${owner ? 'animate-glow' : ''} border-stone-400/70 bg-[#fdfaf0] text-center leading-tight transition
        ${def ? 'cursor-pointer hover:brightness-95' : ''}
        ${state?.mortgaged && !faded ? 'opacity-50' : ''}
        ${faded ? 'opacity-25 grayscale' : ''}
        ${lit ? 'z-10 ring-[0.4cqw] ring-inset' : ''}
        ${highlighted && !lit ? 'z-10 ring-2 ring-amber-400 ring-inset' : ''}`}
      style={{
        gridRow: row,
        gridColumn: col,
        // A pale wash of the owner's colour: noticeable, but too light to mix up with a group strip.
        ...(owner ? { background: `color-mix(in srgb, ${owner.color} 14%, #fdfaf0)` } : {}),
        ...(lit ? { '--tw-ring-color': owner!.color } as CSSProperties : {}),
      }}
      onClick={propId ? () => onSelectProperty(propId) : undefined}
      title={name}
    >
      {def?.kind === 'street' && (
        <div
          className={`absolute z-[1] flex items-center ${STRIP_ALIGN[side]} ${STRIP_POSITION[side]}`}
          style={{ background: GROUP_COLORS[def.group] }}
        >
          <Buildings houses={state!.houses} hotel={state!.hotel} vertical={side === 'left' || side === 'right'} />
        </div>
      )}

      <div className={`flex flex-col items-center px-[3%] ${isCorner ? 'gap-[0.3cqw]' : 'gap-[0.15cqw]'} ${CONTENT_OFFSET[side]}`}>
        {icon && (
          <icon.Icon
            className={isCorner ? 'h-[4cqw] w-[4cqw]' : 'h-[2.3cqw] w-[2.3cqw]'}
            style={{ color: icon.color }}
            strokeWidth={2.2}
            aria-hidden
          />
        )}
        <span className={`max-w-full font-bold leading-[1.1] text-stone-900 hyphens-auto ${isCorner ? 'text-[2cqw]' : lang === 'en' ? nameSize(name) : 'text-[1.5cqw]'}`}>{name}</span>
        {def && !owner && (
          <span className="text-[1.35cqw] font-semibold text-stone-600">{formatMoney(getPrice(game.settings, def.id))}</span>
        )}
        {space.taxAmount && <span className="text-[1.35cqw] font-semibold text-rose-700">{formatMoney(space.taxAmount)}</span>}
      </div>

      {owner && <OwnerSticker owner={owner} side={side} />}

      {tokens.length > 0 && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-[2] flex flex-wrap items-end justify-center gap-[0.2cqw] px-[4%] ${
            // Top-row colour strips sit on the bottom edge, so tokens rest just above them.
            side === 'top' ? 'bottom-[24%]' : side === 'corner' ? 'bottom-[5%]' : 'bottom-[8%]'
          }`}
        >
          {tokens.map((p) => (
            <span
              key={`${p.id}-${space.index}`}
              className="animate-hop flex h-[3.2cqw] w-[3.2cqw] items-center justify-center rounded-full border-2 bg-white text-[2cqw] shadow-md"
              style={{ borderColor: p.color }}
              title={p.name}
            >
              {p.token}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
