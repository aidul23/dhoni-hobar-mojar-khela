import { useEffect, useState } from 'react';
import { BOARD, BOARD_SIZE } from '../../data/board';
import { PROPERTIES } from '../../data/properties';
import { PLAYER_COLORS, TOKENS } from '../../data/tokens';
import { buildSettings, createGame } from '../../engine/setup';
import { addLog } from '../../engine/state';
import { useAnimatedPositions } from '../../hooks/useAnimatedPositions';
import type { GameState, Lang } from '../../types/game';
import { formatNumber } from '../../utils/currency';
import { Board } from '../Board/Board';

const TURN_MS = 3200;
const ROLL_MS = 700;
/** Once this many properties are owned, the demo clears the board and starts over. */
const MAX_OWNED = 14;

const roll = (): [number, number] => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];

function newDemo(playerLabel: string): GameState {
  const players = [0, 1, 2].map((i) => ({
    name: `${playerLabel} ${formatNumber(i + 1)}`,
    color: PLAYER_COLORS[i],
    token: TOKENS[i],
  }));
  return createGame(players, buildSettings('classic', 15000));
}

/** One demo turn: roll, walk, and buy the property landed on if it's free. */
function playTurn(prev: GameState, dice: [number, number]): GameState {
  const s = structuredClone(prev);
  const owned = Object.values(s.properties).filter((p) => p.ownerId).length;
  if (owned >= MAX_OWNED) {
    for (const p of Object.values(s.properties)) Object.assign(p, { ownerId: null, houses: 0, hotel: false });
    for (const pl of s.players) pl.properties = [];
  }

  const player = s.players[s.currentPlayerIndex];
  player.position = (player.position + dice[0] + dice[1]) % BOARD_SIZE;
  s.dice = dice;
  addLog(s, 'rolled', { player: player.name, d1: dice[0], d2: dice[1], total: dice[0] + dice[1] });

  const propId = BOARD[player.position].propertyId;
  const prop = propId ? s.properties[propId] : null;
  if (propId && prop && !prop.ownerId) {
    prop.ownerId = player.id;
    player.properties.push(propId);
    addLog(s, 'bought', { player: player.name, space: player.position, amount: PROPERTIES[propId].price });
  } else if (propId && prop?.ownerId === player.id && PROPERTIES[propId].kind === 'street' && prop.houses < 4) {
    prop.houses += 1;
  }

  s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;
  addLog(s, 'turnStart', { player: s.players[s.currentPlayerIndex].name });
  return s;
}

/** A self-playing board for the home page: tokens roll, walk and buy land on their own. */
export function DemoBoard({ lang, playerLabel }: { lang: Lang; playerLabel: string }) {
  const [game, setGame] = useState(() => newDemo(playerLabel));
  const [rolling, setRolling] = useState(false);
  const [faces, setFaces] = useState<[number, number]>([3, 5]);
  const { positions } = useAnimatedPositions(game.players, rolling);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let spin: number | undefined;
    let land: number | undefined;
    const turn = window.setInterval(() => {
      if (document.hidden) return;
      setRolling(true);
      spin = window.setInterval(() => setFaces(roll()), 90);
      land = window.setTimeout(() => {
        window.clearInterval(spin);
        const dice = roll();
        setFaces(dice);
        setRolling(false);
        setGame((g) => playTurn(g, dice));
      }, ROLL_MS);
    }, TURN_MS);
    return () => {
      window.clearInterval(turn);
      window.clearInterval(spin);
      window.clearTimeout(land);
    };
  }, []);

  return (
    <div className="pointer-events-none select-none [perspective:1600px]" aria-hidden inert>
      <div className="demo-tilt">
        <Board
          game={game}
          lang={lang}
          positions={positions}
          faces={faces}
          rolling={rolling}
          spotlight={null}
          onSelectProperty={() => {}}
        />
      </div>
    </div>
  );
}
