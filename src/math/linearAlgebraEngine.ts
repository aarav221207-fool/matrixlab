import { MatrixData, transpose, multiply, inverse, rref, rank, nullity, cleanFloat } from '../lib/math';

export interface VectorOperationsResult {
  u: number[];
  v: number[];
  normU: number;
  normV: number;
  unitU: number[];
  unitV: number[];
  sum: number[];
  diff: number[];
  dotProduct: number;
  angleDeg: number;
  crossProduct?: number[];
  projectionVontoU: number[];
  steps: string[];
}

export interface GramSchmidtResult {
  originalVectors: number[][];
  orthogonalVectors: number[][];
  orthonormalVectors: number[][];
  steps: string[];
}

export interface BasisSpanResult {
  matrix: MatrixData;
  rank: number;
  nullity: number;
  columnSpaceBasis: number[][];
  rowSpaceBasis: number[][];
  nullSpaceBasis: number[][];
  rankNullityTheoremHolds: boolean;
  steps: string[];
}

export interface LeastSquaresResult {
  A: MatrixData;
  b: number[];
  AtA: MatrixData;
  Atb: number[];
  solution: number[];
  residualNorm: number;
  steps: string[];
}

export function calculateVectorOperations(u: number[], v: number[]): VectorOperationsResult {
  if (u.length !== v.length) throw new Error('Vectors must have the same dimension.');
  const n = u.length;

  const normU = Math.sqrt(u.reduce((acc, val) => acc + val * val, 0));
  const normV = Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));

  const unitU = normU > 1e-10 ? u.map(x => clean(x / normU)) : u;
  const unitV = normV > 1e-10 ? v.map(x => clean(x / normV)) : v;

  const sum = u.map((x, i) => clean(x + v[i]));
  const diff = u.map((x, i) => clean(x - v[i]));

  const dotProduct = clean(u.reduce((acc, val, i) => acc + val * v[i], 0));

  let angleDeg = 0;
  if (normU > 1e-10 && normV > 1e-10) {
    const cosTheta = Math.max(-1, Math.min(1, dotProduct / (normU * normV)));
    angleDeg = clean((Math.acos(cosTheta) * 180) / Math.PI);
  }

  // Cross product if 3D
  let crossProduct: number[] | undefined;
  if (n === 3) {
    crossProduct = [
      clean(u[1] * v[2] - u[2] * v[1]),
      clean(u[2] * v[0] - u[0] * v[2]),
      clean(u[0] * v[1] - u[1] * v[0])
    ];
  }

  // Projection of v onto u: proj_u(v) = (u·v / |u|^2) * u
  const projScalar = normU > 1e-10 ? dotProduct / (normU * normU) : 0;
  const projectionVontoU = u.map(x => clean(x * projScalar));

  const steps = [
    `Vector u = [${u.join(', ')}], Vector v = [${v.join(', ')}]`,
    `1. Magnitudes: ||u|| = √(${u.map(x => `${x}²`).join(' + ')}) = ${clean(normU)}, ||v|| = ${clean(normV)}`,
    `2. Dot Product: u · v = ${u.map((x, i) => `(${x})(${v[i]})`).join(' + ')} = ${dotProduct}`,
    `3. Angle between vectors: θ = arccos( (u · v) / (||u||·||v||) ) = ${angleDeg}°`,
    `4. Projection of v onto u: proj_u(v) = [ (u · v) / ||u||² ] · u = ${clean(projScalar)} · [${u.join(', ')}] = [${projectionVontoU.join(', ')}]`
  ];

  if (crossProduct) {
    steps.push(`5. Cross Product u × v = [ ${crossProduct.join(', ')} ]`);
  }

  return {
    u,
    v,
    normU: clean(normU),
    normV: clean(normV),
    unitU,
    unitV,
    sum,
    diff,
    dotProduct,
    angleDeg,
    crossProduct,
    projectionVontoU,
    steps
  };
}

export function gramSchmidt(vectors: number[][]): GramSchmidtResult {
  if (vectors.length === 0) throw new Error('At least one vector is required.');
  const dim = vectors[0].length;
  for (const v of vectors) {
    if (v.length !== dim) throw new Error('All vectors must have identical dimensions.');
  }

  const uVectors: number[][] = [];
  const eVectors: number[][] = [];
  const steps: string[] = ['Gram-Schmidt Orthogonalization Process:'];

  for (let k = 0; k < vectors.length; k++) {
    const vk = vectors[k];
    let uk = [...vk];

    // Subtract projections onto earlier u vectors
    for (let j = 0; j < k; j++) {
      const uj = uVectors[j];
      const dotVkUj = vk.reduce((acc, val, i) => acc + val * uj[i], 0);
      const dotUjUj = uj.reduce((acc, val) => acc + val * val, 0);

      if (dotUjUj > 1e-10) {
        const factor = dotVkUj / dotUjUj;
        uk = uk.map((val, i) => val - factor * uj[i]);
      }
    }

    uVectors.push(uk.map(x => clean(x)));

    // Normalize to orthonormal
    const normUk = Math.sqrt(uk.reduce((acc, val) => acc + val * val, 0));
    if (normUk > 1e-10) {
      eVectors.push(uk.map(x => clean(x / normUk)));
    } else {
      eVectors.push(uk.map(() => 0));
    }

    steps.push(
      `Step ${k + 1}: v_${k + 1} = [${vk.join(', ')}]`,
      `u_${k + 1} = v_${k + 1} - ∑ proj_{u_j}(v_${k + 1}) = [${uVectors[k].join(', ')}]`,
      `Normalized e_${k + 1} = u_${k + 1} / ||u_${k + 1}|| = [${eVectors[k].join(', ')}]`
    );
  }

  return {
    originalVectors: vectors,
    orthogonalVectors: uVectors,
    orthonormalVectors: eVectors,
    steps
  };
}

