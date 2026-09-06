import { formatNumber } from '../utils/formatting';
import * as math from 'mathjs';

export interface QuadraticSolution {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  rootType: 'two_distinct_real' | 'one_repeated_real' | 'two_complex_conjugate';
  roots: { real: number; imag: number; formatted: string }[];
  vertex: { x: number; y: number };
  axisOfSymmetry: number;
  stepsFormula: string[];
  stepsCompletingSquare: string[];
  factoredForm: string;
}

export interface EquationSolution {
  equation: string;
  variable: string;
  solution: string;
  steps: string[];
}

/**
 * Solves quadratic equation ax² + bx + c = 0 with full quadratic formula steps and completing-the-square steps
 */
export function solveQuadratic(a: number, b: number, c: number): QuadraticSolution {
  if (Math.abs(a) < 1e-10) {
    throw new Error('Coefficient "a" must be non-zero for a quadratic equation.');
  }

  const delta = b * b - 4 * a * c;
  const vertexX = -b / (2 * a);
  const vertexY = c - (b * b) / (4 * a);

  const stepsFormula: string[] = [
    `Quadratic equation in standard form: ${a}x² + ${b}x + ${c} = 0`,
    `Identify coefficients: a = ${a}, b = ${b}, c = ${c}`,
    `1. Calculate Discriminant: Δ = b² - 4ac`,
    `Δ = (${b})² - 4(${a})(${c}) = ${b * b} - ${4 * a * c} = ${delta}`,
    `Quadratic Formula: x = (-b ± √Δ) / (2a)`
  ];

  const stepsSquare: string[] = [
    `Completing the square on ${a}x² + ${b}x + ${c} = 0:`,
    `1. Divide throughout by leading coefficient a = ${a}: x² + (${b}/${a})x + (${c}/${a}) = 0`,
    `2. Move constant term to RHS: x² + (${formatNumber(b/a)})x = ${formatNumber(-c/a)}`,
    `3. Add (b / 2a)² = (${formatNumber(b/(2*a))})² = ${formatNumber((b*b)/(4*a*a))} to both sides:`,
    `(x + ${formatNumber(b/(2*a))})² = ${formatNumber(-c/a + (b*b)/(4*a*a))}`,
    `4. Take square root of both sides: x + ${formatNumber(b/(2*a))} = ±√(${formatNumber(-c/a + (b*b)/(4*a*a))})`
  ];

  let rootType: 'two_distinct_real' | 'one_repeated_real' | 'two_complex_conjugate';
  const roots: { real: number; imag: number; formatted: string }[] = [];
  let factored = '';

  if (Math.abs(delta) < 1e-9) {
    rootType = 'one_repeated_real';
    const r = vertexX;
    roots.push({ real: r, imag: 0, formatted: `x = ${clean(r)}` });
    stepsFormula.push(`Since Δ = 0, there is exactly one repeated real root:`, `x = -(${b}) / (2 · ${a}) = ${clean(r)}`);
    factored = `${a === 1 ? '' : `${a}`}·(x - ${clean(r)})² = 0`;
  } else if (delta > 0) {
    rootType = 'two_distinct_real';
    const sqrtD = Math.sqrt(delta);
    const r1 = (-b + sqrtD) / (2 * a);
    const r2 = (-b - sqrtD) / (2 * a);
    roots.push(
      { real: r1, imag: 0, formatted: `x₁ = ${clean(r1)}` },
      { real: r2, imag: 0, formatted: `x₂ = ${clean(r2)}` }
    );
    stepsFormula.push(
      `Since Δ > 0, there are two distinct real roots:`,
      `x₁ = (-(${b}) + √${delta}) / (2 · ${a}) = (${-b} + ${clean(sqrtD)}) / ${2 * a} = ${clean(r1)}`,
      `x₂ = (-(${b}) - √${delta}) / (2 · ${a}) = (${-b} - ${clean(sqrtD)}) / ${2 * a} = ${clean(r2)}`
    );
    factored = `${a === 1 ? '' : `${a}`}·(x - ${clean(r1)})·(x - ${clean(r2)}) = 0`;
  } else {
    rootType = 'two_complex_conjugate';
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-delta) / (2 * Math.abs(a));
    roots.push(
      { real: realPart, imag: imagPart, formatted: `x₁ = ${clean(realPart)} + ${clean(imagPart)}i` },
      { real: realPart, imag: -imagPart, formatted: `x₂ = ${clean(realPart)} - ${clean(imagPart)}i` }
    );
    stepsFormula.push(
      `Since Δ < 0, there are two complex conjugate roots:`,
      `√Δ = √(${delta}) = i√${-delta} = ${clean(Math.sqrt(-delta))}i`,
      `x = [ -(${b}) ± ${clean(Math.sqrt(-delta))}i ] / ${2 * a}`,
      `x₁ = ${clean(realPart)} + ${clean(imagPart)}i`,
      `x₂ = ${clean(realPart)} - ${clean(imagPart)}i`
    );
    factored = `${a === 1 ? '' : `${a}`}·[(x - ${clean(realPart)})² + ${clean(imagPart * imagPart)}] = 0`;
  }

  return {
    a,
    b,
    c,
    discriminant: delta,
    rootType,
    roots,
    vertex: { x: clean(vertexX), y: clean(vertexY) },
    axisOfSymmetry: clean(vertexX),
    stepsFormula,
    stepsCompletingSquare: stepsSquare,
    factoredForm: factored
  };
}

