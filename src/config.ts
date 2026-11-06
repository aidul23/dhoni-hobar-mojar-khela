/**
 * Online multiplayer needs the Node game server (`npm start`). Until that is deployed,
 * builds show "coming soon" instead. Enable with VITE_ONLINE_ENABLED=true at build time
 * (or in .env.local for development).
 */
export const ONLINE_ENABLED = import.meta.env.VITE_ONLINE_ENABLED === 'true';
