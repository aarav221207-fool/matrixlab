export interface FormatOptions {
  decimals?: number;
  tolerance?: number;
}

/**
 * Formats a number for display according to strict mathematical application rules.
 * 
 * - Retains full internal precision (does not mutate original value)
 * - Rounds displayed decimals (default 2)
 * - Removes unnecessary trailing zeros
 * - Converts numerical noise (e.g. -1e-11) to 0
 * - Handles negative zero, NaN, Infinity safely
 * 
 * @param value The numerical value to format
 * @param options Optional configuration
 * @returns A strictly formatted string representation
 */
export function formatNumber(value: number, options?: FormatOptions): string {
  const { decimals = 2, tolerance = 1e-10 } = options || {};

  if (typeof value !== 'number') return String(value);

  if (Number.isNaN(value)) return 'NaN';
  if (!Number.isFinite(value)) {
    return value > 0 ? '∞' : '-∞';
  }

  // Handle numerical noise near zero (also maps -0 to 0)
  if (Math.abs(value) < tolerance) {
    return '0';
  }

  // Format with fixed decimals
  const formatted = value.toFixed(decimals);

  // Remove trailing zeros and unnecessary decimal point
  // For example: 3.00 -> 3, 1.50 -> 1.5
  let cleaned = formatted;
  if (cleaned.includes('.')) {
    cleaned = cleaned.replace(/0+$/, '').replace(/\.$/, '');
  }

  return cleaned;
}

/**
 * Helper to format an entire matrix for display.
 */
export function formatMatrix(matrix: number[][], options?: FormatOptions): string[][] {
  return matrix.map(row => row.map(val => formatNumber(val, options)));
}
