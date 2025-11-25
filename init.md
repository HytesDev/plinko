# Project Notes (init.md)

## What’s New
- Added admin panel (password via `ADMIN_PASSWORD`) for player rename/reset/balance and chat clear.
- Live chat window with unmoderated disclosure; admins can clear chat.
- Credits popout linking to the original repo and noting ChatGPT Codex; navbar buttons aligned with reset.
- Auto-drop interval is configurable; multiplayer reconnect/rename handling improved.

## Deploy/Pull Workflow
```bash
cd /opt/plinko-server
git pull
pnpm install --frozen-lockfile
pnpm run build
sudo systemctl restart plinko-ws
sudo nginx -t && sudo systemctl reload nginx
```
- Ensure `.env.production` (or build env) has `VITE_MULTIPLAYER_WS_URL=wss://plinko.hytes.dev/ws`.
- Set `ADMIN_PASSWORD` in `/etc/systemd/system/plinko-ws.service`, then `sudo systemctl daemon-reload && sudo systemctl restart plinko-ws`.

## Paths & Services
- Repo path: `/opt/plinko-server`; build served by nginx from `/opt/plinko-server/build`.
- WebSocket service: `plinko-ws` (Node v20.19.5). Logs via `journalctl -u plinko-ws -n 50`.

## Quick Checks
- Service status: `sudo systemctl status plinko-ws`
- Logs: `journalctl -u plinko-ws -n 50 --no-pager`
- WS probe: `curl -I https://plinko.hytes.dev/ws` (expect 400/upgrade, not 404/500)
- Nginx test: `sudo nginx -t` then `sudo systemctl reload nginx`
