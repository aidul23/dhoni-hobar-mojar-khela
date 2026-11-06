import { BOARD } from '../../data/board';
import type { GameState, Lang } from '../../types/game';
import { BoardCenter } from './BoardCenter';
import { BoardSpace } from './BoardSpace';

interface Props {
  game: GameState;
  lang: Lang;
  positions: Record<string, number>;
  faces: [number, number];
  rolling: boolean;
  onSelectProperty: (id: string) => void;
}

const TRACK = '1.55fr repeat(9, 1fr) 1.55fr';

export function Board({ game, lang, positions, faces, rolling, onSelectProperty }: Props) {
  const active = game.players.filter((p) => !p.bankrupt);
  const current = game.players[game.currentPlayerIndex];

  return (
    <div className="@container mx-auto aspect-square w-full max-w-[min(100%,calc(100vh-5.5rem))]">
      {/* The striped rickshaw-backboard frame wraps the board. */}
      <div className="rickshaw-frame h-full w-full rounded-[2.2cqw] p-[1cqw] shadow-[0_0.8cqw_0_#7f1d1d,0_2cqw_3cqw_rgba(0,0,0,0.25)]">
      <div
        className="grid h-full w-full overflow-hidden rounded-[1.4cqw] border-[0.5cqw] border-white bg-white shadow-2xl"
        style={{ gridTemplateColumns: TRACK, gridTemplateRows: TRACK }}
      >
        {BOARD.map((space) => (
          <BoardSpace
            key={space.index}
            space={space}
            game={game}
            lang={lang}
            tokens={active.filter((p) => positions[p.id] === space.index)}
            highlighted={positions[current.id] === space.index}
            onSelectProperty={onSelectProperty}
          />
        ))}
        <BoardCenter game={game} lang={lang} faces={faces} rolling={rolling} />
      </div>
      </div>
    </div>
  );
}
