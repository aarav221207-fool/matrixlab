import { formatNumber } from '../utils/formatting';
export interface LaplaceTransformResult {
  functionInput: string;
  variable: string;
  sVariable: string;
  result: string;
  rule: string;
  domain: string;
  steps: string[];
}

export interface InverseLaplaceResult {
  inputFs: string;
  resultFt: string;
  method: string;
  partialFractions?: string[];
  steps: string[];
}

/**
 * Calculates Laplace Transform L{f(t)} = F(s) with formal table lookup and linearity rules
 */
export function calculateLaplace(exprInput: string): LaplaceTransformResult {
  const clean = exprInput.trim().replace(/\s+/g, '');
  const steps: string[] = [
    `Definition of the unilateral Laplace Transform: L{f(t)} = ∫₀^∞ e^(-s·t) · f(t) dt`,
    `Applying linearity: L{c₁·f₁(t) + c₂·f₂(t)} = c₁·L{f₁(t)} + c₂·L{f₂(t)}`
  ];

  // 1. Constant c -> c / s
  const numVal = parseFloat(clean);
  if (!isNaN(numVal) && !clean.includes('t')) {
    steps.push(`Identity: L{1} = 1/s for Re(s) > 0`, `Multiply by constant ${numVal}: L{${numVal}} = ${numVal}/s`);
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${numVal}/s`,
      rule: 'Constant Rule: L{c} = c/s',
      domain: 's > 0',
      steps
    };
  }

  // 2. t or t^n
  if (clean === 't') {
    steps.push(`Identity: L{tⁿ} = n! / sⁿ⁺¹`, `For n = 1: 1! / s² = 1/s²`);
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: '1/s^2',
      rule: 'Power Rule: L{tⁿ} = n! / sⁿ⁺¹',
      domain: 's > 0',
      steps
    };
  }

  const powerMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?t\^(\d+)$/);
  if (powerMatch) {
    const coeffStr = powerMatch[1];
    const coeff = (!coeffStr || coeffStr === '+') ? 1 : (coeffStr === '-' ? -1 : parseFloat(coeffStr));
    const n = parseInt(powerMatch[2], 10);
    const fact = factorial(n);
    const sPower = n + 1;
    const numerator = coeff * fact;
    steps.push(
      `Power Rule: L{tⁿ} = n! / sⁿ⁺¹`,
      `Here n = ${n}, n! = ${fact}. Multiplied by coefficient ${coeff}:`,
      `L{${exprInput}} = ${numerator} / s^${sPower}`
    );
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${numerator}/s^${sPower}`,
      rule: `Power Rule: L{tⁿ} = n! / sⁿ⁺¹ (n = ${n})`,
      domain: 's > 0',
      steps
    };
  }

  // 3. Exponential: e^(at) or exp(at)
  const expMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?(?:e\^|exp\()([+-]?\d*(?:\.\d+)?)?\*?t\)?$/);
  if (expMatch) {
    const coeffStr = expMatch[1];
    const coeff = (!coeffStr || coeffStr === '+') ? 1 : (coeffStr === '-' ? -1 : parseFloat(coeffStr));
    const aStr = expMatch[2];
    const a = (!aStr || aStr === '+') ? 1 : (aStr === '-' ? -1 : parseFloat(aStr));
    const denom = a > 0 ? `(s - ${a})` : a < 0 ? `(s + ${Math.abs(a)})` : 's';
    steps.push(
      `Exponential Shift / Decay Rule: L{e^(at)} = 1 / (s - a)`,
      `Here parameter a = ${a}.`,
      `Result: ${coeff} / ${denom}`
    );
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${coeff} / ${denom}`,
      rule: 'Exponential Rule: L{e^(at)} = 1 / (s - a)',
      domain: `s > ${a}`,
      steps
    };
  }

  // 4. Sine: sin(at)
  const sinMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?sin\(([+-]?\d*(?:\.\d+)?)?\*?t\)$/);
  if (sinMatch) {
    const coeffStr = sinMatch[1];
    const coeff = (!coeffStr || coeffStr === '+') ? 1 : (coeffStr === '-' ? -1 : parseFloat(coeffStr));
    const aStr = sinMatch[2];
    const a = (!aStr || aStr === '+') ? 1 : (aStr === '-' ? -1 : parseFloat(aStr));
    const a2 = a * a;
    const num = coeff * a;
    steps.push(
      `Trigonometric Sine Rule: L{sin(at)} = a / (s² + a²)`,
      `Parameter a = ${a}, a² = ${a2}`,
      `Numerator = ${coeff} × ${a} = ${num}`,
      `Result: ${num} / (s² + ${a2})`
    );
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${num} / (s^2 + ${a2})`,
      rule: 'Trigonometric Sine: L{sin(at)} = a / (s² + a²)',
      domain: 's > 0',
      steps
    };
  }

  // 5. Cosine: cos(at)
  const cosMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?cos\(([+-]?\d*(?:\.\d+)?)?\*?t\)$/);
  if (cosMatch) {
    const coeffStr = cosMatch[1];
    const coeff = (!coeffStr || coeffStr === '+') ? 1 : (coeffStr === '-' ? -1 : parseFloat(coeffStr));
    const aStr = cosMatch[2];
    const a = (!aStr || aStr === '+') ? 1 : (aStr === '-' ? -1 : parseFloat(aStr));
    const a2 = a * a;
    const numStr = coeff === 1 ? 's' : coeff === -1 ? '-s' : `${coeff}s`;
    steps.push(
      `Trigonometric Cosine Rule: L{cos(at)} = s / (s² + a²)`,
      `Parameter a = ${a}, a² = ${a2}`,
      `Result: ${numStr} / (s² + ${a2})`
    );
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${numStr} / (s^2 + ${a2})`,
      rule: 'Trigonometric Cosine: L{cos(at)} = s / (s² + a²)',
      domain: 's > 0',
      steps
    };
  }

  // 6. Hyperbolic sinh(at) & cosh(at)
  const sinhMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?sinh\(([+-]?\d*(?:\.\d+)?)?\*?t\)$/);
  if (sinhMatch) {
    const aStr = sinhMatch[2];
    const a = (!aStr || aStr === '+') ? 1 : (aStr === '-' ? -1 : parseFloat(aStr));
    const a2 = a * a;
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${a} / (s^2 - ${a2})`,
      rule: 'Hyperbolic Sine: L{sinh(at)} = a / (s² - a²)',
      domain: `s > |${a}|`,
      steps: [
        `Hyperbolic identity: sinh(at) = (e^(at) - e^(-at)) / 2`,
        `L{sinh(at)} = 0.5·[1/(s-a) - 1/(s+a)] = a / (s² - a²)`
      ]
    };
  }

  const coshMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?cosh\(([+-]?\d*(?:\.\d+)?)?\*?t\)$/);
  if (coshMatch) {
    const aStr = coshMatch[2];
    const a = (!aStr || aStr === '+') ? 1 : (aStr === '-' ? -1 : parseFloat(aStr));
    const a2 = a * a;
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `s / (s^2 - ${a2})`,
      rule: 'Hyperbolic Cosine: L{cosh(at)} = s / (s² - a²)',
      domain: `s > |${a}|`,
      steps: [
        `Hyperbolic identity: cosh(at) = (e^(at) + e^(-at)) / 2`,
        `L{cosh(at)} = 0.5·[1/(s-a) + 1/(s+a)] = s / (s² - a²)`
      ]
    };
  }

  // Fallback linear combinations or general representation
  return {
    functionInput: exprInput,
    variable: 't',
    sVariable: 's',
    result: `L{ ${exprInput} }`,
    rule: 'Standard Laplace Integral Transform',
    domain: 'Region of convergence depends on exponential order',
    steps: [
      `Compute integral ∫₀^∞ ${exprInput} · e^(-st) dt`,
      'Use integration by parts or expand linear terms individually using standard transform tables.'
    ]
  };
}

