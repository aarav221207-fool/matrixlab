import { expect, test } from 'vitest';
import * as m from './math';

test('addition', () => {
  const a = [[1, 2], [3, 4]];
  const b = [[5, 6], [7, 8]];
  expect(m.add(a, b)).toEqual([[6, 8], [10, 12]]);
});

test('subtraction', () => {
  const a = [[5, 6], [7, 8]];
  const b = [[1, 2], [3, 4]];
  expect(m.subtract(a, b)).toEqual([[4, 4], [4, 4]]);
});

test('multiplication', () => {
  const a = [[1, 2], [3, 4]];
  const b = [[2, 0], [1, 2]];
  expect(m.multiply(a, b)).toEqual([[4, 4], [10, 8]]);
});

test('transpose', () => {
  const a = [[1, 2], [3, 4], [5, 6]];
  expect(m.transpose(a)).toEqual([[1, 3, 5], [2, 4, 6]]);
});

test('determinant', () => {
  const a = [[1, 2], [3, 4]];
  expect(m.determinant(a)).toBeCloseTo(-2);
});

test('inverse', () => {
  const a = [[4, 7], [2, 6]];
  const inv = m.inverse(a);
  expect(inv[0][0]).toBeCloseTo(0.6);
  expect(inv[0][1]).toBeCloseTo(-0.7);
  expect(inv[1][0]).toBeCloseTo(-0.2);
  expect(inv[1][1]).toBeCloseTo(0.4);
});

test('rank', () => {
  const a = [
    [1, 2, 3],
    [2, 4, 6],
    [3, 6, 9]
  ];
  expect(m.rank(a)).toBe(1);

  const b = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];
  expect(m.rank(b)).toBe(3);
});

test('RREF', () => {
  const a = [
    [1, 2, -1, -4],
    [2, 3, -1, -11],
    [-2, 0, -3, 22]
  ];
  const { matrix } = m.rref(a);
  
  // Clean floats
  const cleaned = m.cleanMatrix(matrix, 4);

  expect(cleaned).toEqual([
    [1, 0, 0, -8],
    [0, 1, 0, 1],
    [0, 0, 1, -2]
  ]);
});

test('singular matrices', () => {
  const a = [[1, 2], [2, 4]];
  expect(() => m.inverse(a)).toThrow();
});

test('rectangular inverse', () => {
  const a = [[1, 2, 3], [4, 5, 6]];
  expect(() => m.inverse(a)).toThrow();
});

test('incompatible dimensions multiplication', () => {
  const a = [[1, 2], [3, 4]];
  const b = [[1, 2, 3]];
  expect(() => m.multiply(a, b)).toThrow();
});

test('trace', () => {
  const a = [[1, 2], [3, 4]];
  expect(m.trace(a)).toBe(5);
});
