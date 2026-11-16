/**
 * Funny cartoon sound effects.
 *
 * Every sound is synthesized with the Web Audio API, so the game works with no audio files.
 * To replace one with a real clip (a recorded voice line, a meme sound…), drop a file named
 * after the sound into `public/sounds/`, e.g. `public/sounds/jail.mp3`. If it exists it is
 * played instead of the synthesized version.
 */
export type SoundName =
  | 'dice' | 'buy' | 'pay' | 'gain' | 'card' | 'jail' | 'jailFree' | 'build' | 'bankrupt' | 'win'
  | 'debt' | 'trade' | 'turn' | 'rentPaid' | 'rentGot' | 'rent' | 'tax' | 'doubles' | 'passStart';

export const SOUND_NAMES: SoundName[] = [
  'dice', 'buy', 'pay', 'gain', 'card', 'jail', 'jailFree', 'build', 'bankrupt', 'win',
  'debt', 'trade', 'turn', 'rentPaid', 'rentGot', 'rent', 'tax', 'doubles', 'passStart',
];

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  /** Glide to this frequency over the tone's duration. */
  slideTo?: number;
  /** Vibrato rate (Hz) and depth (Hz), for wobbly trombones and sirens. */
  vibrato?: [number, number];
}

function tone(freq: number, at: number, dur: number, opts: ToneOpts = {}) {
  const { type = 'sine', vol = 0.12, slideTo, vibrato } = opts;
  const ac = audio();
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  if (vibrato) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = vibrato[0];
    depth.gain.value = vibrato[1];
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.02);
  }
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.setValueAtTime(vol, t + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(at: number, dur: number, vol = 0.12, freq = 2500) {
  const ac = audio();
  const t = ac.currentTime + at;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t);
}

/** A metallic "ting": a bell partial stack. */
function bell(freq: number, at: number, vol = 0.08, dur = 0.5) {
  [1, 2.76, 5.4].forEach((m, i) => tone(freq * m, at, dur / (i + 1), { vol: vol / (i + 1) }));
}

/** "Cha-ching!": drawer slam, then the register bell. */
function chaChing(at = 0) {
  noise(at, 0.08, 0.3, 900);
  noise(at + 0.07, 0.05, 0.2, 5000);
  bell(1568, at + 0.14, 0.09, 0.6);
  bell(2093, at + 0.22, 0.08, 0.7);
}

/** "Wah wah wah waaah": the sad trombone. */
function sadTrombone(at = 0) {
  const o = { type: 'sawtooth' as const, vol: 0.05 };
  tone(392, at, 0.3, o);
  tone(370, at + 0.32, 0.3, o);
  tone(349, at + 0.64, 0.3, o);
  tone(330, at + 0.96, 0.9, { ...o, vibrato: [6, 8] });
}

/** Rickshaw bell: "kring kring". */
function rickshawBell(at = 0) {
  for (let i = 0; i < 2; i++) {
    const t = at + i * 0.22;
    for (let k = 0; k < 4; k++) bell(2400 + (k % 2) * 180, t + k * 0.035, 0.05, 0.25);
  }
}

