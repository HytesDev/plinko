import type { RowCount } from '$lib/constants/game';
export type { RowCount } from '$lib/constants/game';

export enum BetMode {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export enum GameMode {
  PLINKO = 'PLINKO',
  COINFLIP = 'COINFLIP',
}

/**
 * Game's risk level, which controls the volatility of payout.
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * A record of the bet amount associated to every existing ball in the game
 * that is still in motion.
 *
 * When a ball enters a bin, its record is removed.
 */
export type BetAmountOfExistingBalls = {
  [ballId: number]: {
    betAmount: number;
    /**
     * Player ID of who dropped the ball.
     */
    playerId: string;
  };
};

export type WinRecord = {
  /**
   * UUID of the win record.
   */
  id: string;
  /**
   * How much the player has bet.
   */
  betAmount: number;
  payout: {
    /**
     * Multiplier for the payout (e.g. `0.3`, `1.5`).
     */
    multiplier: number;
    /**
     * Actual payout amount.
     */
    value: number;
  };
  /**
   * Payout value minus the bet amount.
   */
  profit: number;
  /**
   * Which game produced this record.
   *
   * Records coming from older clients might not include this; treat them as Plinko.
   */
  gameMode?: GameMode;
  /**
   * Timestamp of when the win was generated, in milliseconds.
   */
  timestamp?: number;
} & (
  | {
      gameMode?: GameMode.PLINKO;
      /**
       * Number of pin rows at the time of winning.
       */
      rowCount: RowCount;
      /**
       * Zero-based index of which bin the ball fell into (leftmost bin is 0).
       */
      binIndex: number;
    }
  | {
      gameMode: GameMode.COINFLIP;
      /**
       * Result side for the coin flip.
       */
      side: 'HEADS' | 'TAILS';
      /**
       * Whether the coin flip was a win.
       */
      outcome: 'WIN' | 'LOSE';
    }
);

export type PlayerState = {
  id: string;
  name: string;
  balance: number;
  winRecords: WinRecord[];
  /**
   * History of total profits. Starts with 0.
   */
  totalProfitHistory: number[];
  /**
   * Whether this player is authorized as an admin.
   */
  isAdmin?: boolean;
};

export type PlinkoWinRecord = Extract<WinRecord, { gameMode?: GameMode.PLINKO }>;

export type CoinflipWinRecord = Extract<WinRecord, { gameMode: GameMode.COINFLIP }>;

export function isPlinkoWinRecord(record: WinRecord): record is PlinkoWinRecord {
  return !record.gameMode || record.gameMode === GameMode.PLINKO;
}

export function isCoinflipWinRecord(record: WinRecord): record is CoinflipWinRecord {
  return record.gameMode === GameMode.COINFLIP;
}
