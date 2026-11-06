import { UserRound, Wifi, WifiOff } from 'lucide-react';
import { ArrowLeft, Check, Copy, Crown, Dices, Globe, Hourglass, KeyRound, LoaderCircle, Plus, ScrollText, Send, Share2, TriangleAlert, Users, X } from 'lucide-react';
import { IconText } from '../components/IconText';
import { useEffect, useState } from 'react';
import { Button } from '../components/Modal/Button';
import { DEFAULT_RULES, PlayerFields, RulesEditor, Section } from '../components/Setup/SetupParts';
import { PLAYER_COLORS, TOKENS } from '../data/tokens';
import type { RoomSnapshot } from '../net/protocol';
import { useT } from '../store/gameStore';
import { inviteLink, useOnlineStore } from '../store/onlineStore';
import type { PlayerSetup } from '../types/game';
import { formatMoney } from '../utils/currency';

const NAME_KEY = 'dhmk-online-player';
const MODE_KEY = { classic: 'modeClassic', fast: 'modeFast', custom: 'modeCustom' } as const;

/** The player's last used name/look, so they don't retype it every time. */
function loadPlayer(fallbackName: string): PlayerSetup {
  try {
    const saved = JSON.parse(localStorage.getItem(NAME_KEY) ?? 'null') as PlayerSetup | null;
    if (saved?.name && PLAYER_COLORS.includes(saved.color) && TOKENS.includes(saved.token)) return saved;
  } catch {
    // ignore
  }
  return { name: fallbackName, color: PLAYER_COLORS[0], token: TOKENS[0] };
}

