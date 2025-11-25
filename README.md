# Plinko Game Online 🎮

Experience the classic arcade thrill with our free online Plinko game! Drop discs through pegs and watch the excitement unfold.

## 🎯 [Play Now](https://plinko-game-online.github.io/)

No download, no registration - just instant fun in your browser!

## ✨ Game Features

- **Instant Play**: Start dropping discs immediately
- **Mobile Friendly**: Perfect on any device
- **Free Forever**: No hidden costs
- **Simple Controls**: Click or tap to drop
- **Smooth Gameplay**: Built with modern web technology

## 🎲 How to Play

1. Visit [https://plinko-game-online.github.io/](https://plinko-game-online.github.io/)
2. Click to drop your disc from the top
3. Watch it bounce through the pegs
4. Score points based on where it lands
5. Try different drop positions for better scores!

## 💻 Technical Requirements

- Works on all modern browsers
- Supports both desktop and mobile
- No installation needed
- Minimal internet connection required

## 🌟 Why Players Love Our Plinko

- Clean, simple interface
- Authentic arcade physics
- Quick loading time
- Responsive controls
- No ads interruption

## 📱 Compatible Browsers

- Google Chrome
- Firefox
- Safari
- Microsoft Edge
- Mobile browsers

## 🎮 Quick Tips

- Try different dropping positions
- Watch how the pegs affect disc movement
- Practice makes perfect!

---

Enjoy playing Plinko! Share with friends for more fun.

[Play Plinko Game Now](https://plinko-game-online.github.io/)

## 🌐 Multiplayer (self-hosted)

This repo now ships with a lightweight WebSocket server so you and friends can share balances and wins in real time.

- Start server locally: `pnpm install` then `pnpm server` (listens on `ws://localhost:4173/ws`).
- Point the client to your server by setting `VITE_MULTIPLAYER_WS_URL` (for example `ws://your-domain.com/ws`) before running `pnpm dev` or `pnpm build`.
- Reverse proxy example for nginx:

```nginx
location /ws {
  proxy_pass http://127.0.0.1:4173;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

If the env var is missing the game falls back to local play only.
