import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 4173;
const MAX_WIN_RECORDS = 200;
const MAX_WIN_FEED = 50;
const STARTING_BALANCE = 500;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'canEggAI';
const MAX_CHAT_MESSAGES = 200;

const players = new Map();
const socketsByPlayer = new Map();
const tokensByPlayerId = new Map();
const storedPlayersByToken = new Map();
const adminPlayerIds = new Set();
const bannedTokens = new Map(); // token -> timestamp (ms)
const winFeed = [];
const chatFeed = [];

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

httpServer.listen(PORT, () => {
  console.log(`Multiplayer server listening on ws://localhost:${PORT}/ws`);
});

function makePlayer(name) {
  return {
    id: uuidv4(),
    name: name || 'Player',
    balance: toCents(STARTING_BALANCE),
    winRecords: [],
    totalProfitHistory: [0],
  };
}

function toCents(value) {
  return Math.round(Number(value) * 100) / 100;
}

function persistPlayerById(playerId) {
  const token = tokensByPlayerId.get(playerId);
  const player = players.get(playerId);
  if (token && player) {
    storedPlayersByToken.set(token, structuredClone(player));
  }
}

function broadcast(messageObj) {
  const payload = JSON.stringify(messageObj);
  socketsByPlayer.forEach((socket) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(payload);
    }
  });
}

function syncPlayers() {
  players.forEach((player) => persistPlayerById(player.id));
  broadcast({
    type: 'players',
    players: getPlayersWithAdminFlag(),
    winFeed,
    chatFeed,
  });
}

function addWinToFeed(player, record) {
  winFeed.push({
    playerId: player.id,
    playerName: player.name,
    isAdmin: adminPlayerIds.has(player.id),
    record,
  });
  if (winFeed.length > MAX_WIN_FEED) {
    winFeed.splice(0, winFeed.length - MAX_WIN_FEED);
  }
}

