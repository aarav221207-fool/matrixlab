export interface SummaryStatistics {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  min: number;
  max: number;
  range: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  sampleVariance: number;
  populationVariance: number;
  sampleStdDev: number;
  populationStdDev: number;
  outliers: number[];
  zScores: { value: number; z: number }[];
  steps: string[];
}

export interface BivariateStatistics {
  count: number;
  meanX: number;
  meanY: number;
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  covariance: number;
  regressionEquation: string;
  points: { x: number; y: number }[];
  steps: string[];
}

export interface BinomialDistributionResult {
  n: number;
  p: number;
  k: number;
  probExact: number;
  probAtMost: number;
  probAtLeast: number;
  mean: number;
  variance: number;
  stdDev: number;
  steps: string[];
}

export interface NormalDistributionResult {
  mean: number;
  stdDev: number;
  x: number;
  zScore: number;
  pdf: number;
  cdfLessOrEqual: number;
  cdfGreater: number;
  steps: string[];
}

export function computeSummaryStatistics(data: number[]): SummaryStatistics {
  if (data.length === 0) throw new Error('Data array cannot be empty.');
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Modes
  const counts: Record<number, number> = {};
  let maxCount = 0;
  for (const v of sorted) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > maxCount) maxCount = counts[v];
  }
  const modes = maxCount > 1 ? Object.keys(counts).filter(k => counts[parseFloat(k)] === maxCount).map(parseFloat) : [];

  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Quartiles
  const q2 = median;
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = n % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

  const calcMedian = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const m = Math.floor(arr.length / 2);
    return arr.length % 2 === 0 ? (arr[m - 1] + arr[m]) / 2 : arr[m];
  };

  const q1 = calcMedian(lowerHalf);
  const q3 = calcMedian(upperHalf);
  const iqr = q3 - q1;

  // Outliers: < Q1 - 1.5*IQR or > Q3 + 1.5*IQR
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

  // Variance & StdDev
  const ss = sorted.reduce((acc, v) => acc + (v - mean) * (v - mean), 0);
  const popVar = ss / n;
  const sampVar = n > 1 ? ss / (n - 1) : 0;
  const popStd = Math.sqrt(popVar);
  const sampStd = Math.sqrt(sampVar);

  // Z-scores
  const zScores = sorted.map(v => ({
    value: v,
    z: sampStd > 0 ? clean((v - mean) / sampStd) : 0
  }));

  const steps = [
    `Sample Size n = ${n}`,
    `Sum = ${clean(sum)}, Mean x̄ = ${clean(mean)}`,
    `Median (Q2) = ${clean(median)}, Min = ${min}, Max = ${max}, Range = ${clean(range)}`,
    `Quartiles: Q1 = ${clean(q1)}, Q3 = ${clean(q3)}, IQR = ${clean(iqr)}`,
    `Outlier Boundaries: [${clean(lowerFence)}, ${clean(upperFence)}]. Detected Outliers: ${outliers.length > 0 ? outliers.join(', ') : 'None'}`,
    `Sample Variance s² = ${clean(sampVar)}, Sample Standard Deviation s = ${clean(sampStd)}`,
    `Population Variance σ² = ${clean(popVar)}, Population Standard Deviation σ = ${clean(popStd)}`
  ];

  return {
    count: n,
    sum: clean(sum),
    mean: clean(mean),
    median: clean(median),
    modes,
    min,
    max,
    range: clean(range),
    q1: clean(q1),
    q2: clean(q2),
    q3: clean(q3),
    iqr: clean(iqr),
    sampleVariance: clean(sampVar),
    populationVariance: clean(popVar),
    sampleStdDev: clean(sampStd),
    populationStdDev: clean(popStd),
    outliers,
    zScores,
    steps
  };
}

