import { describe, it, expect } from 'vitest';
import { calculateLaplace, calculateInverseLaplace } from './laplaceEngine';

describe('Laplace Transform Engine', () => {
  it('computes transform of monomial t', () => {
    const res = calculateLaplace('t');
    expect(res.result).toBe('1/s^2');
    expect(res.resultLatex).toBe('\\frac{1}{s^{2}}');
  });

  it('computes transform of monomial t^2', () => {
    const res = calculateLaplace('t^2');
    expect(res.result).toBe('2/s^3');
    expect(res.resultLatex).toBe('\\frac{2}{s^{3}}');
  });

  it('computes transform of monomial t^3', () => {
    const res = calculateLaplace('t^3');
    expect(res.result).toBe('6/s^4');
    expect(res.resultLatex).toBe('\\frac{6}{s^{4}}');
  });

  it('computes transform of exponential exp(3*t)', () => {
    const res = calculateLaplace('exp(3*t)');
    expect(res.result).toBe('1/(s - 3)');
    expect(res.resultLatex).toBe('\\frac{1}{s - 3}');
  });

  it('computes transform of trigonometric sin(4*t)', () => {
    const res = calculateLaplace('sin(4*t)');
    expect(res.result).toBe('4/(s^2 + 16)');
    expect(res.resultLatex).toBe('\\frac{4}{s^2 + 16}');
  });

  it('computes transform of trigonometric cos(3*t)', () => {
    const res = calculateLaplace('cos(3*t)');
    expect(res.result).toBe('s/(s^2 + 9)');
    expect(res.resultLatex).toBe('\\frac{s}{s^2 + 9}');
  });

  it('computes frequency-shifted polynomial t^2*exp(3*t)', () => {
    const res = calculateLaplace('t^2*exp(3*t)');
    expect(res.result).toBe('2/(s - 3)^3');
    expect(res.resultLatex).toBe('\\frac{2}{(s - 3)^{3}}');
  });

  it('computes damped wave exp(-2*t)*sin(4*t)', () => {
    const res = calculateLaplace('exp(-2*t)*sin(4*t)');
    expect(res.result).toBe('4/((s + 2)^2 + 16)');
    expect(res.resultLatex).toBe('\\frac{4}{(s + 2)^{2} + 16}');
  });
});

describe('Inverse Laplace Transform Engine', () => {
  it('inverts step function 1/s', () => {
    const res = calculateInverseLaplace('1/s');
    expect(res.resultFt).toBe('1');
    expect(res.resultLatex).toBe('1');
  });

  it('inverts linear monomial 1/s^2', () => {
    const res = calculateInverseLaplace('1/s^2');
    expect(res.resultFt).toBe('t');
    expect(res.resultLatex).toBe('t');
  });

  it('inverts scaled linear monomial 3/s^2', () => {
    const res = calculateInverseLaplace('3/s^2');
    expect(res.resultFt).toBe('3*t');
    expect(res.resultLatex).toBe('3t');
  });

  it('inverts exponential pole 1/(s-3)', () => {
    const res = calculateInverseLaplace('1/(s-3)');
    expect(res.resultFt).toBe('e^(3t)');
    expect(res.resultLatex).toBe('e^{3t}');
  });

  it('inverts quadratic sine pole 1/(s^2+4)', () => {
    const res = calculateInverseLaplace('1/(s^2+4)');
    expect(res.resultFt).toBe('(1/2)*sin(2t)');
    expect(res.resultLatex).toBe('\\frac{1}{2} \\sin(2t)');
  });

  it('inverts quadratic cosine pole s/(s^2+9)', () => {
    const res = calculateInverseLaplace('s/(s^2+9)');
    expect(res.resultFt).toBe('cos(3t)');
    expect(res.resultLatex).toBe('\\cos(3t)');
  });
});