function ensureUniqueName(baseName, currentPlayerId = null) {
  const trimmed = (baseName || 'Player').trim() || 'Player';
  const taken = new Set(
    Array.from(players.values())
      .filter((p) => p.id !== currentPlayerId)
      .map((p) => p.name.toLowerCase()),
  );

  if (!taken.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  let counter = 2;
  let candidate = `${trimmed} (${counter})`;
  while (taken.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${trimmed} (${counter})`;
  }
  return candidate;
}

function handleBet(playerId, amount, requestId, socket) {
  const player = players.get(playerId);
  if (!player) {
    socket.send(
      JSON.stringify({
        type: 'bet_result',
        requestId,
        ok: false,
        reason: 'Player not found',
      }),
    );
    return;
  }
  const wager = toCents(Number(amount));
  if (!Number.isFinite(wager) || wager <= 0) {
    socket.send(
      JSON.stringify({
        type: 'bet_result',
        requestId,
        ok: false,
        reason: 'Invalid bet',
      }),
    );
    return;
  }
  if (player.balance < wager) {
    socket.send(
      JSON.stringify({
        type: 'bet_result',
        requestId,
        ok: false,
        reason: 'Not enough balance',
      }),
    );
    return;
  }

  player.balance = toCents(player.balance - wager);
  socket.send(
    JSON.stringify({
      type: 'bet_result',
      requestId,
      ok: true,
    }),
  );
  syncPlayers();
}

function handleWin(playerId, record) {
  const player = players.get(playerId);
  if (!player) return;

  const normalizedRecord = {
    ...record,
    profit: toCents(record.profit),
    payout: {
      ...record.payout,
      value: toCents(record.payout.value),
    },
  };

  player.winRecords.push(normalizedRecord);
  if (player.winRecords.length > MAX_WIN_RECORDS) {
    player.winRecords = player.winRecords.slice(-MAX_WIN_RECORDS);
  }
  const lastTotal = player.totalProfitHistory.at(-1) ?? 0;
  player.totalProfitHistory.push(toCents(lastTotal + normalizedRecord.profit));
  player.balance = toCents(player.balance + normalizedRecord.payout.value);

  addWinToFeed(player, normalizedRecord);
  syncPlayers();
}

function handleJoin(name, socket, providedToken) {
  let token = providedToken && typeof providedToken === 'string' ? providedToken : null;
  const cachedPlayer = token ? storedPlayersByToken.get(token) : null;
  let player = cachedPlayer ? structuredClone(cachedPlayer) : null;

  const banExpiry = token ? bannedTokens.get(token) : null;
  if (banExpiry && banExpiry > Date.now()) {
    socket.send(
      JSON.stringify({
        type: 'banned',
        until: banExpiry,
      }),
    );
    socket.close(4003, 'Banned');
    return null;
  } else if (banExpiry && banExpiry <= Date.now()) {
    bannedTokens.delete(token);
  }

  if (player) {
    player.name = ensureUniqueName(player.name, player.id);
  } else {
    token = uuidv4();
    player = makePlayer(ensureUniqueName(name));
  }

  if (token) {
    storedPlayersByToken.set(token, structuredClone(player));
  }

  players.set(player.id, player);
  tokensByPlayerId.set(player.id, token);
  socketsByPlayer.set(player.id, socket);

  socket.send(
    JSON.stringify({
      type: 'welcome',
      playerId: player.id,
      players: getPlayersWithAdminFlag(),
      winFeed,
      chatFeed,
      token,
    }),
  );
  syncPlayers();

  socket.on('close', () => {
    const token = tokensByPlayerId.get(player.id);
    if (token) {
      persistPlayerById(player.id);
    }
    players.delete(player.id);
    tokensByPlayerId.delete(player.id);
    adminPlayerIds.delete(player.id);
    socketsByPlayer.delete(player.id);
    syncPlayers();
  });

  return player.id;
}

function handleReset(playerId, socket, requestId) {
  const player = players.get(playerId);
  if (!player) {
    socket.send(
      JSON.stringify({
        type: 'reset_result',
        requestId,
        ok: false,
        reason: 'Player not found',
      }),
    );
    return;
  }

  player.balance = STARTING_BALANCE;
  player.winRecords = [];
  player.totalProfitHistory = [0];
  player.balance = toCents(player.balance);

  socket.send(
    JSON.stringify({
      type: 'reset_result',
      requestId,
      ok: true,
      balance: player.balance,
    }),
  );
  syncPlayers();
}

function handleChat(playerId, text) {
  const player = players.get(playerId);
  if (!player) return;
  const trimmed = (text || '').toString().slice(0, 256).trim();
  if (!trimmed) return;

  const message = {
    id: uuidv4(),
    playerId: player.id,
    playerName: player.name,
    text: trimmed,
    timestamp: Date.now(),
  };
  chatFeed.push(message);
  if (chatFeed.length > MAX_CHAT_MESSAGES) {
    chatFeed.splice(0, chatFeed.length - MAX_CHAT_MESSAGES);
  }

  broadcast({
    type: 'chat_message',
    message,
  });
}

function broadcastChatFeed() {
  broadcast({
    type: 'chat_feed',
    chatFeed,
  });
}

function sendAdminResult(socket, payload) {
  socket.send(JSON.stringify(payload));
}

function handleAdminAuth(password, socket, requestId) {
  const ok = password === ADMIN_PASSWORD;
  if (ok && socket.playerId) {
    adminPlayerIds.add(socket.playerId);
  }
  sendAdminResult(socket, {
    type: 'admin_auth_result',
    requestId,
    ok,
    reason: ok ? undefined : 'Invalid password',
  });
}

function handleAdminAction(msg, socket) {
  const { action, password, requestId } = msg;
  if (password !== ADMIN_PASSWORD) {
    sendAdminResult(socket, {
      type: 'admin_action_result',
      requestId,
      ok: false,
      reason: 'Invalid password',
    });
    return;
  }
  if (socket.playerId) {
    adminPlayerIds.add(socket.playerId);
  }

  const targetPlayerId = msg.playerId;
  const player = targetPlayerId ? players.get(targetPlayerId) : null;

  if (['rename_player', 'set_balance', 'reset_player', 'remove_player', 'ban_player'].includes(action)) {
    if (!player) {
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: false,
        reason: 'Player not found',
      });
      return;
    }
  }

  switch (action) {
    case 'ban_player': {
      if (!player) {
        sendAdminResult(socket, {
          type: 'admin_action_result',
          requestId,
          ok: false,
          reason: 'Player not found',
        });
        return;
      }
      const token = tokensByPlayerId.get(targetPlayerId);
      const durationMinutes = Number(msg.minutes) || 0;
      const now = Date.now();
      const banUntil = durationMinutes > 0 ? now + durationMinutes * 60_000 : now + 60_000;
      if (token) {
        bannedTokens.set(token, banUntil);
        storedPlayersByToken.delete(token);
      }
      players.delete(targetPlayerId);
      tokensByPlayerId.delete(targetPlayerId);
      adminPlayerIds.delete(targetPlayerId);
      const targetSocket = socketsByPlayer.get(targetPlayerId);
      socketsByPlayer.delete(targetPlayerId);
      if (targetSocket) {
        targetSocket.send(
          JSON.stringify({
            type: 'banned',
            until: banUntil,
          }),
        );
        targetSocket.close(4003, 'Banned');
      }
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
        playerId: targetPlayerId,
        until: banUntil,
      });
      syncPlayers();
      break;
    }
    case 'rename_player': {
      const nextName = ensureUniqueName((msg.name || '').slice(0, 24), targetPlayerId);
      player.name = nextName;
      persistPlayerById(player.id);
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
        name: nextName,
        playerId: targetPlayerId,
      });
      syncPlayers();
      break;
    }
    case 'set_balance': {
      const nextBalance = Number(msg.balance);
      if (!Number.isFinite(nextBalance)) {
        sendAdminResult(socket, {
          type: 'admin_action_result',
          requestId,
          ok: false,
          reason: 'Invalid balance value',
        });
        return;
      }
      player.balance = nextBalance;
      player.balance = toCents(player.balance);
      persistPlayerById(player.id);
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
        playerId: targetPlayerId,
        balance: player.balance,
      });
      syncPlayers();
      break;
    }
    case 'reset_player': {
      player.balance = STARTING_BALANCE;
      player.winRecords = [];
      player.totalProfitHistory = [0];
      player.balance = toCents(player.balance);
      persistPlayerById(player.id);
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
        playerId: targetPlayerId,
        balance: player.balance,
      });
      syncPlayers();
      break;
    }
    case 'remove_player': {
      players.delete(targetPlayerId);
      const playerToken = tokensByPlayerId.get(targetPlayerId);
      if (playerToken) {
        storedPlayersByToken.delete(playerToken);
        tokensByPlayerId.delete(targetPlayerId);
      }
      const targetSocket = socketsByPlayer.get(targetPlayerId);
      socketsByPlayer.delete(targetPlayerId);
      if (targetSocket) {
        targetSocket.close(4001, 'Removed by admin');
      }
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
        playerId: targetPlayerId,
      });
      syncPlayers();
      break;
    }
    case 'list_players': {
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
        players: getPlayersWithAdminFlag(),
        winFeed,
        chatFeed,
      });
      break;
    }
    case 'clear_chat': {
      chatFeed.splice(0, chatFeed.length);
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: true,
        action,
      });
      broadcastChatFeed();
      break;
    }
    default:
      sendAdminResult(socket, {
        type: 'admin_action_result',
        requestId,
        ok: false,
        reason: 'Unknown admin action',
      });
  }
}

wss.on('connection', (socket) => {
  let playerId = null;

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'join' && !playerId) {
        playerId = handleJoin(msg.name, socket, msg.token);
        socket.playerId = playerId;
        return;
      }

      if (!playerId) {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Join first',
          }),
        );
        return;
      }

      switch (msg.type) {
        case 'bet':
          handleBet(playerId, Number(msg.amount), msg.requestId, socket);
          break;
        case 'win':
          handleWin(playerId, msg.record);
          break;
        case 'reset':
          handleReset(playerId, socket, msg.requestId);
          break;
        case 'chat':
          handleChat(playerId, msg.text);
          break;
        case 'rename': {
          const player = players.get(playerId);
          if (player && msg.name?.trim()) {
            const nextName = ensureUniqueName(msg.name.slice(0, 24), playerId);
            player.name = nextName;
            socket.send(
              JSON.stringify({
                type: 'rename_result',
                ok: true,
                name: nextName,
              }),
            );
            syncPlayers();
          }
          break;
        }
        case 'admin_auth':
          handleAdminAuth(msg.password, socket, msg.requestId);
          break;
        case 'admin_action':
          handleAdminAction(msg, socket);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to handle message', error);
    }
  });

  socket.on('close', () => {
    if (playerId) {
      players.delete(playerId);
      adminPlayerIds.delete(playerId);
      socketsByPlayer.delete(playerId);
      syncPlayers();
    }
  });
});

function getPlayersWithAdminFlag() {
  return Array.from(players.values()).map((player) => ({
    ...player,
    isAdmin: adminPlayerIds.has(player.id),
  }));
}
