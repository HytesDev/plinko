## Restart Troubleshooting Guide

If a reboot leaves the app down, follow these steps (and share outputs with ChatGPT for help):

1) Check services:
```bash
sudo systemctl status plinko-ws
sudo systemctl status nginx
```

2) Restart services:
```bash
sudo systemctl restart plinko-ws
sudo systemctl restart nginx
sudo systemctl status plinko-ws
```

3) Inspect logs (paste to ChatGPT):
```bash
journalctl -u plinko-ws -n 50 --no-pager
journalctl -u nginx -n 50 --no-pager
```

4) Verify Node path and server file:
```bash
which node   # should match ExecStart path
ls -l /opt/plinko-server/server/index.js
```
If the Node path is wrong, edit `/etc/systemd/system/plinko-ws.service` and set:
```
ExecStart=/home/ubuntu/.nvm/versions/node/v20.19.5/bin/node /opt/plinko-server/server/index.js
```
Then:
```bash
sudo systemctl daemon-reload
sudo systemctl restart plinko-ws
```

5) Check Nginx config:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

6) Connectivity checks:
```bash
curl -I https://plinko.hytes.dev/ws   # expect 400/upgrade, not 404/500
curl -I https://plinko.hytes.dev      # expect 200
```
Then open https://plinko.hytes.dev in a browser and verify multiplayer connects.

7) Ensure auto-start:
```bash
sudo systemctl enable plinko-ws
```

## Current Deployment Notes
- App root: `/opt/plinko-server` (git clone). Build output served from `/opt/plinko-server/build` via nginx.
- WebSocket server: `plinko-ws` systemd unit runs `/opt/plinko-server/server/index.js` with Node v20.19.5. Set `ADMIN_PASSWORD` in the unit to override default.
- Frontend multiplayer URL: set `VITE_MULTIPLAYER_WS_URL` (e.g., `wss://plinko.hytes.dev/ws`) before `pnpm run build` on the VPS.
- New features: admin panel, credits popout, live chat (unmoderated; admins can clear chat), adjustable auto-drop interval.
