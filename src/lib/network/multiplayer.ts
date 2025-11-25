import { activePlayerId, players, recordWinForPlayer, setPlayersState } from '$lib/stores/game';
import type { PlayerState, WinRecord } from '$lib/types';
import { ensureUniquePlayerName, generateRandomPlayerName } from '$lib/utils/playerNames';
import { get, writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

type ConnectionStatus = 'disabled' | 'connecting' | 'connected' | 'error';

type WinFeedEntry = {
  playerId: string;
  playerName: string;
  record: WinRecord;
};

const WS_URL = import.meta.env.VITE_MULTIPLAYER_WS_URL;
const NAME_STORAGE_KEY = 'plinko_mp_name';
const NAME_PROMPT_SEEN_KEY = 'plinko_mp_name_seen';

export const connectionStatus = writable<ConnectionStatus>('disabled');
export const connectionError = writable<string | null>(null);
export const playerName = writable<string>('Player');
export const winFeed = writable<WinFeedEntry[]>([]);
export const shouldPromptForName = writable<boolean>(false);
export const adminAuthState = writable<'locked' | 'pending' | 'authorized'>('locked');
export const adminError = writable<string | null>(null);
const pendingRename = writable<string | null>(null);
export const chatFeed = writable<
  { id: string; playerId: string; playerName: string; text: string; timestamp: number }[]
>([]);

export const multiplayerConfigured = Boolean(WS_URL);

let socket: WebSocket | null = null;
const pendingBets = new Map<string, (result: { ok: boolean; reason?: string }) => void>();
const pendingResets = new Map<string, (result: { ok: boolean; reason?: string }) => void>();
const pendingAdminRequests = new Map<
  string,
  (result: { ok: boolean; reason?: string; [key: string]: unknown }) => void
>();
let adminPassword: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastRequestedName: string | null = null;
let lastChatSentAt = 0;

function getExistingNames(excludeSelf = false) {
  const excludeId = excludeSelf ? get(activePlayerId) : null;
  return get(players)
    .filter((player) => (excludeId ? player.id !== excludeId : true))
    .map((player) => player.name);
}

function getDefaultName() {
  return generateRandomPlayerName(getExistingNames(true));
}

export function initMultiplayer() {
  if (typeof window === 'undefined') {
    return;
  }

  const storedName = window.localStorage.getItem(NAME_STORAGE_KEY)?.slice(0, 24);
  const initialName = ensureUniquePlayerName(
    storedName || getDefaultName(),
    getExistingNames(true),
  );
  playerName.set(initialName);
  shouldPromptForName.set(
    Boolean(WS_URL) && !storedName && !window.localStorage.getItem(NAME_PROMPT_SEEN_KEY),
  );

  if (!WS_URL) {
    connectionStatus.set('disabled');
    return;
  }

  connectionStatus.set('connecting');
  connect(initialName);
}

function connect(name: string) {
  if (!WS_URL || typeof window === 'undefined') return;
  connectionError.set(null);
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket = new WebSocket(WS_URL);

  socket.addEventListener('open', () => {
    connectionStatus.set('connected');
    socket?.send(JSON.stringify({ type: 'join', name }));
    window.localStorage.setItem(NAME_STORAGE_KEY, name);
    lastRequestedName = name;
  });

  socket.addEventListener('error', () => {
    connectionStatus.set('error');
    connectionError.set('Unable to connect to multiplayer server');
  });

  socket.addEventListener('close', () => {
    connectionStatus.set('error');
    connectionError.set('Disconnected from multiplayer server, retrying…');
    reconnectTimer = setTimeout(() => connect(lastRequestedName || name), 1500);
  });

  socket.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (error) {
      console.error('Failed to parse server message', error);
    }
  });
}

