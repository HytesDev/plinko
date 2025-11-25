import PlinkoEngine from '$lib/components/Plinko/PlinkoEngine';
import { binColor, defaultStartingBalance } from '$lib/constants/game';
import {
  RiskLevel,
  type BetAmountOfExistingBalls,
  type PlayerState,
  type RowCount,
  type WinRecord,
} from '$lib/types';
import { interpolateRgbColors } from '$lib/utils/colors';
import { countValueOccurrences } from '$lib/utils/numbers';
import { derived, get, writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

const fallbackPlayerState: PlayerState = {
  id: '',
  name: '',
  balance: defaultStartingBalance,
  winRecords: [],
  totalProfitHistory: [0],
};

export const plinkoEngine = writable<PlinkoEngine | null>(null);

export const betAmount = writable<number>(1);

export const betAmountOfExistingBalls = writable<BetAmountOfExistingBalls>({});

export const rowCount = writable<RowCount>(16);

export const riskLevel = writable<RiskLevel>(RiskLevel.MEDIUM);

const defaultPlayer = createPlayer('Player 1');

export const players = writable<PlayerState[]>([defaultPlayer]);

export const activePlayerId = writable<string>(defaultPlayer.id);

function updatePlayerById(playerId: string, updater: (player: PlayerState) => PlayerState) {
  players.update((list) =>
    list.map((player) => (player.id === playerId ? updater(structuredClone(player)) : player)),
  );
}

function updateActivePlayer(updater: (player: PlayerState) => PlayerState) {
  const playerId = get(activePlayerId);
  if (!playerId) {
    return;
  }
  updatePlayerById(playerId, updater);
}

function createActivePlayerStore<K extends keyof PlayerState>(key: K) {
  const { subscribe } = derived(
    [players, activePlayerId],
    ([$players, $activePlayerId]) =>
      ($players.find((player) => player.id === $activePlayerId) ?? fallbackPlayerState)[key],
  );

  return {
    subscribe,
    set: (value: PlayerState[K]) =>
      updateActivePlayer((player) => ({
        ...player,
        [key]: value,
      })),
    update: (updater: (value: PlayerState[K]) => PlayerState[K]) =>
      updateActivePlayer((player) => ({
        ...player,
        [key]: updater(player[key]),
      })),
  };
}

export const winRecords = createActivePlayerStore('winRecords');

/**
 * History of total profits of the active player. Should be updated whenever a new win record
 * is pushed to `winRecords` store.
 *
 * We deliberately don't use `derived(winRecords, ...)` to optimize performance.
 */
export const totalProfitHistory = createActivePlayerStore('totalProfitHistory');

/**
 * Active player's balance.
 */
export const balance = createActivePlayerStore('balance');

/**
 * RGB colors for every bin. The length of the array is the number of bins.
 */
export const binColors = derived<typeof rowCount, { background: string[]; shadow: string[] }>(
  rowCount,
  ($rowCount) => {
    const binCount = $rowCount + 1;
    const isBinsEven = binCount % 2 === 0;
    const redToYellowLength = Math.ceil(binCount / 2);

    const redToYellowBg = interpolateRgbColors(
      binColor.background.red,
      binColor.background.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    const redToYellowShadow = interpolateRgbColors(
      binColor.shadow.red,
      binColor.shadow.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    return {
      background: [...redToYellowBg, ...redToYellowBg.toReversed().slice(isBinsEven ? 0 : 1)],
      shadow: [...redToYellowShadow, ...redToYellowShadow.toReversed().slice(isBinsEven ? 0 : 1)],
    };
  },
);

export const binProbabilities = derived<
  [typeof winRecords, typeof rowCount],
  { [binIndex: number]: number }
>([winRecords, rowCount], ([$winRecords, $rowCount]) => {
  const occurrences = countValueOccurrences($winRecords.map(({ binIndex }) => binIndex));
  const probabilities: Record<number, number> = {};
  for (let i = 0; i < $rowCount + 1; ++i) {
    probabilities[i] = occurrences[i] / $winRecords.length || 0;
  }
  return probabilities;
});

export function createPlayer(name: string, startingBalance = defaultStartingBalance): PlayerState {
  return {
    id: uuidv4(),
    name,
    balance: startingBalance,
    winRecords: [],
    totalProfitHistory: [0],
  };
}

function normalizePlayerState(player: PlayerState): PlayerState {
  return {
    id: player.id || uuidv4(),
    name: player.name || 'Player',
    balance:
      typeof player.balance === 'number' && !Number.isNaN(player.balance)
        ? player.balance
        : defaultStartingBalance,
    winRecords: Array.isArray(player.winRecords) ? player.winRecords : [],
    totalProfitHistory:
      Array.isArray(player.totalProfitHistory) && player.totalProfitHistory.length
        ? player.totalProfitHistory
        : [0],
  };
}

export function addPlayer(name?: string) {
  const safeName = name?.trim() || `Player ${get(players).length + 1}`;
  const newPlayer = createPlayer(safeName);
  players.update((list) => [...list, newPlayer]);
  activePlayerId.set(newPlayer.id);
  return newPlayer;
}

export function setActivePlayer(playerId: string) {
  const nextPlayer = get(players).find((player) => player.id === playerId);
  if (nextPlayer) {
    activePlayerId.set(playerId);
  }
}

export function renamePlayer(playerId: string, name: string) {
  if (!name.trim()) {
    return;
  }
  updatePlayerById(playerId, (player) => ({
    ...player,
    name: name.trim(),
  }));
}

export function removePlayer(playerId: string) {
  const currentPlayers = get(players);
  if (currentPlayers.length <= 1) {
    return;
  }
  const filtered = currentPlayers.filter((player) => player.id !== playerId);
  players.set(filtered);

  if (get(activePlayerId) === playerId) {
    activePlayerId.set(filtered[0]?.id ?? '');
  }
}

export function resetPlayerStats(playerId: string) {
  updatePlayerById(playerId, (player) => ({
    ...player,
    winRecords: [],
    totalProfitHistory: [0],
  }));
}

export function applyBalanceDelta(playerId: string, delta: number) {
  updatePlayerById(playerId, (player) => ({
    ...player,
    balance: player.balance + delta,
  }));
}

export function resetActivePlayer(startingBalance: number = defaultStartingBalance) {
  updateActivePlayer((player) => ({
    ...player,
    balance: startingBalance,
    winRecords: [],
    totalProfitHistory: [0],
  }));
}

export function recordWinForPlayer(playerId: string, record: WinRecord) {
  updatePlayerById(playerId, (player) => {
    const lastTotalProfit = player.totalProfitHistory.at(-1) ?? 0;
    return {
      ...player,
      winRecords: [...player.winRecords, record],
      totalProfitHistory: [...player.totalProfitHistory, lastTotalProfit + record.profit],
      balance: player.balance + record.payout.value,
    };
  });
}

export function setPlayersState(
  nextPlayers: PlayerState[],
  nextActiveId: string | null | undefined = undefined,
) {
  const safePlayers = (nextPlayers.length ? nextPlayers : [createPlayer('Player 1')]).map(
    normalizePlayerState,
  );
  players.set(safePlayers);
  const activeId =
    safePlayers.find((player) => player.id === nextActiveId)?.id ?? safePlayers[0].id;
  activePlayerId.set(activeId);
}
