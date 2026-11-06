# ধনী হবার মজার খেলা (Dhoni Hobar Mojar Khela)

A Bengali property-trading board game for 2–4 players. React + TypeScript + Vite + Tailwind + Zustand.

```bash
npm install
npm run dev      # play at http://localhost:5173
npm test         # engine unit tests (Vitest)
npm run build    # typecheck + production build
```

## Hosting the offline version (static files)

The single-device game is plain HTML/JS/CSS after a build, so any web server can host it:
no Node process, no database.

```bash
npm ci
npm run build        # creates dist/
```

Copy the contents of `dist/` to your web server's folder. Unknown paths should fall back to
`index.html`. Example nginx site:

```nginx
server {
    listen 80;
    server_name game.example.com;
    root /var/www/dhoni-hobar/dist;
    index index.html;

    location /assets/ {            # file names contain a hash, safe to cache forever
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri /index.html;
    }
}
```

Online play is switched off in these builds: the button shows "শীঘ্রই আসছে" (coming soon).
To switch it on later, deploy the game server (see below) and build with
`VITE_ONLINE_ENABLED=true npm run build`.

## Online play

Friends can play from their own devices. The host creates a room and shares a link or 6-letter code;
no accounts are needed, and refreshing the page keeps your seat.

**Run locally (development)**: two terminals:

```bash
npm run dev:server   # game server on :8787 (restarts on changes)
npm run dev          # frontend on :5173, proxies /ws to the game server
```

Open the game in two browser tabs (each tab is its own player) and choose "🌐 অনলাইনে বন্ধুদের সাথে খেলুন".

**Production** (one process serves the website and the game connection):

```bash
npm run build
npm start            # listens on $PORT (default 8787)
```

**Deploy to Render (free)**: push this project to GitHub, then in Render create a *Web Service* from the repo:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`

Render gives you a public `https://….onrender.com` address to share with friends. Free services sleep after
about 15 minutes without visitors; the first visit then takes ~30 s to wake up.

**How it works**: the server (`server/`) runs the same rules engine as the offline game and is the only
source of truth. It checks that each action comes from the right player (`src/engine/permissions.ts`)
and rolls the dice itself, so players cannot cheat by editing their browser. Rooms live in memory and are
cleared after 2 hours idle; a server restart ends running online games.

## Architecture

- `src/engine/` – pure game rules, no React. `gameReducer(state, action)` is the single entry point;
  invalid actions return the same state object. Dice values are passed in, so the engine is deterministic.
- `src/data/` – board layout, properties, 20 সুযোগ + 20 ভাগ্য cards, tokens.
- `src/store/gameStore.ts` – Zustand store wrapping the reducer; auto-saves to localStorage after every action.
- `src/components/`, `src/pages/` – UI only. Token walking and dice animation live in `src/hooks/`.
- `server/` – Node + WebSocket game server: `rooms.ts` (room/seat logic, unit-tested), `validate.ts`
  (checks every client message), `index.ts` (HTTP + WebSocket). `src/net/` holds the shared protocol
  and the browser client; `src/store/onlineStore.ts` connects it to the UI.
- `src/utils/sound.ts` – Web Audio sound effects generated in code (no audio files). Sounds and coin
  animations are driven by new log entries (`useLogEvents`), so the engine stays UI-free.
- Log entries are stored as `{key, params}` and translated at render time (বাংলা / English).

## Milestone status

- [x] **M1** – setup screen, board, 2–4 players, dice, movement, purchase, rent, turns, cards, jail basics, log, save/continue
- [x] **M2** – houses & hotels (even building), mortgage (+10% to lift), hot-seat trading,
  debts: a player who cannot pay must sell / mortgage / trade, then pay or declare bankruptcy
- [x] **M3** – statistics & net worth, winner screen with ranking + confetti, synthesized sound effects
  (mute toggle), coin/bankruptcy/purchase animations, round limit (Fast: 25 rounds), validated custom rules,
  mobile action bar, automatic upgrade of older saves

## Key rules

- Build only on a complete, unmortgaged colour group; build and sell evenly. 4 houses, then a hotel.
- Buildings sell back for half price. Mortgage = half the price; lifting it costs mortgage value + 10%.
- Mortgaged properties and groups with buildings cannot be traded.
- The bank holds unsold properties and has a limited building supply (default 32 houses, 12 hotels;
  0 = unlimited in Custom). A hotel returns its 4 houses to the bank; selling a hotel during a shortage
  drops it to the houses available. The 🏦 panel shows supply, unsold properties and money in/out.
- Unpayable charges become debts. Nothing else happens until the debtor pays or declares bankruptcy;
  bankruptcy is only possible when cash on hand cannot cover the debt. Assets go to the creditor (or the bank).