export type QuadraticResult = QuadraticSolution;

/**
 * Expands and simplifies algebraic expressions using mathjs
 */
export function expandAndSimplify(exprInput: string): {
  original: string;
  expanded: string;
  simplified: string;
  steps: string[];
} {
  const steps: string[] = [`Input expression: ${exprInput}`];
  let simplified = exprInput;

  try {
    const node = math.parse(exprInput);
    simplified = math.simplify(node).toString();
    steps.push(`Apply standard algebraic reduction & identity collection:`, `Result: ${simplified}`);
  } catch (e: any) {
    simplified = exprInput;
    steps.push(`Simplification note: ${e.message || 'Expression already in reduced form'}`);
  }

  return {
    original: exprInput,
    expanded: simplified,
    simplified,
    steps
  };
}

export const simplifyExpression = expandAndSimplify;

/**
 * Solves a single linear equation in x: ax + b = c
 */
export function solveLinearEquation(eqStr: string, variable: string = 'x'): EquationSolution {
  const trimmed = eqStr.trim();
  const [lhs, rhs] = trimmed.split('=').map(s => s?.trim());
  if (!lhs || !rhs) throw new Error('Equation must contain left and right sides separated by "=".');

  const steps: string[] = [
    `Given equation: ${trimmed}`,
    `Collect all terms involving variable "${variable}" on LHS and constants on RHS.`
  ];

  // Try parsing using simplify: (lhs) - (rhs) = 0
  const diffExpr = `(${lhs}) - (${rhs})`;
  const simplified = math.simplify(diffExpr).toString();
  steps.push(`Move all terms to LHS: ${simplified} = 0`);

  // If linear form: c1*x + c2 = 0
  try {
    const scope0: Record<string, number> = {};
    scope0[variable] = 0;
    const scope1: Record<string, number> = {};
    scope1[variable] = 1;

    const compiled = math.compile(diffExpr);
    const constTerm = compiled.evaluate(scope0);
    const slope = compiled.evaluate(scope1) - constTerm;

    if (Math.abs(slope) < 1e-9) {
      if (Math.abs(constTerm) < 1e-9) {
        return {
          equation: eqStr,
          variable,
          solution: 'Identity: Infinitely many solutions (x ∈ ℝ)',
          steps: [...steps, '0 = 0: True for all values of x.']
        };
      } else {
        return {
          equation: eqStr,
          variable,
          solution: 'Inconsistent: No solution (contradiction)',
          steps: [...steps, `${constTerm} = 0: Impossible statement.`]
        };
      }
    }

    const sol = -constTerm / slope;
    steps.push(
      `Linear form: ${clean(slope)}·${variable} + (${clean(constTerm)}) = 0`,
      `${clean(slope)}·${variable} = ${clean(-constTerm)}`,
      `${variable} = ${clean(-constTerm)} / ${clean(slope)} = ${clean(sol)}`
    );

    return {
      equation: eqStr,
      variable,
      solution: `${variable} = ${clean(sol)}`,
      steps
    };
  } catch (e: any) {
    throw new Error(`Could not solve equation: ${e.message}`);
  }
}

function clean(val: number): number {
  return Math.round(val * 10000) / 10000;
}
