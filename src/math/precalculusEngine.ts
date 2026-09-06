import { formatNumber } from '../utils/formatting';
export interface ArithmeticSequenceResult {
  a1: number;
  d: number;
  n: number;
  an: number;
  sumSn: number;
  formulaAn: string;
  formulaSn: string;
  firstTerms: number[];
  steps: string[];
}

export interface GeometricSequenceResult {
  a1: number;
  r: number;
  n: number;
  an: number;
  sumSn: number;
  sumInfinity?: number;
  converges: boolean;
  firstTerms: number[];
  steps: string[];
}

export interface BinomialExpansionResult {
  a: string;
  b: string;
  n: number;
  terms: { k: number; coeff: number; termStr: string }[];
  expansionString: string;
  steps: string[];
}

export interface ComplexAnalysisResult {
  real: number;
  imag: number;
  modulus: number;
  argumentDeg: number;
  argumentRad: number;
  polarForm: string;
  eulerForm: string;
  conjugate: string;
  powerZn?: { n: number; resultCartesian: string; resultPolar: string };
  steps: string[];
}

export function calculateArithmeticSequence(a1: number, d: number, n: number): ArithmeticSequenceResult {
  if (n <= 0 || !Number.isInteger(n)) throw new Error('Term count n must be a positive integer.');

  const an = a1 + (n - 1) * d;
  const sumSn = (n / 2) * (2 * a1 + (n - 1) * d);
  const firstTerms = Array.from({ length: Math.min(n, 10) }, (_, i) => a1 + i * d);

  return {
    a1,
    d,
    n,
    an: clean(an),
    sumSn: clean(sumSn),
    formulaAn: `aₙ = ${a1} + (n - 1)·(${d})`,
    formulaSn: `Sₙ = (n/2)·[2·(${a1}) + (n-1)·(${d})]`,
    firstTerms,
    steps: [
      `General Term formula: aₙ = a₁ + (n - 1)·d`,
      `For n = ${n}: a_${n} = ${a1} + (${n} - 1)·(${d}) = ${a1} + ${clean((n - 1) * d)} = ${clean(an)}`,
      `Sum formula: Sₙ = (n / 2) · (a₁ + aₙ)`,
      `S_${n} = (${n} / 2) · (${a1} + ${clean(an)}) = ${clean(n / 2)} · ${clean(a1 + an)} = ${clean(sumSn)}`
    ]
  };
}

export function calculateGeometricSequence(a1: number, r: number, n: number): GeometricSequenceResult {
  if (n <= 0 || !Number.isInteger(n)) throw new Error('Term count n must be a positive integer.');

  const an = a1 * Math.pow(r, n - 1);
  const sumSn = Math.abs(r - 1) < 1e-10 ? a1 * n : a1 * (1 - Math.pow(r, n)) / (1 - r);
  const converges = Math.abs(r) < 1;
  const sumInfinity = converges ? a1 / (1 - r) : undefined;
  const firstTerms = Array.from({ length: Math.min(n, 10) }, (_, i) => clean(a1 * Math.pow(r, i)));

  const steps: string[] = [
    `General Term formula: aₙ = a₁ · rⁿ⁻¹`,
    `For n = ${n}: a_${n} = ${a1} · (${r})^(${n - 1}) = ${clean(an)}`,
    `Finite sum formula: Sₙ = a₁ · (1 - rⁿ) / (1 - r)`,
    `S_${n} = ${a1} · (1 - (${r})^${n}) / (1 - ${r}) = ${clean(sumSn)}`
  ];

  if (converges && sumInfinity !== undefined) {
    steps.push(
      `Since |r| = |${r}| < 1, the infinite geometric series converges:`,
      `S_∞ = a₁ / (1 - r) = ${a1} / (1 - ${r}) = ${clean(sumInfinity)}`
    );
  } else {
    steps.push(`Since |r| = |${r}| ≥ 1, the infinite series diverges.`);
  }

  return {
    a1,
    r,
    n,
    an: clean(an),
    sumSn: clean(sumSn),
    sumInfinity: sumInfinity !== undefined ? clean(sumInfinity) : undefined,
    converges,
    firstTerms,
    steps
  };
}