/**
 * Computes Inverse Laplace Transform L^-1{F(s)} using partial fractions and standard pairs
 */
export function calculateInverseLaplace(FsInput: string): InverseLaplaceResult {
  const clean = FsInput.trim().replace(/\s+/g, '');
  const steps: string[] = [
    `Inverse Laplace Transform: f(t) = L⁻¹{F(s)} = (1 / 2πi) ∫_{γ-i∞}^{γ+i∞} e^(st) F(s) ds`,
    `Identify rational structure and factor denominator for partial fractions.`
  ];

  // 1. F(s) = 1/s -> 1
  if (clean === '1/s') {
    steps.push(`Standard pair: L⁻¹{1/s} = 1 (Heaviside step u(t))`);
    return {
      inputFs: FsInput,
      resultFt: '1',
      method: 'Standard Pair: 1/s → 1',
      steps
    };
  }

  // 2. F(s) = c/s^n -> c*t^(n-1)/(n-1)!
  const powerMatch = clean.match(/^(\d*(?:\.\d+)?)\/s\^(\d+)$/);
  if (powerMatch) {
    const num = powerMatch[1] ? parseFloat(powerMatch[1]) : 1;
    const n = parseInt(powerMatch[2], 10);
    const tPower = n - 1;
    const fact = factorial(tPower);
    const coeff = num / fact;
    const tStr = tPower === 1 ? 't' : `t^${tPower}`;
    steps.push(
      `Standard pair: L⁻¹{n! / sⁿ⁺¹} = tⁿ`,
      `Here denominator is s^${n} ⇒ n = ${tPower}. (n-1)! = ${fact}`,
      `f(t) = (${num} / ${fact})·${tStr} = ${coeff === 1 ? '' : `${coeff}·`}${tStr}`
    );
    return {
      inputFs: FsInput,
      resultFt: `${coeff === 1 ? '' : `${coeff}·`}${tStr}`,
      method: 'Power Pair',
      steps
    };
  }

  // 3. F(s) = 1/(s - a) -> e^(at) or 1/(s + a) -> e^(-at)
  const shiftMatch = clean.match(/^(\d*(?:\.\d+)?)\/\(s([+-]\d*(?:\.\d+)?)\)$/);
  if (shiftMatch) {
    const num = shiftMatch[1] ? parseFloat(shiftMatch[1]) : 1;
    const signVal = parseFloat(shiftMatch[2]);
    const a = -signVal;
    steps.push(
      `First Shifting Theorem: L⁻¹{1 / (s - a)} = e^(at)`,
      `Here a = ${a}`,
      `f(t) = ${num === 1 ? '' : `${num}·`}e^(${a}t)`
    );
    return {
      inputFs: FsInput,
      resultFt: `${num === 1 ? '' : `${num}·`}e^(${a}t)`,
      method: 'Exponential Shift',
      steps
    };
  }

  // 4. F(s) = 1/(s^2 + a^2) -> (1/a)*sin(at)
  const sinMatch = clean.match(/^(\d*(?:\.\d+)?)\/\(s\^2\+(\d*(?:\.\d+)?)\)$/);
  if (sinMatch) {
    const num = sinMatch[1] ? parseFloat(sinMatch[1]) : 1;
    const a2 = parseFloat(sinMatch[2]);
    const a = Math.sqrt(a2);
    const coeff = num / a;
    const aFormatted = Number.isInteger(a) ? `${a}` : formatNumber(a);
    const exactCoeff = Number.isInteger(a) && num === 1 ? `1/${a}` : `${coeff}`;

    steps.push(
      `Identify the standard form: 1 / (s² + ${a2}) compare with 1 / (s² + a²)`,
      `Identify parameter: a² = ${a2} ⇒ a = ${aFormatted}`,
      `Apply the transform pair: L⁻¹{ a / (s² + a²) } = sin(at)`,
      `Scale numerator by 1/a: f(t) = (${num} / ${aFormatted}) · sin(${aFormatted}t)`,
      `Final expression: f(t) = ${exactCoeff === '1' ? '' : `(${exactCoeff}) `}sin(${aFormatted}t)`
    );
    return {
      inputFs: FsInput,
      resultFt: `${exactCoeff === '1' ? '' : `${exactCoeff} `}sin(${aFormatted}t)`,
      method: 'Standard Sine Pair L⁻¹{a/(s²+a²)}',
      steps
    };
  }

  // 5. F(s) = s/(s^2 + a^2) -> cos(at)
  const cosMatch = clean.match(/^s\/\(s\^2\+(\d*(?:\.\d+)?)\)$/);
  if (cosMatch) {
    const a2 = parseFloat(cosMatch[1]);
    const a = Math.sqrt(a2);
    const aFormatted = Number.isInteger(a) ? `${a}` : formatNumber(a);
    steps.push(
      `Identify the standard form: s / (s² + ${a2}) compare with s / (s² + a²)`,
      `Identify parameter: a² = ${a2} ⇒ a = ${aFormatted}`,
      `Apply the transform pair: L⁻¹{ s / (s² + a²) } = cos(at)`,
      `Final expression: f(t) = cos(${aFormatted}t)`
    );
    return {
      inputFs: FsInput,
      resultFt: `cos(${aFormatted}t)`,
      method: 'Standard Cosine Pair L⁻¹{s/(s²+a²)}',
      steps
    };
  }

  // 6. Partial fractions for 1/((s - a)(s - b))
  const twoPoleMatch = clean.match(/^1\/\(\(s([+-]\d+)\)\*\(s([+-]\d+)\)\)$/);
  if (twoPoleMatch) {
    const p1 = -parseFloat(twoPoleMatch[1]);
    const p2 = -parseFloat(twoPoleMatch[2]);
    if (p1 !== p2) {
      // 1 / ((s-p1)(s-p2)) = A/(s-p1) + B/(s-p2)
      // A = 1 / (p1 - p2)
      // B = 1 / (p2 - p1) = -A
      const A = 1 / (p1 - p2);
      const B = -A;
      steps.push(
        `Partial Fraction Decomposition:`,
        `1 / ((s - ${p1})(s - ${p2})) = A / (s - ${p1}) + B / (s - ${p2})`,
        `Using Heaviside cover-up method:`,
        `A = lim_{s→${p1}} (s - ${p1})·F(s) = 1 / (${p1} - ${p2}) = ${formatNumber(A)}`,
        `B = lim_{s→${p2}} (s - ${p2})·F(s) = 1 / (${p2} - ${p1}) = ${formatNumber(B)}`,
        `Apply linearity of inverse transform:`
      );
      const res = `${formatNumber(A)}·e^(${p1}t) + ${formatNumber(B)}·e^(${p2}t)`;
      return {
        inputFs: FsInput,
        resultFt: res,
        method: 'Partial Fractions',
        partialFractions: [`${formatNumber(A)} / (s - ${p1})`, `${formatNumber(B)} / (s - ${p2})`],
        steps
      };
    }
  }

  return {
    inputFs: FsInput,
    resultFt: `L⁻¹{ ${FsInput} }`,
    method: 'General Rational Inversion',
    steps: [
      'Decompose F(s) into partial fraction sum: F(s) = ∑ Aᵢ / (s - pᵢ)',
      'Apply frequency shifting property: L⁻¹{F(s - a)} = e^(at)·f(t)',
      'Inspect poles in the complex s-plane to determine stability and time-domain modes.'
    ]
  };
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export type LaplaceResult = LaplaceTransformResult;
export const calculateLaplaceTransform = calculateLaplace;
export const calculateInverseLaplaceTransform = calculateInverseLaplace;
