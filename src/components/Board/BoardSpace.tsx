import { PROPERTIES, GROUP_COLORS } from '../../data/properties';
import { SPACE_ICONS } from '../../data/tokens';
import { getPrice } from '../../engine/property';
import type { GameState, Lang, Player, SpaceDef } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { gridCell, OWNER_POSITION, STRIP_POSITION } from './boardLayout';

/**
 * Building badge drawn on the colour strip: 🏠 with a count for houses, 🏨 for a hotel.
 * On the left/right edges the strip is vertical, so the badge stacks.
 */
function Buildings({ houses, hotel, vertical }: { houses: number; hotel: boolean; vertical: boolean }) {
  if (!hotel && houses === 0) return null;
  return (
    <span
      key={hotel ? 'hotel' : houses}
      className={`animate-pop flex items-center justify-center rounded-[0.4cqw] bg-white/95 px-[0.2cqw] font-bold leading-none shadow ${vertical ? 'flex-col py-[0.2cqw]' : 'gap-[0.1cqw]'} ${hotel ? 'text-rose-700' : 'text-emerald-800'}`}
      title={hotel ? '🏨' : `🏠 × ${houses}`}
    >
      <span className="text-[1.25cqw]">{hotel ? '🏨' : '🏠'}</span>
      {!hotel && <span className="text-[1.05cqw]">{houses}</span>}
    </span>
  );
}

interface Props {
  space: SpaceDef;
  game: GameState;
  lang: Lang;
  tokens: Player[];
  highlighted: boolean;
  onSelectProperty: (id: string) => void;
}

export function BoardSpace({ space, game, lang, tokens, highlighted, onSelectProperty }: Props) {
  const { row, col, side } = gridCell(space.index);
  const propId = space.propertyId;
  const def = propId ? PROPERTIES[propId] : null;
  const state = propId ? game.properties[propId] : null;
  const owner = state?.ownerId ? game.players.find((p) => p.id === state.ownerId) : null;
  const icon = SPACE_ICONS[propId ?? space.type];
  const name = lang === 'bn' ? space.nameBn : space.nameEn;
  const isCorner = side === 'corner';

  return (
    <div
      key={owner?.id ?? 'unowned'}
      className={`relative flex flex-col items-center justify-center overflow-hidden border ${owner ? 'animate-glow' : ''} border-stone-400/70 bg-[#fdfaf0] text-center leading-tight transition
        ${def ? 'cursor-pointer hover:brightness-95' : ''}
        ${state?.mortgaged ? 'opacity-50' : ''}
        ${highlighted ? 'z-10 ring-2 ring-amber-400 ring-inset' : ''}`}
      style={{ gridRow: row, gridColumn: col }}
      onClick={propId ? () => onSelectProperty(propId) : undefined}
      title={name}
    >
      {def?.kind === 'street' && (
        <div
          className={`absolute z-[1] flex items-center justify-center ${STRIP_POSITION[side]}`}
          style={{ background: GROUP_COLORS[def.group] }}
        >
          <Buildings houses={state!.houses} hotel={state!.hotel} vertical={side === 'left' || side === 'right'} />
        </div>
      )}

      <div className={`flex flex-col items-center px-[4%] ${isCorner ? 'gap-[0.3cqw]' : ''}`}>
        {icon && <span className={isCorner ? 'text-[3.4cqw]' : 'text-[1.9cqw]'}>{icon}</span>}
        <span className={`font-semibold text-stone-800 ${isCorner ? 'text-[1.5cqw]' : 'text-[1.1cqw]'}`}>{name}</span>
        {def && !owner && (
          <span className="text-[1cqw] text-stone-500">{formatMoney(getPrice(game.settings, def.id))}</span>
        )}
        {space.taxAmount && <span className="text-[1cqw] text-rose-700">{formatMoney(space.taxAmount)}</span>}
      </div>

      {owner && (
        <div
          key={owner.id}
          className={`animate-pop absolute ${OWNER_POSITION[side]}`}
          style={{ background: owner.color }}
          title={owner.name}
        />
      )}

      {tokens.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-wrap items-end justify-center gap-[0.2cqw] px-[4%]">
          {tokens.map((p) => (
            <span
              key={`${p.id}-${space.index}`}
              className="animate-hop flex h-[2.8cqw] w-[2.8cqw] items-center justify-center rounded-full border-2 bg-white text-[1.7cqw] shadow-md"
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