export function expandBinomial(aStr: string, bStr: string, n: number): BinomialExpansionResult {
  if (n < 0 || n > 20 || !Number.isInteger(n)) {
    throw new Error('Exponent n must be an integer between 0 and 20.');
  }

  const steps: string[] = [
    `Binomial Theorem: (${aStr} + ${bStr})ⁿ = ∑_{k=0}^{n} C(n, k) · a^{n-k} · b^k`,
    `Degree n = ${n}`
  ];

  const terms: { k: number; coeff: number; termStr: string }[] = [];

  for (let k = 0; k <= n; k++) {
    const c = combination(n, k);
    const aPower = n - k;
    const bPower = k;

    let partA = '';
    if (aPower > 0) partA = aPower === 1 ? aStr : `(${aStr})^${aPower}`;

    let partB = '';
    if (bPower > 0) partB = bPower === 1 ? bStr : `(${bStr})^${bPower}`;

    const parts = [c === 1 && (partA || partB) ? '' : `${c}`, partA, partB].filter(p => p.length > 0);
    const termStr = parts.join('·');
    terms.push({ k, coeff: c, termStr });
    steps.push(`k = ${k}: C(${n}, ${k}) = ${c} ⇒ Term: ${termStr}`);
  }

  const expansionString = terms.map(t => t.termStr).join(' + ');

  return {
    a: aStr,
    b: bStr,
    n,
    terms,
    expansionString,
    steps
  };
}

export function analyzeComplexNumber(real: number, imag: number, power?: number): ComplexAnalysisResult {
  const mod = Math.sqrt(real * real + imag * imag);
  const argRad = Math.atan2(imag, real);
  const argDeg = (argRad * 180) / Math.PI;

  const conjugate = `${real} ${imag >= 0 ? '-' : '+'} ${Math.abs(imag)}i`;
  const polar = `${clean(mod)} ∠ ${clean(argDeg)}°`;
  const euler = `${clean(mod)} · e^(i·${clean(argRad)} rad)`;

  const steps: string[] = [
    `Cartesian form: z = a + bi = ${real} + (${imag})i`,
    `Modulus: |z| = r = √(a² + b²) = √(${real}² + ${imag}²) = √(${real * real + imag * imag}) = ${clean(mod)}`,
    `Argument: θ = atan2(b, a) = atan2(${imag}, ${real}) = ${clean(argRad)} rad (${clean(argDeg)}°)`,
    `Polar form: z = r(cos θ + i·sin θ) = ${clean(mod)}·[cos(${clean(argDeg)}°) + i·sin(${clean(argDeg)}°)]`,
    `Euler form: z = r·e^(iθ) = ${euler}`
  ];

  let powerZn: { n: number; resultCartesian: string; resultPolar: string } | undefined;
  if (power !== undefined && Number.isInteger(power)) {
    const powR = Math.pow(mod, power);
    const powTheta = argRad * power;
    const resReal = powR * Math.cos(powTheta);
    const resImag = powR * Math.sin(powTheta);
    const powDeg = (powTheta * 180) / Math.PI;

    steps.push(
      `De Moivre's Theorem: zⁿ = rⁿ · [cos(nθ) + i·sin(nθ)]`,
      `For n = ${power}: r^${power} = ${clean(powR)}, nθ = ${power} × ${clean(argDeg)}° = ${clean(powDeg)}°`,
      `z^${power} = ${clean(resReal)} ${resImag >= 0 ? '+' : '-'} ${Math.abs(clean(resImag))}i`
    );

    powerZn = {
      n: power,
      resultCartesian: `${clean(resReal)} ${resImag >= 0 ? '+' : '-'} ${Math.abs(clean(resImag))}i`,
      resultPolar: `${clean(powR)} ∠ ${clean(powDeg % 360)}°`
    };
  }

  return {
    real,
    imag,
    modulus: clean(mod),
    argumentDeg: clean(argDeg),
    argumentRad: clean(argRad),
    polarForm: polar,
    eulerForm: euler,
    conjugate,
    powerZn,
    steps
  };
}

