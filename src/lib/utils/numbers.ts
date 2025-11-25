import type { RowCount } from '$lib/types';

/**
 * Calculate the probabilities of a ball falling into each bin (from left to right).
 *
 * It follows a [binomial distribution](https://en.wikipedia.org/wiki/Binomial_distribution),
 * where the probability of a ball falling into `k`th bin after `n` rows is:
 *
 * ```text
 * Pr(k; n, p) = C(n, k) * p^k * (1 - p)^(n - k)
 * ```
 *
 * , where `C(n, k) = n! / (k! * (n - k)!)` and `p = 0.5`.
 */
export function computeBinProbabilities(rowCount: RowCount): number[] {
  const p = 0.5; // probability of success on a single trial
  const probabilities = [];

  for (let k = 0; k <= rowCount; k++) {
    const binomialCoefficient = factorial(rowCount) / (factorial(k) * factorial(rowCount - k));
    const probability = binomialCoefficient * Math.pow(p, k) * Math.pow(1 - p, rowCount - k);
    probabilities.push(probability);
  }

  return probabilities;
}

/**
 * Converts `valueA` from `scaleA` to `scaleB`.
 *
 * @example
 * convertScale(0.25, [0, 1], [0, 100]); // 25
 */
export function convertScale(
  valueA: number,
  scaleA: [number, number],
  scaleB: [number, number],
): number {
  const [minA, maxA] = scaleA;
  const [minB, maxB] = scaleB;

  const percentage = (valueA - minA) / (maxA - minA);
  const valueB = percentage * (maxB - minB) + minB;

  return valueB;
}

/**
 * Counts how many times each value occurs in the given array.
 */
export function countValueOccurrences<T extends string | number>(values: T[]): Record<T, number> {
  const result = {} as Record<T, number>;
  for (const value of values) {
    result[value] = (result[value] || 0) + 1;
  }
  return result;
}

/**
 * Computes the dot product of two vectors.
 *
 * @remarks The two vectors must have the same length.
 *
 * @example
 * const a = [1, 2, 3];
 * const b = [4, 5, 6];
 * dotProduct(a, b); // 32  (1*4 + 2*5 + 3*6)
 */
export function dotProduct(a: number[], b: number[]): number {
  return a.reduce((acc, value, index) => acc + value * b[index], 0);
}

/**
 * Round to two decimal places to mimic currency precision.
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * @example
 * formatCurrency(123456.789); // "$123,456.79"
 * formatCurrency(2); // "$2.00"
 * formatCurrency(-2); // "-$2.00"
 * formatCurrency(2400000000); // "$2.4B"
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '$0.00';

  const abs = Math.abs(value);
  const suffixes: { limit: number; suffix: string }[] = [
    { limit: 1e15, suffix: 'Q' },
    { limit: 1e12, suffix: 'T' },
    { limit: 1e9, suffix: 'B' },
    { limit: 1e6, suffix: 'M' },
  ];

  const matched = suffixes.find(({ limit }) => abs >= limit);
  if (matched) {
    const scaled = value / matched.limit;
    const formatted = scaled.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${value < 0 ? '-$' : '$'}${formatted}${matched.suffix}`;
  }

  const isCompact = abs >= 1_000_000;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: isCompact ? 'compact' : 'standard',
    minimumFractionDigits: isCompact ? 0 : 2,
    maximumFractionDigits: isCompact ? 2 : 2,
  });

  return formatter.format(value);
}

/**
 * Gets a random number in the range of `[min, max]`.
 */
export function getRandomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
