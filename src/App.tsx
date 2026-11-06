import { Volume2, VolumeX } from 'lucide-react';
import { useEffect } from 'react';
import { Game } from './pages/Game';
import { ONLINE_ENABLED } from './config';
import { Home } from './pages/Home';
import { OnlineLobby } from './pages/OnlineLobby';
import { resumeOnlineSession, useOnlineStore } from './store/onlineStore';
import { useGameStore } from './store/gameStore';
import type { Lang } from './types/game';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'bn', label: 'বাংলা' },
  { id: 'en', label: 'English' },
];

export default function App() {
  const game = useGameStore((s) => s.game);
  const sessionId = useGameStore((s) => s.sessionId);
  const lang = useGameStore((s) => s.lang);
  const setLang = useGameStore((s) => s.setLang);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const online = useOnlineStore((s) => s.active);

  // Rejoin an online room after a refresh, or open the join form from an invite link.
  useEffect(() => {
    if (ONLINE_ENABLED) resumeOnlineSession();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="min-h-screen">
      <div className="flex justify-end gap-1 px-3 pt-3">
        <button
          type="button"
          onClick={toggleMute}
          aria-label="sound"
          title={muted ? 'Sound off' : 'Sound on'}
          className="mr-1 rounded-full bg-white px-3 py-1 text-sm ring-1 ring-stone-300"
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </button>
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${lang === l.id ? 'bg-emerald-700 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-300'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {game ? <Game key={sessionId} game={game} /> : online ? <OnlineLobby /> : <Home />}
    </div>
  );
}
