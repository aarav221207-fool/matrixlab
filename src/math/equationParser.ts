import { MatrixData } from '../lib/math';

export interface ParsedEquationSystem {
  variables: string[];
  A: MatrixData;
  B: number[];
  augmented: MatrixData;
  equations: string[];
  equationsFormatted: string[];
}

/**
 * Parses a system of linear equations like:
 * "2x + y = 5"
 * "x - y = 1"
 * or "2x1 + 3x2 - x3 = 7"
 * Handles negative coefficients, decimals, fractions (e.g. 1/2x), terms on both sides (e.g. 2x = 5 - y)
 */
export function parseEquationsToMatrix(input: string): ParsedEquationSystem {
  const lines = input
    .split(/\r?\n|;/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.includes('='));

  if (lines.length === 0) {
    throw new Error('No valid equations found. Each equation must contain an equals sign (=).');
  }

  // Step 1: Detect all variable names across all equations
  // Variables are tokens like x, y, z, x1, x2, a, b, etc. (alphabetic characters followed by optional digits)
  const varSet = new Set<string>();
  const varRegex = /[a-zA-Z][a-zA-Z0-9_]*/g;

  // We should ignore standard function names if any, but in linear equations variables are simple identifiers
  for (const line of lines) {
    const matches = line.match(varRegex);
    if (matches) {
      for (const m of matches) {
        // Exclude 'e' or 'pi' if they appear purely as constants, but in linear eq typically variables
        varSet.add(m);
      }
    }
  }

  // Sort variables naturally: x, y, z or x1, x2, x3 or alphabetical
  const variables = Array.from(varSet).sort((a, b) => {
    // If format x1, x2
    const aMatch = a.match(/^([a-zA-Z]+)(\d+)$/);
    const bMatch = b.match(/^([a-zA-Z]+)(\d+)$/);
    if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
      return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
    }
    // standard x, y, z order preference
    const order = ['x', 'y', 'z', 'w', 'u', 'v', 'a', 'b', 'c', 'd'];
    const idxA = order.indexOf(a.toLowerCase());
    const idxB = order.indexOf(b.toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  if (variables.length === 0) {
    throw new Error('No variables detected in the equations.');
  }

  const A: MatrixData = [];
  const B: number[] = [];
  const augmented: MatrixData = [];
  const equationsFormatted: string[] = [];

  for (const line of lines) {
    const [leftSide, rightSide] = line.split('=').map(s => s.trim());
    if (!leftSide || !rightSide) {
      throw new Error(`Malformed equation: "${line}"`);
    }

    // Move all terms to LHS: Left - (Right) = 0
    // Track coefficients for each variable and the total constant on RHS
    const coeffs: Record<string, number> = {};
    for (const v of variables) coeffs[v] = 0;
    let constantOnRHS = 0;

    // Parse LHS terms (positive sign by default)
    parseSide(leftSide, 1, coeffs, c => { constantOnRHS -= c; }, variables);
    // Parse RHS terms (negative sign when moved to LHS, so constant stays positive on RHS)
    parseSide(rightSide, -1, coeffs, c => { constantOnRHS += c; }, variables);

    const rowA: number[] = variables.map(v => coeffs[v] || 0);
    A.push(rowA);
    B.push(constantOnRHS);
    augmented.push([...rowA, constantOnRHS]);

    // Format normalized equation
    const lhsParts: string[] = [];
    variables.forEach((v, idx) => {
      const coeff = rowA[idx];
      if (Math.abs(coeff) > 1e-10) {
        const sign = coeff > 0 ? (lhsParts.length > 0 ? '+ ' : '') : '- ';
        const absVal = Math.abs(coeff);
        const coeffStr = absVal === 1 ? '' : `${absVal}`;
        lhsParts.push(`${sign}${coeffStr}${v}`);
      }
    });
    equationsFormatted.push(`${lhsParts.length > 0 ? lhsParts.join(' ') : '0'} = ${constantOnRHS}`);
  }

  return {
    variables,
    A,
    B,
    augmented,
    equations: lines,
    equationsFormatted,
  };
}

function parseSide(
  expr: string,
  sideMultiplier: number,
  coeffs: Record<string, number>,
  addConstant: (c: number) => void,
  allVars: string[]
) {
  // Normalize string: ensure signs have space around them or split tokens
  // e.g. "2x + 3y - 5/2z - 7"
  // Replace minus with + - to split by +
  let normalized = expr.replace(/\s+/g, '');
  // Insert '+' before any '-' that is not immediately preceded by an operator or start of string
  normalized = normalized.replace(/([^-+*/^])-/g, '$1+-');

  const terms = normalized.split('+').filter(t => t.length > 0);

  for (const term of terms) {
    // Check if this term contains any variable
    let matchedVar: string | null = null;
    for (const v of allVars) {
      if (term.endsWith(v) || term.includes(v)) {
        // Ensure it's not a substring of another variable (e.g. x in x1)
        const regex = new RegExp(`\\b${v}\\b`);
        if (regex.test(term) || term.endsWith(v)) {
          matchedVar = v;
          break;
        }
      }
    }

    if (matchedVar) {
      // Extract coefficient
      const coeffStr = term.replace(matchedVar, '').trim();
      let coeff = 1;
      if (coeffStr === '' || coeffStr === '+') {
        coeff = 1;
      } else if (coeffStr === '-') {
        coeff = -1;
      } else {
        coeff = parseNumberOrFraction(coeffStr);
      }
      coeffs[matchedVar] = (coeffs[matchedVar] || 0) + coeff * sideMultiplier;
    } else {
      // Pure constant term
      const num = parseNumberOrFraction(term);
      addConstant(num * sideMultiplier);
    }
  }
}

function parseNumberOrFraction(str: string): number {
  if (str.includes('/')) {
    const [num, den] = str.split('/').map(s => parseFloat(s));
    if (isNaN(num) || isNaN(den) || den === 0) {
      throw new Error(`Invalid fractional term: "${str}"`);
    }
    return num / den;
  }
  const val = parseFloat(str);
  if (isNaN(val)) {
    throw new Error(`Invalid number in equation: "${str}"`);
  }
  return val;
}