function savePlayer(p: PlayerSetup) {
  try { localStorage.setItem(NAME_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function ConnectionBanner() {
  const t = useT();
  const status = useOnlineStore((s) => s.status);
  if (status === 'open' || status === 'idle') return null;
  return (
    <div className="rounded-lg bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
      <IconText icon={LoaderCircle} iconClassName="h-4 w-4 animate-spin">{t(status === 'connecting' ? 'connecting' : 'reconnecting')}</IconText>
    </div>
  );
}

function ErrorBanner() {
  const t = useT();
  const error = useOnlineStore((s) => s.error);
  const clear = useOnlineStore((s) => s.clearError);
  if (!error) return null;
  return (
    <button type="button" onClick={clear} className="w-full rounded-lg bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800">
      <span className="flex items-center justify-center gap-2"><TriangleAlert className="h-4 w-4" aria-hidden />{t(`error.${error}`)}<X className="h-4 w-4" aria-hidden /></span>
    </button>
  );
}

/** Before joining: pick a name/look, then create a room or join one by code. */
function JoinOrCreate() {
  const t = useT();
  const { inviteCode, createRoom, joinRoom, status } = useOnlineStore();
  const [player, setPlayer] = useState(() => loadPlayer(t('player') + ' 1'));
  const [code, setCode] = useState(inviteCode);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const connected = status === 'open';
  const nameOk = player.name.trim().length > 0;

  useEffect(() => setCode(inviteCode), [inviteCode]);

  const go = (fn: () => void) => {
    savePlayer(player);
    fn();
  };

  const joinCard = (
    <Section title={<IconText icon={KeyRound}>{t('joinRoom')}</IconText>}>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-stone-600">{t('roomCode')}</span>
        <input
          value={code}
          maxLength={6}
          autoCapitalize="characters"
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="ABC234"
          className="rounded-lg border border-stone-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.3em]"
        />
      </label>
      <Button
        className="mt-3 w-full"
        disabled={!connected || !nameOk || code.length < 6}
        onClick={() => go(() => joinRoom(code, player))}
      >
        {t('join')}
      </Button>
    </Section>
  );

  return (
    <>
      <Section title={<IconText icon={UserRound}>{t('yourPlayer')}</IconText>}>
        <PlayerFields player={player} onChange={(patch) => setPlayer((p) => ({ ...p, ...patch }))} />
      </Section>

      {inviteCode && joinCard}

      <Section title={<IconText icon={Plus}>{t('createRoom')}</IconText>}>
        <p className="text-sm text-stone-500">{t('createRoomHint')}</p>
      </Section>
      <RulesEditor rules={rules} onChange={setRules} />
      <Button
        className="w-full py-3 text-lg"
        disabled={!connected || !nameOk}
        onClick={() => go(() => createRoom(player, rules))}
      >
        <Dices className="h-5 w-5" aria-hidden /> {t('create')}
      </Button>

      {!inviteCode && joinCard}
    </>
  );
}

function InviteBox({ code }: { code: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const link = inviteLink(code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the link is visible and selectable anyway
    }
  };
  const share = () => navigator.share?.({ title: t('title'), text: t('inviteText', { code }), url: link }).catch(() => {});

  return (
    <Section title={<IconText icon={Send}>{t('shareInvite')}</IconText>}>
      <div className="text-center">
        <div className="text-sm text-stone-500">{t('roomCode')}</div>
        <div className="select-all font-mono text-4xl font-bold tracking-[0.3em] text-emerald-800">{code}</div>
      </div>
      <input readOnly value={link} onFocus={(e) => e.target.select()} className="mt-3 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600" />
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? t('copied') : t('copyLink')}
        </Button>
        {'share' in navigator && <Button variant="ghost" onClick={share}><Share2 className="h-4 w-4" aria-hidden /> {t('share')}</Button>}
      </div>
    </Section>
  );
}

/** In a room, before the game starts. */
function WaitingRoom({ room, mySeatId }: { room: RoomSnapshot; mySeatId: string }) {
  const t = useT();
  const { start, kick, updateSeat } = useOnlineStore();
  const isHost = room.hostSeat === mySeatId;
  const seats = room.seats.filter((s) => !s.left);
  const me = seats.find((s) => s.id === mySeatId);
  const [draft, setDraft] = useState<PlayerSetup | null>(null);
  const others = seats.filter((s) => s.id !== mySeatId);
  const editing = draft ?? (me ? { name: me.name, color: me.color, token: me.token } : null);
  const changed = draft && me && (draft.name !== me.name || draft.color !== me.color || draft.token !== me.token);

  return (
    <>
      <InviteBox code={room.code} />

      <Section title={<IconText icon={Users}>{t('playersInRoom', { n: seats.length })}</IconText>}>
        <ul className="space-y-2">
          {seats.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xl" style={{ borderColor: s.color }}>{s.token}</span>
              <span className="flex-1 font-semibold" style={{ color: s.color }}>
                {s.name}
                {s.id === mySeatId && <span className="ml-2 rounded bg-amber-200 px-1.5 text-xs text-stone-800">{t('you')}</span>}
                {s.id === room.hostSeat && <Crown className="ml-1 inline h-4 w-4 fill-amber-300 text-amber-600" aria-label={t('host')} />}
              </span>
              <IconText
                icon={s.connected ? Wifi : WifiOff}
                iconClassName="h-3.5 w-3.5"
                className={`text-xs ${s.connected ? 'text-emerald-600' : 'text-stone-400'}`}
              >
                {t(s.connected ? 'online' : 'offline')}
              </IconText>
              {isHost && s.id !== mySeatId && (
                <button type="button" onClick={() => kick(s.id)} className="rounded px-2 py-1 text-xs text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
                  {t('kick')}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-stone-500">
          <IconText icon={ScrollText}>
            {t(MODE_KEY[room.rules.mode])} · {formatMoney(room.rules.mode === 'fast' ? room.rules.startingCash + 5000 : room.rules.startingCash)}
          </IconText>
        </p>
      </Section>

      {editing && (
        <Section title={<IconText icon={UserRound}>{t('yourPlayer')}</IconText>}>
          <PlayerFields
            player={editing}
            onChange={(patch) => setDraft({ ...editing, ...patch })}
            taken={{ colors: others.map((s) => s.color), tokens: others.map((s) => s.token) }}
          />
          {changed && (
            <Button className="mt-3 w-full" onClick={() => { updateSeat(draft); savePlayer(draft); setDraft(null); }}>
              {t('saveLook')}
            </Button>
          )}
        </Section>
      )}

      {isHost ? (
        <>
          {seats.length < 2 && <p className="text-center text-sm text-stone-500">{t('needTwo')}</p>}
          <Button className="w-full py-3 text-xl" disabled={seats.length < 2} onClick={start}><Dices className="h-6 w-6" aria-hidden /> {t('startGame')}</Button>
        </>
      ) : (
        <p className="flex animate-pulse items-center justify-center gap-2 font-semibold text-stone-600"><Hourglass className="h-4 w-4" aria-hidden />{t('waitingForHost')}</p>
      )}
    </>
  );
}

export function OnlineLobby() {
  const t = useT();
  const { room, mySeatId, close } = useOnlineStore();

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-12">
      <header className="flex items-center gap-3">
        <button type="button" onClick={close} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold ring-1 ring-stone-300 hover:bg-stone-50">
          <IconText icon={ArrowLeft}>{room ? t('leaveRoom') : t('back')}</IconText>
        </button>
        <h1 className="flex flex-1 items-center justify-center gap-2 text-2xl font-bold text-emerald-800"><Globe className="h-6 w-6" aria-hidden />{t('onlineTitle')}</h1>
      </header>
      <ConnectionBanner />
      <ErrorBanner />
      {room && mySeatId ? <WaitingRoom room={room} mySeatId={mySeatId} /> : <JoinOrCreate />}
    </div>
  );
}