function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return Math.round(c);
}

function clean(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export type SequenceResult = ArithmeticSequenceResult | GeometricSequenceResult;
export type BinomialResult = BinomialExpansionResult;
export type ComplexNumberResult = ComplexAnalysisResult;
export const binomialExpansion = expandBinomial;
export const calculateComplexNumber = analyzeComplexNumber;

export interface TrigonometryResult {
  fn: string;
  angleDeg: number;
  angleRad: number;
  exactValue: string;
  decimalValue: number;
  quadrant: string;
  identities: string[];
  steps: string[];
}

export function calculateTrigonometry(
  fn: 'sin' | 'cos' | 'tan' | 'sec' | 'csc' | 'cot',
  angleDeg: number
): TrigonometryResult {
  const rad = (angleDeg * Math.PI) / 180;
  let dec = 0;
  let exact = '';

  const normDeg = ((angleDeg % 360) + 360) % 360;
  let quad = 'Quadrant I';
  if (normDeg > 90 && normDeg < 180) quad = 'Quadrant II';
  else if (normDeg > 180 && normDeg < 270) quad = 'Quadrant III';
  else if (normDeg > 270 && normDeg < 360) quad = 'Quadrant IV';
  else if (normDeg % 90 === 0) quad = 'Quadrantal axis';

  // Exact known table for common angles
  const table: Record<number, Record<string, string>> = {
    0: { sin: '0', cos: '1', tan: '0', csc: 'undefined', sec: '1', cot: 'undefined' },
    30: { sin: '1/2', cos: '√3/2', tan: '√3/3', csc: '2', sec: '2√3/3', cot: '√3' },
    45: { sin: '√2/2', cos: '√2/2', tan: '1', csc: '√2', sec: '√2', cot: '1' },
    60: { sin: '√3/2', cos: '1/2', tan: '√3', csc: '2√3/3', sec: '2', cot: '√3/3' },
    90: { sin: '1', cos: '0', tan: 'undefined', csc: '1', sec: 'undefined', cot: '0' },
    180: { sin: '0', cos: '-1', tan: '0', csc: 'undefined', sec: '-1', cot: 'undefined' },
    270: { sin: '-1', cos: '0', tan: 'undefined', csc: '-1', sec: 'undefined', cot: '0' },
  };

  switch (fn) {
    case 'sin':
      dec = Math.sin(rad);
      break;
    case 'cos':
      dec = Math.cos(rad);
      break;
    case 'tan':
      dec = Math.tan(rad);
      break;
    case 'csc':
      dec = 1 / Math.sin(rad);
      break;
    case 'sec':
      dec = 1 / Math.cos(rad);
      break;
    case 'cot':
      dec = 1 / Math.tan(rad);
      break;
  }

  exact = table[normDeg]?.[fn] || formatNumber(dec);

  const steps = [
    `Function: ${fn}(θ) at θ = ${angleDeg}°`,
    `Degree to radian conversion: θ = ${angleDeg}° · (π / 180°) = ${clean(rad)} rad`,
    `Angle location: ${quad} (normalized to ${normDeg}°)`,
    `Pythagorean fundamental identity: sin²(θ) + cos²(θ) = 1`,
    `Exact evaluated value: ${exact}`,
    `Decimal approximation: ${formatNumber(dec)}`
  ];

  const identities = [
    'sin²(θ) + cos²(θ) = 1',
    'tan(θ) = sin(θ) / cos(θ)',
    'sec(θ) = 1 / cos(θ), csc(θ) = 1 / sin(θ), cot(θ) = 1 / tan(θ)',
    'Double-angle: sin(2θ) = 2·sin(θ)·cos(θ)',
    'Double-angle: cos(2θ) = cos²(θ) - sin²(θ) = 2cos²(θ) - 1'
  ];

  return {
    fn,
    angleDeg,
    angleRad: clean(rad),
    exactValue: exact,
    decimalValue: clean(dec),
    quadrant: quad,
    identities,
    steps
  };
}