const SOUNDS: Record<SoundName, () => void> = {
  dice: () => [0, 0.09, 0.19, 0.3, 0.43, 0.58].forEach((at, i) => noise(at, 0.05, 0.25, 1800 + i * 250)),
  buy: () => chaChing(),
  pay: () => { tone(440, 0, 0.14, { type: 'triangle' }); tone(330, 0.12, 0.24, { type: 'triangle' }); },
  gain: () => [0, 0.06, 0.12].forEach((at, i) => bell(1319 + i * 200, at, 0.07, 0.3)),
  // Drum roll building suspense, then a "ta-da" ting.
  card: () => {
    for (let i = 0; i < 10; i++) noise(i * 0.04, 0.04, 0.12 + i * 0.012, 300);
    bell(1047, 0.42, 0.08, 0.5);
  },
  // Police siren "wee-woo wee-woo", then the cell door slams shut.
  jail: () => {
    for (let i = 0; i < 2; i++) {
      tone(700, i * 0.5, 0.25, { type: 'square', vol: 0.045, slideTo: 1000 });
      tone(1000, i * 0.5 + 0.25, 0.25, { type: 'square', vol: 0.045, slideTo: 700 });
    }
    noise(1.05, 0.25, 0.45, 400);
    tone(90, 1.05, 0.35, { type: 'square', vol: 0.1, slideTo: 60 });
  },
  // Slide whistle up: "wheee, free!"
  jailFree: () => {
    tone(400, 0, 0.55, { vol: 0.12, slideTo: 1600, vibrato: [12, 15] });
    bell(1568, 0.55, 0.07, 0.4);
  },
  // Hammer knocks.
  build: () => [0, 0.16, 0.32].forEach((at) => { noise(at, 0.05, 0.35, 700); tone(180, at, 0.08, { type: 'triangle', vol: 0.1 }); }),
  // Balloon deflating, then a thud.
  bankrupt: () => {
    tone(900, 0, 1.1, { type: 'sawtooth', vol: 0.04, slideTo: 80, vibrato: [18, 40] });
    noise(1.1, 0.2, 0.4, 150);
  },
  win: () => {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.13, 0.18, { type: 'triangle' }));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.42, 0.7, { type: 'triangle', vol: 0.07 }));
    rickshawBell(1.0);
  },
  // Old car horn "aa-oo-gah".
  debt: () => {
    tone(220, 0, 0.25, { type: 'sawtooth', vol: 0.07, slideTo: 330 });
    tone(330, 0.25, 0.35, { type: 'sawtooth', vol: 0.07, slideTo: 200 });
  },
  turn: () => rickshawBell(),
  trade: () => { tone(587, 0, 0.1); tone(740, 0.09, 0.1); tone(880, 0.18, 0.2); },
  rentPaid: () => sadTrombone(),
  rentGot: () => chaChing(),
  // Same screen for everyone: one player's loss is another's gain.
  rent: () => { sadTrombone(); chaChing(1.9); },
  // Slide whistle falling: "pyuuuu" — the taxman takes his cut.
  tax: () => {
    tone(1400, 0, 0.6, { vol: 0.11, slideTo: 300, vibrato: [10, 20] });
    noise(0.6, 0.12, 0.3, 250);
  },
  // Spring "boing!"
  doubles: () => tone(180, 0, 0.45, { type: 'triangle', vol: 0.15, slideTo: 520, vibrato: [25, 60] }),
  // Coin shower.
  passStart: () => { for (let i = 0; i < 7; i++) bell(1800 + ((i * 337) % 600), i * 0.07, 0.05, 0.3); },
};

/** Clips found in `public/sounds/`; null = checked and not there. */
const clips: Partial<Record<SoundName, HTMLAudioElement | null>> = {};
let probed = false;

/** Looks for override clips once. Only real audio counts: dev servers answer missing files with HTML. */
function probeClips() {
  if (probed || typeof fetch === 'undefined') return;
  probed = true;
  for (const name of SOUND_NAMES) {
    const url = `${import.meta.env.BASE_URL}sounds/${name}.mp3`;
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        clips[name] = r.ok && r.headers.get('content-type')?.startsWith('audio/') ? new Audio(url) : null;
      })
      .catch(() => { clips[name] = null; });
  }
}

export function playSound(name: SoundName, muted: boolean): void {
  if (typeof window === 'undefined') return;
  probeClips();
  if (muted) return;
  try {
    const clip = clips[name];
    if (clip) {
      clip.currentTime = 0;
      void clip.play().catch(() => SOUNDS[name]());
      return;
    }
    SOUNDS[name]();
  } catch {
    // Audio unavailable (e.g. blocked by the browser): play silently.
  }
}

interface SoundEvent {
  key: string;
  params: Record<string, unknown>;
}

/** Log keys → sound, in priority order (the first match among new events wins). */
const LOG_SOUNDS: [SoundName, string[]][] = [
  ['win', ['winner', 'winnerByOwnership', 'winnerByTurnLimit']],
  ['bankrupt', ['bankrupt']],
  ['jail', ['wentToJail']],
  ['debt', ['inDebt']],
  ['rent', ['paidRent']],
  ['jailFree', ['jailDoubles', 'jailUsedCard', 'jailPaidFine']],
  ['card', ['drewCard']],
  ['tax', ['paidTax']],
  ['trade', ['tradeAccepted']],
  ['buy', ['bought']],
  ['build', ['builtHouse', 'builtHotel']],
  ['passStart', ['passedStart']],
  ['doubles', ['rolledDoubles']],
  ['pay', ['cardPay', 'jailForcedFine', 'logUnmortgaged', 'debtPaid', 'paidTo']],
  ['gain', ['cardGain', 'logMortgaged', 'soldBuilding', 'gotJailCard']],
];

/**
 * Picks the sound for a batch of new log events. `myId` is this screen's player online
 * (null when everyone shares one screen), so paying rent and collecting it sound different.
 */
export function soundForEvents(events: SoundEvent[], myId: string | null = null): SoundName | null {
  const keys = events.map((e) => e.key);
  for (const [sound, matches] of LOG_SOUNDS) {
    if (!matches.some((k) => keys.includes(k))) continue;
    if (sound === 'rent' && myId) {
      const rent = events.find((e) => e.key === 'paidRent')!;
      if (rent.params.payerId === myId) return 'rentPaid';
      if (rent.params.payeeId === myId) return 'rentGot';
    }
    return sound;
  }
  return null;
}
