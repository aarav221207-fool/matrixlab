import * as math from 'mathjs';

// Define matrix type
export type MatrixData = number[][];

// Utility to create a matrix of a specific size
export function createMatrix(rows: number, cols: number, defaultValue: number = 0): MatrixData {
  return Array.from({ length: rows }, () => Array(cols).fill(defaultValue));
}

// Convert string input to numbers, handling expressions
export function parseMatrix(stringMatrix: string[][]): MatrixData {
  return stringMatrix.map(row => 
    row.map(cell => {
      try {
        if (!cell || cell.trim() === '') return 0;
        const evaluated = math.evaluate(cell);
        if (typeof evaluated !== 'number') return Number(evaluated); // Handle complex if needed, but we force number here
        return evaluated;
      } catch (e) {
        throw new Error(`Invalid numeric expression: "${cell}"`);
      }
    })
  );
}

export function add(a: MatrixData, b: MatrixData): MatrixData {
  return math.add(a, b) as unknown as MatrixData;
}

export function subtract(a: MatrixData, b: MatrixData): MatrixData {
  return math.subtract(a, b) as unknown as MatrixData;
}

export function multiply(a: MatrixData, b: MatrixData): MatrixData {
  return math.multiply(a, b) as unknown as MatrixData;
}

export function multiplyScalar(a: MatrixData, scalar: number): MatrixData {
  return math.multiply(a, scalar) as unknown as MatrixData;
}

export function transpose(a: MatrixData): MatrixData {
  return math.transpose(a) as unknown as MatrixData;
}

export function determinant(a: MatrixData): number {
  if (a.length !== a[0].length) throw new Error('Determinant requires a square matrix.');
  return math.det(a);
}

export function trace(a: MatrixData): number {
  if (a.length !== a[0].length) throw new Error('Trace requires a square matrix.');
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i][i];
  }
  return sum;
}

export function inverse(a: MatrixData): MatrixData {
  if (a.length !== a[0].length) throw new Error('Inverse requires a square matrix.');
  const d = determinant(a);
  if (Math.abs(d) < 1e-10) throw new Error('Matrix is singular (determinant is zero) and cannot be inverted.');
  const res = math.inv(a);
  // Ensure it returns MatrixData, in case mathjs returns a single number for 1x1
  if (typeof res === 'number') return [[res]];
  return res as MatrixData;
}

export function rref(a: MatrixData, tol: number = 1e-10): { matrix: MatrixData, steps: any[] } {
  let m = a.map(row => [...row]);
  let rows = m.length;
  let cols = m[0].length;
  
  let lead = 0;
  for (let r = 0; r < rows; r++) {
    if (cols <= lead) {
      break;
    }
    let i = r;
    while (Math.abs(m[i][lead]) < tol) {
      i++;
      if (rows === i) {
        i = r;
        lead++;
        if (cols === lead) {
          break;
        }
      }
    }
    if (cols === lead) {
      break;
    }

    // Swap rows i and r
    let temp = m[i];
    m[i] = m[r];
    m[r] = temp;

    // Divide row r by m[r][lead]
    let val = m[r][lead];
    for (let j = 0; j < cols; j++) {
      m[r][j] /= val;
    }

    for (let i = 0; i < rows; i++) {
      if (i !== r) {
        let val = m[i][lead];
        for (let j = 0; j < cols; j++) {
          m[i][j] -= val * m[r][j];
        }
      }
    }
    lead++;
  }
  
  // Clean up floating point errors
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (Math.abs(m[i][j]) < tol) m[i][j] = 0;
    }
  }

  return { matrix: m, steps: [] };
}

export function rank(a: MatrixData): number {
  const reduced = rref(a).matrix;
  let r = 0;
  for (let i = 0; i < reduced.length; i++) {
    if (reduced[i].some(val => Math.abs(val) > 1e-10)) {
      r++;
    }
  }
  return r;
}

export function nullity(a: MatrixData): number {
  return a[0].length - rank(a);
}

export function luDecomp(a: MatrixData): { L: MatrixData, U: MatrixData, p: number[] } {
  const result = math.lup(a) as any;
  return { L: (result.L.valueOf ? result.L.valueOf() : result.L) as MatrixData, U: (result.U.valueOf ? result.U.valueOf() : result.U) as MatrixData, p: result.p as number[] };
}

export function qrDecomp(a: MatrixData): { Q: MatrixData, R: MatrixData } {
  const result = math.qr(a) as any;
  return { Q: (result.Q.valueOf ? result.Q.valueOf() : result.Q) as MatrixData, R: (result.R.valueOf ? result.R.valueOf() : result.R) as MatrixData };
}

