# Plinko Game Online 🎮

Forked from the original project at [plinko-game-online/plinko-game-online.github.io](https://github.com/plinko-game-online/plinko-game-online.github.io), this variant powers [plinko.hytes.dev](https://plinko.hytes.dev) with multiplayer, admin controls, and a few UI refinements.

## Live Site
- Play at [plinko.hytes.dev](https://plinko.hytes.dev).
- Builds are deployed infrequently; expect low update cadence unless critical fixes are needed.

## What's Different in This Fork
- Lightweight multiplayer WebSocket server (`server/index.js`) and admin panel (password-protected).
- Small UI tweaks (leaderboard, credits, admin/credits buttons) and an adjustable auto-drop interval.
- nginx/systemd deployment setup for the VPS at `/opt/plinko-server`.

## Quick Start (local)
```bash
pnpm install
pnpm dev            # run the SvelteKit app
pnpm run server     # start the WS server on ws://localhost:4173/ws
```
Set `VITE_MULTIPLAYER_WS_URL` (e.g., `ws://localhost:4173/ws`) before `pnpm dev`/`pnpm build` to enable multiplayer.

## Multiplayer & Hosting Notes
- WebSocket server: `pnpm run server` or systemd unit `plinko-ws` on the VPS.
- Reverse proxy `/ws` to `http://127.0.0.1:4173/ws` via nginx.
- Set `ADMIN_PASSWORD` for the server (default is insecure); set `VITE_MULTIPLAYER_WS_URL` for the frontend build.

## License
- MIT License (matches the upstream project).
