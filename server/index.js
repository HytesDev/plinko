import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 4173;
const MAX_WIN_RECORDS = 200;
const MAX_WIN_FEED = 50;
const STARTING_BALANCE = 500;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'canEggAI';

const players = new Map();
const socketsByPlayer = new Map();
const winFeed = [];

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

httpServer.listen(PORT, () => {
  console.log(`Multiplayer server listening on ws://localhost:${PORT}/ws`);
});

function makePlayer(name) {
  return {
    id: uuidv4(),
    name: name || 'Player',
    balance: STARTING_BALANCE,
    winRecords: [],
    totalProfitHistory: [0],
  };
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
  broadcast({
    type: 'players',
    players: Array.from(players.values()),
    winFeed,
  });
}

function addWinToFeed(player, record) {
  winFeed.push({ playerId: player.id, playerName: player.name, record });
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
  if (player.balance < amount) {
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

  player.balance -= amount;
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

  player.winRecords.push(record);
  if (player.winRecords.length > MAX_WIN_RECORDS) {
    player.winRecords = player.winRecords.slice(-MAX_WIN_RECORDS);
  }
  const lastTotal = player.totalProfitHistory.at(-1) ?? 0;
  player.totalProfitHistory.push(lastTotal + record.profit);
  player.balance += record.payout.value;

  addWinToFeed(player, record);
  syncPlayers();
}

function handleJoin(name, socket) {
  const uniqueName = ensureUniqueName(name);
  const player = makePlayer(uniqueName);
  players.set(player.id, player);
  socketsByPlayer.set(player.id, socket);

  socket.send(
    JSON.stringify({
      type: 'welcome',
      playerId: player.id,
      players: Array.from(players.values()),
      winFeed,
    }),
  );
  syncPlayers();

  socket.on('close', () => {
    players.delete(player.id);
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

function sendAdminResult(socket, payload) {
  socket.send(JSON.stringify(payload));
}

function handleAdminAuth(password, socket, requestId) {
  const ok = password === ADMIN_PASSWORD;
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

  const targetPlayerId = msg.playerId;
  const player = targetPlayerId ? players.get(targetPlayerId) : null;

  if (['rename_player', 'set_balance', 'reset_player', 'remove_player'].includes(action)) {
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
    case 'rename_player': {
      const nextName = ensureUniqueName((msg.name || '').slice(0, 24), targetPlayerId);
      player.name = nextName;
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
        players: Array.from(players.values()),
        winFeed,
      });
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
        playerId = handleJoin(msg.name, socket);
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
      socketsByPlayer.delete(playerId);
      syncPlayers();
    }
  });
});