export function eigen(a: MatrixData): { values: any[], vectors: MatrixData } {
  if (a.length !== a[0].length) throw new Error('Eigenvalues require a square matrix.');
  const result = math.eigs(a) as any;
  // Extract values and matrix of eigenvectors
  const vectors = result.eigenvectors ? result.eigenvectors.map((ev: any) => ev.vector) : [];
  // Transpose vectors because mathjs eigs returns arrays as rows in the vector property usually, actually let's format it cleanly.
  // Wait, math.eigs eigenvectors is an array of {value, vector}. The vectors are 1D arrays. 
  // We want the columns to be the eigenvectors.
  const vectorCols = vectors.length > 0 && Array.isArray(vectors[0]) ? math.transpose(vectors) : vectors;
  
  return { values: result.values as any[], vectors: vectorCols as MatrixData };
}

export function elementWiseMultiply(a: MatrixData, b: MatrixData): MatrixData {
  return math.dotMultiply(a, b) as unknown as MatrixData;
}

export function elementWiseDivide(a: MatrixData, b: MatrixData): MatrixData {
  return math.dotDivide(a, b) as unknown as MatrixData;
}

export function kroneckerProduct(a: MatrixData, b: MatrixData): MatrixData {
  const res = math.kron(a, b) as any;
  return (res.valueOf ? res.valueOf() : res) as unknown as MatrixData;
}

export function solveLinear(a: MatrixData, b: MatrixData): MatrixData {
  if (a.length !== a[0].length) throw new Error('Solving Ax=b requires a square matrix A.');
  if (a.length !== b.length) throw new Error('Dimensions of A and b do not match.');
  const res = math.lusolve(a, b) as any;
  return (res.valueOf ? res.valueOf() : res) as unknown as MatrixData;
}

export function norm(a: MatrixData, type: 'fro' | 1 | 'inf' = 'fro'): number {
  return math.norm(a, type) as number;
}

export function conditionNumber(a: MatrixData): number {
  if (a.length !== a[0].length) throw new Error('Condition number requires a square matrix.');
  return norm(a, 'fro') * norm(pinv(a), 'fro');
}

export function isSymmetric(a: MatrixData): boolean {
  if (a.length !== a[0].length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < i; j++) {
      if (Math.abs(a[i][j] - a[j][i]) > 1e-10) return false;
    }
  }
  return true;
}

export function isOrthogonal(a: MatrixData): boolean {
  if (a.length !== a[0].length) return false;
  const t = transpose(a);
  const m = multiply(a, t);
  const id = math.identity(a.length).valueOf() as MatrixData;
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < m[0].length; j++) {
      if (Math.abs(m[i][j] - id[i][j]) > 1e-10) return false;
    }
  }
  return true;
}

export function pinv(a: MatrixData): MatrixData {

  // Moore-Penrose pseudo-inverse using SVD or simple formula if full rank
  // math.pinv is available in mathjs
  return math.pinv(a) as unknown as MatrixData;
}

export function matrixPower(a: MatrixData, p: number): MatrixData {
  if (a.length !== a[0].length) throw new Error('Power requires a square matrix.');
  // Need to loop for integer powers or use eigenvalue decomp. Since mathjs has pow:
  let res: any = a;
  for(let i=1; i<p; i++){
      res = math.multiply(res, a);
  }
  if(p === 0) {
      return math.identity(a.length).valueOf() as MatrixData;
  }
  return res as MatrixData;
}

export function minor(a: MatrixData, row: number, col: number): MatrixData {
  return a.filter((_, i) => i !== row).map(r => r.filter((_, j) => j !== col));
}

export function cofactorMatrix(a: MatrixData): MatrixData {
  if (a.length !== a[0].length) throw new Error('Cofactor requires a square matrix.');
  let n = a.length;
  let result = createMatrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let m = minor(a, i, j);
      let d = determinant(m);
      result[i][j] = Math.pow(-1, i + j) * d;
    }
  }
  return result;
}

export function adjugate(a: MatrixData): MatrixData {
  return transpose(cofactorMatrix(a));
}

// Ensure results are not displaying float artifacts like 0.999999999999
export function cleanFloat(val: number, precision: number = 4): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(val * multiplier) / multiplier;
}

export function cleanMatrix(a: MatrixData, precision: number = 4): MatrixData {
  return a.map(row => row.map(val => cleanFloat(val, precision)));
}