export function computeLinearRegression(points: { x: number; y: number }[]): BivariateStatistics {
  const n = points.length;
  if (n < 2) throw new Error('At least 2 coordinate pairs are required for linear regression.');

  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    ssXX += dx * dx;
    ssYY += dy * dy;
    ssXY += dx * dy;
  }

  if (ssXX < 1e-10) throw new Error('All x-coordinates are identical (vertical line). Slope is undefined.');

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const covariance = ssXY / (n - 1);
  const r = ssYY > 1e-10 ? ssXY / Math.sqrt(ssXX * ssYY) : 1;
  const rSquared = r * r;

  const regEq = `y = ${clean(slope)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(clean(intercept))}`;

  const steps = [
    `Paired observations: ${n} points`,
    `Means: x̄ = ${clean(meanX)}, ȳ = ${clean(meanY)}`,
    `Sum of squares: SS_xx = ${clean(ssXX)}, SS_yy = ${clean(ssYY)}, SS_xy = ${clean(ssXY)}`,
    `Slope m = SS_xy / SS_xx = ${clean(slope)}`,
    `Intercept b = ȳ - m·x̄ = ${clean(intercept)}`,
    `Regression Model: ${regEq}`,
    `Pearson correlation coefficient r = ${clean(r)} (${Math.abs(r) > 0.8 ? 'Strong' : Math.abs(r) > 0.5 ? 'Moderate' : 'Weak'} linear association)`,
    `Coefficient of determination R² = ${clean(rSquared)} (${clean(rSquared * 100)}% of variance explained)`
  ];

  return {
    count: n,
    meanX: clean(meanX),
    meanY: clean(meanY),
    slope: clean(slope),
    intercept: clean(intercept),
    r: clean(r),
    rSquared: clean(rSquared),
    covariance: clean(covariance),
    regressionEquation: regEq,
    points,
    steps
  };
}

export function computeBinomial(n: number, p: number, k: number): BinomialDistributionResult {
  if (p < 0 || p > 1) throw new Error('Probability p must be in [0, 1].');
  if (k < 0 || k > n) throw new Error('k must be between 0 and n.');

  const mean = n * p;
  const variance = n * p * (1 - p);
  const stdDev = Math.sqrt(variance);

  const binomPmf = (trials: number, prob: number, successes: number) => {
    return combination(trials, successes) * Math.pow(prob, successes) * Math.pow(1 - prob, trials - successes);
  };

  const probExact = binomPmf(n, p, k);
  let probAtMost = 0;
  for (let i = 0; i <= k; i++) probAtMost += binomPmf(n, p, i);
  const probAtLeast = 1 - (probAtMost - probExact);

  const steps = [
    `Binomial Distribution B(n = ${n}, p = ${p})`,
    `Mean μ = n·p = ${clean(mean)}`,
    `Variance σ² = n·p·(1-p) = ${clean(variance)}, Std Dev σ = ${clean(stdDev)}`,
    `P(X = ${k}) = C(${n}, ${k}) · (${p})^${k} · (1-${p})^${n - k} = ${clean(probExact)}`,
    `Cumulative P(X ≤ ${k}) = ∑_{i=0}^{${k}} P(X = i) = ${clean(probAtMost)}`,
    `Complementary P(X ≥ ${k}) = 1 - P(X < ${k}) = ${clean(probAtLeast)}`
  ];

  return {
    n,
    p,
    k,
    probExact: clean(probExact),
    probAtMost: clean(probAtMost),
    probAtLeast: clean(probAtLeast),
    mean: clean(mean),
    variance: clean(variance),
    stdDev: clean(stdDev),
    steps
  };
}

export function computeNormal(mean: number, stdDev: number, x: number): NormalDistributionResult {
  if (stdDev <= 0) throw new Error('Standard deviation must be strictly positive.');

  const z = (x - mean) / stdDev;
  const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  const cdfLess = 0.5 * (1 + erf(z / Math.SQRT2));
  const cdfGreater = 1 - cdfLess;

  const steps = [
    `Normal Distribution N(μ = ${mean}, σ = ${stdDev})`,
    `Standardized z-score: z = (x - μ) / σ = (${x} - ${mean}) / ${stdDev} = ${clean(z)}`,
    `Probability Density f(${x}) = ${clean(pdf)}`,
    `Cumulative P(X ≤ ${x}) = Φ(${clean(z)}) = ${clean(cdfLess)} (${clean(cdfLess * 100)}%)`,
    `Upper Tail P(X > ${x}) = 1 - Φ(${clean(z)}) = ${clean(cdfGreater)} (${clean(cdfGreater * 100)}%)`
  ];

  return {
    mean,
    stdDev,
    x,
    zScore: clean(z),
    pdf: clean(pdf),
    cdfLessOrEqual: clean(cdfLess),
    cdfGreater: clean(cdfGreater),
    steps
  };
}

// Error function approximation for normal CDF
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - (k - i))) / i;
  return Math.round(c);
}

function clean(n: number): number {
  return Math.round(n * 10000) / 10000;
}
