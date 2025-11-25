import type { RowCount } from '$lib/constants/game';
export type { RowCount } from '$lib/constants/game';

export enum BetMode {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
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
  /**
   * Number of pin rows at the time of winning.
   */
  rowCount: RowCount;
  /**
   * Zero-based index of which bin the ball fell into (leftmost bin is 0).
   */
  binIndex: number;
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
};

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
