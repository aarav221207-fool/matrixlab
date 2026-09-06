import { MatrixData } from '../lib/math';
import { formatNumber } from '../utils/formatting';

export interface RowStep {
  description: string;
  matrix: MatrixData;
  pivotRow?: number;
  pivotCol?: number;
}

export type SolutionType = 'unique' | 'none' | 'infinite';

export interface LinearSystemResult {
  A: MatrixData;
  B: number[];
  variables: string[];
  augmented: MatrixData;
  rrefMatrix: MatrixData;
  solutionType: SolutionType;
  solutionSummary: string;
  solutionVector?: number[];
  parametricForm?: string[];
  steps: RowStep[];
  rankA: number;
  rankAug: number;
  nVariables: number;
}

/**
 * Solves a linear system Ax = B or augmented matrix [A|B] with complete step-by-step row operations.
 */
export function solveLinearSystem(
  AInput: MatrixData,
  BInput: number[],
  varNames?: string[]
): LinearSystemResult {
  const m = AInput.length;
  const n = AInput[0]?.length || 0;

  if (m === 0 || n === 0) {
    throw new Error('Matrix A must have at least 1 row and 1 column.');
  }
  if (BInput.length !== m) {
    throw new Error(`Dimension mismatch: Matrix has ${m} rows, but vector B has ${BInput.length} entries.`);
  }

  const variables = varNames && varNames.length === n
    ? varNames
    : Array.from({ length: n }, (_, i) => (n <= 3 ? ['x', 'y', 'z'][i] : `x${i + 1}`));

  // Create augmented matrix [A | B]
  const aug: MatrixData = AInput.map((row, i) => [...row, BInput[i]]);
  const steps: RowStep[] = [
    {
      description: 'Initial augmented matrix [A | B]',
      matrix: aug.map(r => [...r])
    }
  ];

  let current = aug.map(r => [...r]);
  const tol = 1e-10;
  let pivotRow = 0;
  const pivotCols: number[] = [];

  for (let col = 0; col < n && pivotRow < m; col++) {
    // Partial pivoting: find maximum element in this column from pivotRow down
    let maxVal = Math.abs(current[pivotRow][col]);
    let maxIdx = pivotRow;
    for (let r = pivotRow + 1; r < m; r++) {
      if (Math.abs(current[r][col]) > maxVal) {
        maxVal = Math.abs(current[r][col]);
        maxIdx = r;
      }
    }

    if (maxVal < tol) {
      // Free variable or redundant column
      continue;
    }

    // Swap rows if needed
    if (maxIdx !== pivotRow) {
      const temp = current[pivotRow];
      current[pivotRow] = current[maxIdx];
      current[maxIdx] = temp;
      steps.push({
        description: `Swap Row ${pivotRow + 1} and Row ${maxIdx + 1} to maximize pivot magnitude (${formatNumber(current[pivotRow][col])})`,
        matrix: current.map(r => [...r]),
        pivotRow,
        pivotCol: col
      });
    }

    // Scale pivot row to 1
    const pivotVal = current[pivotRow][col];
    if (Math.abs(pivotVal - 1) > tol) {
      const invPivot = 1 / pivotVal;
      for (let j = 0; j <= n; j++) {
        current[pivotRow][j] *= invPivot;
      }
      steps.push({
        description: `Scale Row ${pivotRow + 1}: R${pivotRow + 1} → (${formatNumber(invPivot)}) × R${pivotRow + 1}`,
        matrix: current.map(r => [...r]),
        pivotRow,
        pivotCol: col
      });
    }

    // Eliminate all other rows in this column
    for (let r = 0; r < m; r++) {
      if (r !== pivotRow && Math.abs(current[r][col]) > tol) {
        const factor = current[r][col];
        for (let j = 0; j <= n; j++) {
          current[r][j] -= factor * current[pivotRow][j];
        }
        steps.push({
          description: `Eliminate entry at (${r + 1}, ${col + 1}): R${r + 1} → R${r + 1} - (${formatNumber(factor)}) × R${pivotRow + 1}`,
          matrix: current.map(r => [...r]),
          pivotRow: r,
          pivotCol: col
        });
      }
    }

    pivotCols.push(col);
    pivotRow++;
  }

  // Clean numerical artifacts
  for (let i = 0; i < m; i++) {
    for (let j = 0; j <= n; j++) {
      if (Math.abs(current[i][j]) < tol) current[i][j] = 0;
    }
  }

  // Calculate ranks
  let rankA = 0;
  let rankAug = 0;
  
  for (let r = 0; r < m; r++) {
    const isZeroLHS = current[r].slice(0, n).every(v => Math.abs(v) < tol);
    const nonZeroRHS = Math.abs(current[r][n]) > tol;
    
    if (!isZeroLHS) {
      rankA++;
      rankAug++;
    } else if (nonZeroRHS) {
      rankAug++;
    }
  }

  if (rankA !== rankAug) {
    // Inconsistent system (No Solution)
    return {
      A: AInput,
      B: BInput,
      variables,
      augmented: aug,
      rrefMatrix: current,
      solutionType: 'none',
      solutionSummary: `NO SOLUTION. Contradiction reached. rank(A) = ${rankA} ≠ rank([A|b]) = ${rankAug}.`,
      steps,
      rankA,
      rankAug,
      nVariables: n
    };
  }

  // Check if unique or infinite
  if (rankA === n) {
    // Exactly one unique solution
    const solVec = Array(n).fill(0);
    for (let i = 0; i < rankA; i++) {
      const col = pivotCols[i];
      solVec[col] = current[i][n];
    }

    const summary = variables.map((v, i) => `${v} = ${formatNumber(solVec[i])}`).join(', ');

    return {
      A: AInput,
      B: BInput,
      variables,
      augmented: aug,
      rrefMatrix: current,
      solutionType: 'unique',
      solutionSummary: `UNIQUE SOLUTION. rank(A) = rank([A|b]) = ${rankA}. Number of variables = ${n}.`,
      solutionVector: solVec,
      steps,
      rankA,
      rankAug,
      nVariables: n
    };
  } else {
    // Infinitely many solutions (free variables present)
    const freeCols = Array.from({ length: n }, (_, i) => i).filter(i => !pivotCols.includes(i));
    const parametric: string[] = [];
    
    // Create parameter names t1, t2, etc., or just t, s, r
    const paramNames = ['t', 's', 'r', 'u', 'v', 'w'];
    const getParamName = (idx: number) => {
      if (freeCols.length === 1) return 't';
      return idx < paramNames.length ? paramNames[idx] : `t_${idx + 1}`;
    };

    // Express each basic variable in terms of free variables
    for (let i = 0; i < rankA; i++) {
      const basicCol = pivotCols[i];
      const constTerm = current[i][n];
      const terms: string[] = [];
      if (Math.abs(constTerm) > tol) terms.push(`${formatNumber(constTerm)}`);

      for (let f = 0; f < freeCols.length; f++) {
        const freeCol = freeCols[f];
        const coeff = -current[i][freeCol];
        if (Math.abs(coeff) > tol) {
          const sign = coeff > 0 ? (terms.length > 0 ? '+ ' : '') : '- ';
          const absCoeff = Math.abs(coeff);
          const coeffStr = Math.abs(absCoeff - 1) < tol ? '' : `${formatNumber(absCoeff)}`;
          terms.push(`${sign}${coeffStr}${getParamName(f)}`);
        }
      }
      parametric.push(`${variables[basicCol]} = ${terms.length > 0 ? terms.join(' ') : '0'}`);
    }

    for (let f = 0; f < freeCols.length; f++) {
      const freeCol = freeCols[f];
      parametric.push(`Let ${variables[freeCol]} = ${getParamName(f)} (free parameter)`);
    }

    return {
      A: AInput,
      B: BInput,
      variables,
      augmented: aug,
      rrefMatrix: current,
      solutionType: 'infinite',
      solutionSummary: `INFINITELY MANY SOLUTIONS. rank(A) = rank([A|b]) = ${rankA} < variables (${n}).`,
      parametricForm: parametric,
      steps,
      rankA,
      rankAug,
      nVariables: n
    };
  }
}
