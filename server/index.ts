import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { WS_PATH, type ServerMessage } from '../src/net/protocol';
import { roomCode, secretToken, secureRandom } from './codes';
import { Room, RoomManager } from './rooms';
import { parseClientMessage } from './validate';

const PORT = Number(process.env.PORT) || 8787;
const DIST = resolve(process.cwd(), 'dist');
const ROOM_IDLE_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_MESSAGES_PER_SECOND = 20;

const rooms = new RoomManager(secureRandom, roomCode, secretToken);

// ---------- static files (the built frontend) ----------

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
};

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  // Resolve inside dist/ only (blocks ../ path traversal); unknown paths fall back to the SPA.
  let file = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Frontend not built. Run `npm run build`, or use `npm run dev` for development.');
    return;
  }
  const cache = file.includes(`${DIST}/assets/`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': cache });
  createReadStream(file).pipe(res);
}

// ---------- websocket ----------

interface Conn {
  id: number;
  ws: WebSocket;
  room: Room | null;
  seatId: string | null;
  messageTimes: number[];
}

const conns = new Set<Conn>();
let connCounter = 0;
const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

const send = (c: Conn, msg: ServerMessage) => {
  if (c.ws.readyState === c.ws.OPEN) c.ws.send(JSON.stringify(msg));
};

/** Sends the room to everyone in it; each client learns which seat is theirs. */
function broadcast(room: Room) {
  const snapshot = room.snapshot();
  for (const c of conns) {
    if (c.room === room && c.seatId) send(c, { type: 'room', room: snapshot, you: c.seatId });
  }
}

function seatStillConnected(room: Room, seatId: string, except: Conn) {
  for (const c of conns) if (c !== except && c.room === room && c.seatId === seatId) return true;
  return false;
}

function attach(c: Conn, room: Room, seatId: string) {
  c.room = room;
  c.seatId = seatId;
}

function rateLimited(c: Conn) {
  const now = Date.now();
  c.messageTimes = c.messageTimes.filter((t) => now - t < 1000);
  c.messageTimes.push(now);
  return c.messageTimes.length > MAX_MESSAGES_PER_SECOND;
}

function handle(c: Conn, raw: string) {
  if (rateLimited(c)) return send(c, { type: 'error', code: 'tooManyRequests' });
  const msg = parseClientMessage(raw);
  if (!msg) return send(c, { type: 'error', code: 'invalidMessage' });
  if (msg.type !== 'action') log(`conn#${c.id} ${msg.type}${'code' in msg ? ' ' + msg.code : ''}${c.room ? ' in ' + c.room.code : ''}`);

  switch (msg.type) {
    case 'create_room': {
      const room = rooms.create(msg.rules);
      if (!room) return send(c, { type: 'error', code: 'roomFull' });
      const joined = room.join(msg.player);
      if (!joined.ok) return send(c, { type: 'error', code: joined.error });
      attach(c, room, joined.value.seatId);
      send(c, { type: 'joined', code: room.code, seatId: joined.value.seatId, token: joined.value.secret });
      return broadcast(room);
    }
    case 'join_room': {
      const room = rooms.get(msg.code);
      if (!room) return send(c, { type: 'error', code: 'roomNotFound' });
      const joined = room.join(msg.player);
      if (!joined.ok) return send(c, { type: 'error', code: joined.error });
      attach(c, room, joined.value.seatId);
      send(c, { type: 'joined', code: room.code, seatId: joined.value.seatId, token: joined.value.secret });
      return broadcast(room);
    }
    case 'rejoin': {
      const room = rooms.get(msg.code);
      if (!room) return send(c, { type: 'error', code: 'roomNotFound' });
      const seat = room.rejoin(msg.token);
      if (!seat.ok) return send(c, { type: 'error', code: seat.error });
      attach(c, room, seat.value);
      return broadcast(room);
    }
  }

  // Everything below needs a seat in a room.
  const { room, seatId } = c;
  if (!room || !seatId) return send(c, { type: 'error', code: 'notAllowed' });

  const result =
    msg.type === 'update_seat' ? room.updateSeat(seatId, msg.player)
    : msg.type === 'kick_seat' ? room.kick(seatId, msg.seatId)
    : msg.type === 'start_game' ? room.start(seatId)
    : msg.type === 'action' ? room.act(seatId, msg.action)
    : msg.type === 'remove_player' ? room.removePlayer(seatId, msg.seatId)
    : msg.type === 'restart' ? room.restart(seatId)
    : room.leave(seatId);

  if (!result.ok) {
    send(c, { type: 'error', code: result.error });
    // Re-sync the sender so a stale screen corrects itself.
    return send(c, { type: 'room', room: room.snapshot(), you: seatId });
  }

  if (msg.type === 'kick_seat') {
    // Tell the kicked player's connections, then detach them.
    for (const other of conns) {
      if (other.room === room && other.seatId === msg.seatId) {
        send(other, { type: 'left' });
        other.room = null;
        other.seatId = null;
      }
    }
  }
  if (msg.type === 'leave') {
    send(c, { type: 'left' });
    c.room = null;
    c.seatId = null;
    if (room.isEmpty) rooms.delete(room.code);
  }
  broadcast(room);
}

const server = createServer(serveStatic);
const wss = new WebSocketServer({ server, path: WS_PATH, maxPayload: 16 * 1024 });

wss.on('connection', (ws) => {
  const c: Conn = { id: ++connCounter, ws, room: null, seatId: null, messageTimes: [] };
  log(`conn#${c.id} open`);
  conns.add(c);
  ws.on('message', (data) => handle(c, data.toString()));
  ws.on('close', () => {
    log(`conn#${c.id} close`);
    conns.delete(c);
    const { room, seatId } = c;
    if (room && seatId && !seatStillConnected(room, seatId, c)) {
      room.setConnected(seatId, false);
      broadcast(room);
    }
  });
});

// Keep-alive pings (some hosts drop idle sockets) and idle-room cleanup.
setInterval(() => {
  for (const c of conns) if (c.ws.readyState === c.ws.OPEN) c.ws.ping();
  rooms.sweep(ROOM_IDLE_MS);
}, 30_000).unref();

server.listen(PORT, () => {
  console.log(`ধনী হবার মজার খেলা server on http://localhost:${PORT} (ws path ${WS_PATH})`);
});