function handleMessage(message: any) {
  switch (message.type) {
    case 'welcome': {
      const { playerId, players, winFeed: serverFeed, chatFeed: serverChat } = message as {
        playerId: string;
        players: PlayerState[];
        winFeed?: WinFeedEntry[];
        chatFeed?: ReturnType<typeof getChatFeed>;
      };
      setPlayersState(players ?? [], playerId);
      syncLocalPlayerName(players, playerId);
      activePlayerId.set(playerId);
      if (Array.isArray(serverFeed)) {
        winFeed.set(serverFeed);
      }
      if (Array.isArray(serverChat)) {
        chatFeed.set(serverChat);
      }
      triggerPendingRename();
      break;
    }
    case 'players': {
      const { players, winFeed: serverFeed, chatFeed: serverChat } = message as {
        players: PlayerState[];
        winFeed?: WinFeedEntry[];
        chatFeed?: ReturnType<typeof getChatFeed>;
      };
      setPlayersState(players ?? [], get(activePlayerId));
      syncLocalPlayerName(players);
      if (Array.isArray(serverFeed)) {
        winFeed.set(serverFeed);
      }
      if (Array.isArray(serverChat)) {
        chatFeed.set(serverChat);
      }
      triggerPendingRename();
      break;
    }
    case 'bet_result': {
      const { requestId, ok, reason, players } = message as {
        requestId: string;
        ok: boolean;
        reason?: string;
        players?: PlayerState[];
      };
      if (players) {
        setPlayersState(players, get(activePlayerId));
      }
      const resolver = requestId ? pendingBets.get(requestId) : undefined;
      if (resolver) {
        resolver({ ok, reason });
        pendingBets.delete(requestId);
      }
      break;
    }
    case 'chat_message': {
      const { message: chatMessage } = message as { message?: ReturnType<typeof getChatFeed>[number] };
      if (chatMessage) {
        chatFeed.update((msgs) => [...msgs.slice(-199), chatMessage]);
      }
      break;
    }
    case 'chat_feed': {
      const { chatFeed: serverChat } = message as { chatFeed?: ReturnType<typeof getChatFeed> };
      if (Array.isArray(serverChat)) {
        chatFeed.set(serverChat);
      }
      break;
    }
    case 'reset_result': {
      const { requestId, ok, reason, players } = message as {
        requestId: string;
        ok: boolean;
        reason?: string;
        players?: PlayerState[];
      };
      if (players) {
        setPlayersState(players, get(activePlayerId));
      }
      const resolver = requestId ? pendingResets.get(requestId) : undefined;
      if (resolver) {
        resolver({ ok, reason });
        pendingResets.delete(requestId);
      }
      break;
    }
    case 'win_event': {
      const { players, feedEntry } = message as {
        players?: PlayerState[];
        feedEntry?: WinFeedEntry;
      };
      if (players) {
        setPlayersState(players, get(activePlayerId));
      }
      if (feedEntry) {
        winFeed.update((feed) => [...feed.slice(-49), feedEntry]);
      }
      break;
    }
    case 'rename_result': {
      const { name } = message as { name?: string };
      if (name?.trim()) {
        playerName.set(name.trim());
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(NAME_STORAGE_KEY, name.trim());
          window.localStorage.setItem(NAME_PROMPT_SEEN_KEY, 'true');
        }
        shouldPromptForName.set(false);
        pendingRename.set(null);
        lastRequestedName = name.trim();
      }
      break;
    }
    case 'admin_auth_result': {
      const { ok, requestId, reason } = message as {
        ok: boolean;
        requestId?: string;
        reason?: string;
      };
      adminAuthState.set(ok ? 'authorized' : 'locked');
      adminError.set(ok ? null : reason ?? 'Invalid password');
      if (requestId && pendingAdminRequests.has(requestId)) {
        pendingAdminRequests.get(requestId)?.({ ok, reason });
        pendingAdminRequests.delete(requestId);
      }
      break;
    }
    case 'admin_action_result': {
      const { requestId, ok, reason, players: playersList, winFeed: feed } = message as {
        requestId?: string;
        ok: boolean;
        reason?: string;
        players?: PlayerState[];
        winFeed?: WinFeedEntry[];
      };
      if (Array.isArray(playersList)) {
        setPlayersState(playersList, get(activePlayerId));
      }
      if (Array.isArray(feed)) {
        winFeed.set(feed);
      }
      if (requestId && pendingAdminRequests.has(requestId)) {
        pendingAdminRequests.get(requestId)?.({ ok, reason });
        pendingAdminRequests.delete(requestId);
      }
      if (!ok && reason) {
        adminError.set(reason);
        if (reason.toLowerCase().includes('invalid password')) {
          adminAuthState.set('locked');
        }
      }
      break;
    }
    case 'error': {
      const { message: errorMessage } = message as { message?: string };
      connectionError.set(errorMessage ?? 'Server error');
      break;
    }
    default:
      break;
  }
}

export function isMultiplayerConnected() {
  return get(connectionStatus) === 'connected';
}

export function requestBet(amount: number) {
  if (!isMultiplayerConnected() || !socket) {
    return Promise.resolve({ ok: false, reason: 'Not connected to multiplayer' });
  }
  const requestId = uuidv4();

  return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    pendingBets.set(requestId, resolve);
    socket?.send(
      JSON.stringify({
        type: 'bet',
        amount,
        requestId,
      }),
    );

    setTimeout(() => {
      if (pendingBets.has(requestId)) {
        pendingBets.delete(requestId);
        resolve({ ok: false, reason: 'Bet request timed out' });
      }
    }, 3000);
  });
}

export function reportWin(record: WinRecord, playerId?: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'win',
        record,
        playerId: playerId ?? get(activePlayerId),
      }),
    );
  } else if (playerId) {
    // Offline fallback: keep client in sync locally.
    recordWinForPlayer(playerId, record);
  }
}