export function computeBasisAndSpan(A: MatrixData): BasisSpanResult {
  const m = A.length;
  const n = A[0].length;

  const rrefData = rref(A);
  const R = rrefData.matrix;
  const r = rank(A);
  const nullDim = nullity(A);

  // Identify pivot columns
  const pivotCols: number[] = [];
  let row = 0;
  for (let col = 0; col < n && row < m; col++) {
    if (Math.abs(R[row][col] - 1) < 1e-6) {
      pivotCols.push(col);
      row++;
    }
  }

  // Column space basis is the pivot columns of ORIGINAL matrix A
  const colSpaceBasis = pivotCols.map(colIdx => A.map(r => r[colIdx]));

  // Row space basis is non-zero rows of RREF(A)
  const rowSpaceBasis = R.filter(r => r.some(v => Math.abs(v) > 1e-6));

  // Null space basis: solve Rx = 0
  const freeCols = Array.from({ length: n }, (_, i) => i).filter(i => !pivotCols.includes(i));
  const nullSpaceBasis: number[][] = [];

  for (const freeCol of freeCols) {
    const nullVec = Array(n).fill(0);
    nullVec[freeCol] = 1;
    for (let pIdx = 0; pIdx < pivotCols.length; pIdx++) {
      const pCol = pivotCols[pIdx];
      nullVec[pCol] = -clean(R[pIdx][freeCol]);
    }
    nullSpaceBasis.push(nullVec);
  }

  const steps = [
    `Matrix size: ${m} × ${n}`,
    `1. Compute RREF(A) to identify pivot columns: [${pivotCols.map(c => c + 1).join(', ')}]`,
    `2. Rank = number of pivot columns = ${r}`,
    `3. Nullity = n - Rank = ${n} - ${r} = ${nullDim}`,
    `4. Rank-Nullity Theorem: Rank(${r}) + Nullity(${nullDim}) = ${n} (Columns of A)`,
    `5. Column Space Basis (from original A columns): ${colSpaceBasis.length} basis vectors`,
    `6. Null Space Basis: ${nullSpaceBasis.length} basis vectors`
  ];

  return {
    matrix: A,
    rank: r,
    nullity: nullDim,
    columnSpaceBasis: colSpaceBasis,
    rowSpaceBasis,
    nullSpaceBasis,
    rankNullityTheoremHolds: r + nullDim === n,
    steps
  };
}

export function solveLeastSquares(A: MatrixData, b: number[]): LeastSquaresResult {
  const m = A.length;
  const n = A[0].length;
  if (b.length !== m) throw new Error(`Dimension mismatch: A has ${m} rows, but b has ${b.length} elements.`);

  // Normal equations: (A^T * A) x = A^T * b
  const At = transpose(A);
  const AtA = multiply(At, A);

  // b as column matrix
  const bMat: MatrixData = b.map(val => [val]);
  const AtbMat = multiply(At, bMat);
  const Atb = AtbMat.map(row => row[0]);

  // Invert AtA
  const invAtA = inverse(AtA);
  const xMat = multiply(invAtA, AtbMat);
  const solution = xMat.map(row => cleanFloat(row[0], 5));

  // Compute residual r = b - Ax
  const AxMat = multiply(A, xMat);
  let residualSumSq = 0;
  for (let i = 0; i < m; i++) {
    const diff = b[i] - AxMat[i][0];
    residualSumSq += diff * diff;
  }
  const residualNorm = clean(Math.sqrt(residualSumSq));

  const steps = [
    `Overdetermined system Ax = b with ${m} observations and ${n} parameters`,
    `1. Form Normal Equations: (AᵀA) x = Aᵀb`,
    `2. Compute AᵀA (${n} × ${n} Gram matrix) and verify non-singularity`,
    `3. Compute Aᵀb vector: [${Atb.map(clean).join(', ')}]`,
    `4. Solve via matrix inversion: x̂ = (AᵀA)⁻¹ Aᵀb = [${solution.join(', ')}]`,
    `5. Residual norm ||b - Ax̂|| = ${residualNorm}`
  ];

  return {
    A,
    b,
    AtA,
    Atb,
    solution,
    residualNorm,
    steps
  };
}

function clean(n: number): number {
  return Math.round(n * 10000) / 10000;
}
