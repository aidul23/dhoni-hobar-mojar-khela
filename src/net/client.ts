import { WS_PATH, type ClientMessage, type ServerMessage } from './protocol';

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed';

interface Callbacks {
  onMessage: (msg: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
  /** Called right after (re)connecting, before queued messages are sent; used to rejoin. */
  onOpen: (send: (msg: ClientMessage) => void) => void;
}

const serverUrl = () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${WS_PATH}`;

/** WebSocket wrapper with a send queue and automatic reconnect (exponential backoff). */
export class NetClient {
  private ws: WebSocket | null = null;
  private queue: ClientMessage[] = [];
  private retries = 0;
  private stopped = true;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cb: Callbacks) {}

  connect() {
    this.stopped = false;
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.cb.onStatus('connecting');
    const ws = new WebSocket(serverUrl());
    this.ws = ws;

    ws.onopen = () => {
      this.retries = 0;
      this.cb.onStatus('open');
      const raw = (m: ClientMessage) => ws.send(JSON.stringify(m));
      this.cb.onOpen(raw);
      for (const m of this.queue.splice(0)) raw(m);
    };
    ws.onmessage = (e) => {
      try {
        this.cb.onMessage(JSON.parse(String(e.data)) as ServerMessage);
      } catch {
        // ignore malformed server data
      }
    };
    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      this.cb.onStatus('closed');
      if (this.stopped) return;
      const delay = Math.min(1000 * 2 ** this.retries++, 10_000);
      this.retryTimer = setTimeout(() => this.connect(), delay);
    };
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
    else {
      this.queue.push(msg);
      this.connect();
    }
  }

  disconnect() {
    this.stopped = true;
    this.queue = [];
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
    this.cb.onStatus('idle');
  }
}