export function renamePlayerOnServer(name: string) {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return;

  const uniqueName = ensureUniquePlayerName(trimmed, getExistingNames(true));

  playerName.set(uniqueName);
  window.localStorage.setItem(NAME_STORAGE_KEY, uniqueName);
  window.localStorage.setItem(NAME_PROMPT_SEEN_KEY, 'true');
  shouldPromptForName.set(false);
  pendingRename.set(uniqueName);

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'rename',
        name: uniqueName,
      }),
    );
  }
}

export function requestBalanceReset() {
  if (!isMultiplayerConnected() || !socket) {
    return Promise.resolve({ ok: false, reason: 'Not connected to multiplayer' });
  }
  const requestId = uuidv4();

  return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    pendingResets.set(requestId, resolve);
    socket?.send(
      JSON.stringify({
        type: 'reset',
        requestId,
      }),
    );

    setTimeout(() => {
      if (pendingResets.has(requestId)) {
        pendingResets.delete(requestId);
        resolve({ ok: false, reason: 'Reset request timed out' });
      }
    }, 3000);
  });
}

function syncLocalPlayerName(playersList?: PlayerState[], activeId?: string | null) {
  const id = activeId ?? get(activePlayerId);
  if (!id || !playersList?.length) return;
  const active = playersList.find((p) => p.id === id);
  if (active && active.name && active.name !== get(playerName)) {
    playerName.set(active.name);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NAME_STORAGE_KEY, active.name);
      window.localStorage.setItem(NAME_PROMPT_SEEN_KEY, 'true');
    }
    shouldPromptForName.set(false);
  }
}

function triggerPendingRename() {
  const desired = get(pendingRename);
  if (!desired || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(
    JSON.stringify({
      type: 'rename',
      name: desired,
    }),
  );
}

function getChatFeed() {
  return get(chatFeed);
}

export function sendChatMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'Message required' };
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return { ok: false, reason: 'Not connected to multiplayer' };
  }
  const now = Date.now();
  if (now - lastChatSentAt < 500) {
    return { ok: false, reason: 'Please slow down' };
  }
  lastChatSentAt = now;
  socket.send(
    JSON.stringify({
      type: 'chat',
      text: trimmed.slice(0, 256),
    }),
  );
  return { ok: true };
}

function sendAdminRequest(body: Record<string, unknown>) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Promise.resolve({ ok: false, reason: 'Not connected to multiplayer' });
  }
  const requestId = uuidv4();

  return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    pendingAdminRequests.set(requestId, resolve);
    socket?.send(
      JSON.stringify({
        requestId,
        ...body,
      }),
    );

    setTimeout(() => {
      if (pendingAdminRequests.has(requestId)) {
        pendingAdminRequests.delete(requestId);
        adminAuthState.set('locked');
        adminError.set('Admin request timed out');
        resolve({ ok: false, reason: 'Admin request timed out' });
      }
    }, 3000);
  });
}

export function authenticateAdmin(password: string) {
  adminError.set(null);
  adminAuthState.set('pending');
  adminPassword = password;
  return sendAdminRequest({
    type: 'admin_auth',
    password,
  }).then((result) => {
    if (!result.ok && result.reason) {
      adminAuthState.set('locked');
      adminError.set(result.reason);
    }
    return result;
  });
}

async function requireAdminAuth() {
  if (!adminPassword) {
    adminError.set('Enter admin password to unlock controls.');
    adminAuthState.set('locked');
    return false;
  }
  if (get(adminAuthState) !== 'authorized') {
    const result = await authenticateAdmin(adminPassword);
    return result.ok;
  }
  return true;
}

function adminAction(
  action: 'rename_player' | 'set_balance' | 'reset_player' | 'remove_player',
  payload: Record<string, unknown>,
) {
  if (!adminPassword) {
    adminError.set('Enter admin password to unlock controls.');
    return Promise.resolve({ ok: false, reason: 'Not authorized' });
  }

  return sendAdminRequest({
    type: 'admin_action',
    action,
    password: adminPassword,
    ...payload,
  });
}

export async function adminRenamePlayer(playerId: string, name: string) {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) {
    return { ok: false, reason: 'Name is required' };
  }
  const authed = await requireAdminAuth();
  if (!authed) return { ok: false, reason: 'Not authorized' };
  return adminAction('rename_player', { playerId, name: trimmed });
}

export async function adminSetBalance(playerId: string, balance: number) {
  const authed = await requireAdminAuth();
  if (!authed) return { ok: false, reason: 'Not authorized' };
  return adminAction('set_balance', { playerId, balance });
}

export async function adminResetPlayer(playerId: string) {
  const authed = await requireAdminAuth();
  if (!authed) return { ok: false, reason: 'Not authorized' };
  return adminAction('reset_player', { playerId });
}

export async function adminRemovePlayer(playerId: string) {
  const authed = await requireAdminAuth();
  if (!authed) return { ok: false, reason: 'Not authorized' };
  return adminAction('remove_player', { playerId });
}

export async function adminClearChat() {
  const authed = await requireAdminAuth();
  if (!authed) return { ok: false, reason: 'Not authorized' };
  return adminAction('clear_chat', {});
}
