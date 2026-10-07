import { formatNumber } from '../utils/formatting';
import { VisualMathStep } from '../components/design-system/MathStep';

export interface LaplaceTransformResult {
  functionInput: string;
  variable: string;
  sVariable: string;
  result: string;
  resultLatex?: string;
  rule: string;
  domain: string;
  steps: (string | VisualMathStep)[];
}

export interface InverseLaplaceResult {
  inputFs: string;
  resultFt: string;
  resultLatex?: string;
  method: string;
  partialFractions?: string[];
  steps: (string | VisualMathStep)[];
}

/**
 * Calculates unilateral Laplace Transform L{f(t)} = F(s)
 */
export function calculateLaplace(exprInput: string): LaplaceTransformResult {
  const rawInput = exprInput.trim();
  if (!rawInput) {
    throw new Error('Please enter a valid time-domain function f(t).');
  }

  // Pre-normalize expression: remove whitespace
  const clean = rawInput.replace(/\s+/g, '');

  // Split into linear combination terms (respecting top-level + and - outside parens)
  const rawTerms = splitTopLevelTerms(clean);

  if (rawTerms.length > 1) {
    return transformLinearCombination(rawInput, rawTerms);
  }

  // Single term transformation
  return transformSingleTerm(rawInput, clean);
}

/**
 * Splits an algebraic expression into top-level terms separated by + or -
 */
function splitTopLevelTerms(expr: string): string[] {
  const terms: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      depth--;
      current += char;
    } else if ((char === '+' || char === '-') && depth === 0 && i > 0 && expr[i - 1] !== '*' && expr[i - 1] !== '/' && expr[i - 1] !== '^') {
      if (current.trim()) {
        terms.push(current.trim());
      }
      current = char;
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    terms.push(current.trim());
  }

  return terms;
}

/**
 * Splits a product of factors separated by * at top-level depth 0
 */
function splitTopLevelFactors(expr: string): string[] {
  const factors: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;

    if (c === '*' && depth === 0) {
      if (current.trim()) factors.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  if (current.trim()) factors.push(current.trim());
  return factors;
}

interface ParsedTerm {
  coeff: number;
  hasPoly: boolean;
  n: number; // power of t
  hasExp: boolean;
  a: number; // exponent parameter in e^(at)
  hasTrig: boolean;
  trigType: 'sin' | 'cos' | 'sinh' | 'cosh';
  w: number; // frequency parameter in sin(wt), cos(wt), etc.
}

/**
 * Parses factors within a single product term of t, e^(at), sin/cos/sinh/cosh
 */
function parseTermFactors(termStr: string): ParsedTerm | null {
  let s = termStr.trim();
  let coeff = 1;

  if (s.startsWith('+')) {
    s = s.substring(1);
  } else if (s.startsWith('-')) {
    coeff = -1;
    s = s.substring(1);
  }

  // Handle leading numeric coefficient
  const factors = splitTopLevelFactors(s);
  let hasPoly = false;
  let n = 0;
  let hasExp = false;
  let a = 0;
  let hasTrig = false;
  let trigType: 'sin' | 'cos' | 'sinh' | 'cosh' = 'sin';
  let w = 0;

  for (const f of factors) {
    // 1. Pure constant factor
    if (!isNaN(parseFloat(f)) && !f.includes('t')) {
      coeff *= parseFloat(f);
      continue;
    }

    // 2. Polynomial factor: t, t^2, t^n
    const polyM = f.match(/^t(?:\^(\d+))?$/);
    if (polyM) {
      if (hasPoly) return null;
      hasPoly = true;
      n = polyM[1] ? parseInt(polyM[1], 10) : 1;
      continue;
    }

    // 3. Exponential factor: exp(at), e^(at), e^(a*t), exp(a*t)
    const expM = f.match(/^(?:e\^\(?|exp\()(.*?)\)?$/);
    if (expM) {
      let inner = expM[1].replace(/\)$/, '');
      if (inner.endsWith('t')) {
        if (hasExp) return null;
        hasExp = true;
        const p = inner.replace(/\*?t$/, '');
        a = (p === '' || p === '+') ? 1 : p === '-' ? -1 : parseFloat(p);
        if (isNaN(a)) return null;
        continue;
      }
    }

    // 4. Trig factor: sin(wt), cos(wt), sinh(wt), cosh(wt)
    const trigM = f.match(/^(sin|cos|sinh|cosh)\((.*?)\)$/);
    if (trigM) {
      let inner = trigM[2];
      if (inner.endsWith('t')) {
        if (hasTrig) return null;
        hasTrig = true;
        trigType = trigM[1] as any;
        const p = inner.replace(/\*?t$/, '');
        w = (p === '' || p === '+') ? 1 : p === '-' ? -1 : parseFloat(p);
        if (isNaN(w)) return null;
        continue;
      }
    }

    // Unrecognized factor
    return null;
  }

  return { coeff, hasPoly, n, hasExp, a, hasTrig, trigType, w };
}

/**
 * Transforms a single elementary or shifted term
 */
function transformSingleTerm(exprInput: string, clean: string): LaplaceTransformResult {
  const steps: (string | VisualMathStep)[] = [
    {
      title: 'Unilateral Laplace Transform Definition',
      explanation: 'Transform time-domain signal f(t) for t ≥ 0 into the complex s-plane:',
      expression: '\\mathcal{L}\\{f(t)\\} = \\int_{0}^{\\infty} e^{-st} f(t)\\,dt',
      type: 'formula'
    }
  ];

  const parsed = parseTermFactors(clean);
  if (!parsed) {
    throw new Error(
      `The expression "${exprInput}" is not currently supported for analytical Laplace transformation. Supported patterns include polynomials tⁿ, exponentials e^(at), trigonometric functions sin(at)/cos(at), hyperbolic functions sinh(at)/cosh(at), damping/frequency shifts e^(at)f(t), and their linear combinations.`
    );
  }

  const { coeff, hasPoly, n, hasExp, a, hasTrig, trigType, w } = parsed;

  // Case 1: Pure Constant c
  if (!hasPoly && !hasExp && !hasTrig) {
    const formattedCoeff = formatNumber(coeff);
    steps.push({
      title: 'Transform of a Constant',
      explanation: 'The Laplace transform of the Heaviside unit step u(t) = 1 is 1/s for Re(s) > 0:',
      expression: '\\mathcal{L}\\{1\\} = \\frac{1}{s}',
      rule: 'Constant Rule',
      type: 'formula'
    });
    steps.push({
      title: 'Apply Constant Multiple',
      explanation: `Multiply the standard transform by constant coefficient ${formattedCoeff}:`,
      expression: `\\mathcal{L}\\{${formattedCoeff}\\} = \\frac{${formattedCoeff}}{s}`,
      type: 'conclusion'
    });
    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${formattedCoeff}/s`,
      resultLatex: `\\frac{${formattedCoeff}}{s}`,
      rule: 'Constant Rule: L{c} = c/s',
      domain: 's > 0',
      steps
    };
  }

  // Case 2: Pure Polynomial t^n
  if (hasPoly && !hasExp && !hasTrig) {
    const fact = factorial(n);
    const num = coeff * fact;
    const sPower = n + 1;
    const formattedNum = formatNumber(num);

    steps.push({
      title: 'Power Rule for Monomials',
      explanation: 'Use the standard power theorem for non-negative integers n:',
      expression: '\\mathcal{L}\\{t^n\\} = \\frac{n!}{s^{n+1}}',
      rule: `Power Rule (n = ${n})`,
      type: 'formula'
    });
    steps.push({
      title: 'Calculate Numerator Factorial',
      explanation: `Here exponent n = ${n}. Factorial ${n}! = ${fact}. Multiply by leading coefficient ${formatNumber(coeff)}:`,
      expression: `\\mathcal{L}\\{${clean}\\} = \\frac{${formattedNum}}{s^{${sPower}}}`,
      type: 'conclusion'
    });

    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${formattedNum}/s^${sPower}`,
      resultLatex: `\\frac{${formattedNum}}{s^{${sPower}}}`,
      rule: `Power Rule: L{tⁿ} = n! / sⁿ⁺¹ (n = ${n})`,
      domain: 's > 0',
      steps
    };
  }

  // Case 3: Pure Exponential e^(at)
  if (!hasPoly && hasExp && !hasTrig) {
    const formattedCoeff = formatNumber(coeff);
    const shiftTerm = a > 0 ? `s - ${a}` : a < 0 ? `s + ${Math.abs(a)}` : 's';
    const latexDenom = a > 0 ? `s - ${a}` : a < 0 ? `s + ${Math.abs(a)}` : 's';

    steps.push({
      title: 'Exponential Transform Pair',
      explanation: 'The Laplace transform of an exponential decay or growth function:',
      expression: '\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s - a}',
      rule: `Exponential Rule (a = ${a})`,
      type: 'formula'
    });
    steps.push({
      title: 'Substitute Parameter a',
      explanation: `Here rate parameter a = ${a}. Multiply by coefficient ${formattedCoeff}:`,
      expression: `\\mathcal{L}\\{${clean}\\} = \\frac{${formattedCoeff}}{${latexDenom}}`,
      type: 'conclusion'
    });

    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${formattedCoeff}/(${shiftTerm})`,
      resultLatex: `\\frac{${formattedCoeff}}{${latexDenom}}`,
      rule: `Exponential Rule: L{e^(at)} = 1 / (s - a)`,
      domain: `s > ${a}`,
      steps
    };
  }

  // Case 4: Pure Trigonometric / Hyperbolic sin(wt), cos(wt), sinh(wt), cosh(wt)
  if (!hasPoly && !hasExp && hasTrig) {
    const w2 = w * w;
    const sign = trigType.endsWith('h') ? '-' : '+';
    const isCos = trigType.startsWith('cos');

    const numStr = isCos
      ? coeff === 1 ? 's' : coeff === -1 ? '-s' : `${formatNumber(coeff)}*s`
      : formatNumber(coeff * w);
    const numLatex = isCos
      ? coeff === 1 ? 's' : coeff === -1 ? '-s' : `${formatNumber(coeff)}s`
      : formatNumber(coeff * w);

    const denomStr = `s^2 ${sign} ${w2}`;
    const denomLatex = `s^2 ${sign} ${w2}`;

    const theoremTex = isCos
      ? trigType === 'cos'
        ? '\\mathcal{L}\\{\\cos(wt)\\} = \\frac{s}{s^2 + w^2}'
        : '\\mathcal{L}\\{\\cosh(wt)\\} = \\frac{s}{s^2 - w^2}'
      : trigType === 'sin'
      ? '\\mathcal{L}\\{\\sin(wt)\\} = \\frac{w}{s^2 + w^2}'
      : '\\mathcal{L}\\{\\sinh(wt)\\} = \\frac{w}{s^2 - w^2}';

    steps.push({
      title: `${trigType.toUpperCase()} Transform Pair`,
      explanation: `Standard Laplace transform pair for angular frequency w = ${w}:`,
      expression: theoremTex,
      rule: `${trigType.toUpperCase()} Rule`,
      type: 'formula'
    });
    steps.push({
      title: 'Apply Frequency Parameter and Scaling',
      explanation: `Here w = ${w}, w² = ${w2}. Multiplied by coefficient ${formatNumber(coeff)}:`,
      expression: `\\mathcal{L}\\{${clean}\\} = \\frac{${numLatex}}{${denomLatex}}`,
      type: 'conclusion'
    });

    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${numStr}/(${denomStr})`,
      resultLatex: `\\frac{${numLatex}}{${denomLatex}}`,
      rule: `Trigonometric Rule: L{${trigType}(wt)}`,
      domain: trigType.endsWith('h') ? `s > |${w}|` : 's > 0',
      steps
    };
  }

  // Case 5: Polynomial times Exponential: t^n * e^(at) (Frequency Shifting Theorem)
  if (hasPoly && hasExp && !hasTrig) {
    const fact = factorial(n);
    const num = coeff * fact;
    const formattedNum = formatNumber(num);
    const sPower = n + 1;
    const shiftTerm = a > 0 ? `s - ${a}` : `s + ${Math.abs(a)}`;

    steps.push({
      title: 'Base Transform (Power Rule)',
      explanation: `Identify base function g(t) = t^${n} and its unshifted transform:`,
      expression: `\\mathcal{L}\\{t^{${n}}\\} = \\frac{${n}!}{s^{${sPower}}} = \\frac{${fact}}{s^{${sPower}}}`,
      rule: `Power Rule (n = ${n})`,
      type: 'formula'
    });
    steps.push({
      title: 'Exponential / Frequency Shifting Theorem',
      explanation: `Multiplying by e^(at) shifts the complex variable s in the frequency domain:`,
      expression: '\\mathcal{L}\\{e^{at} g(t)\\} = G(s - a)',
      rule: 'Frequency Shifting Property',
      type: 'formula'
    });
    steps.push({
      title: 'Substitute s → (s - a)',
      explanation: `With shifting parameter a = ${a}, replace s with (${shiftTerm}) and apply coefficient ${formatNumber(coeff)}:`,
      expression: `\\mathcal{L}\\{${clean}\\} = \\frac{${formattedNum}}{(${shiftTerm})^{${sPower}}}`,
      type: 'conclusion'
    });

    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${formattedNum}/(${shiftTerm})^${sPower}`,
      resultLatex: `\\frac{${formattedNum}}{(${shiftTerm})^{${sPower}}}`,
      rule: `Exponential Shifting: L{tⁿ·e^(at)} = n! / (s - a)ⁿ⁺¹`,
      domain: `s > ${a}`,
      steps
    };
  }

  // Case 6: Exponential times Sine or Cosine: e^(at) * sin(wt) or e^(at) * cos(wt)
  if (!hasPoly && hasExp && hasTrig) {
    const w2 = w * w;
    const shiftTerm = a > 0 ? `s - ${a}` : `s + ${Math.abs(a)}`;
    const isCos = trigType.startsWith('cos');

    const numStr = isCos
      ? coeff === 1 ? `(${shiftTerm})` : `${formatNumber(coeff)}*(${shiftTerm})`
      : formatNumber(coeff * w);
    const numLatex = isCos
      ? coeff === 1 ? `(${shiftTerm})` : `${formatNumber(coeff)}(${shiftTerm})`
      : formatNumber(coeff * w);

    const sign = trigType.endsWith('h') ? '-' : '+';
    const denomStr = `(${shiftTerm})^2 ${sign} ${w2}`;
    const denomLatex = `(${shiftTerm})^{2} ${sign} ${w2}`;

    steps.push({
      title: `Base Transform: \\mathcal{L}\\{${trigType}(${w}t)\\}`,
      explanation: `The unshifted transform of ${trigType}(${w}t) is:`,
      expression: isCos
        ? `\\mathcal{L}\\{\\cos(${w}t)\\} = \\frac{s}{s^2 ${sign} ${w2}}`
        : `\\mathcal{L}\\{\\sin(${w}t)\\} = \\frac{${w}}{s^2 ${sign} ${w2}}`,
      type: 'formula'
    });
    steps.push({
      title: 'Exponential Shifting Theorem',
      explanation: 'Multiplying by e^(at) replaces frequency variable s with s - a:',
      expression: '\\mathcal{L}\\{e^{at} g(t)\\} = G(s - a)',
      rule: 'Frequency Shifting Property',
      type: 'formula'
    });
    steps.push({
      title: 'Apply Frequency Shift s → (s - a)',
      explanation: `Substitute s with (${shiftTerm}) and scale by leading coefficient ${formatNumber(coeff)}:`,
      expression: `\\mathcal{L}\\{${clean}\\} = \\frac{${numLatex}}{${denomLatex}}`,
      type: 'conclusion'
    });

    return {
      functionInput: exprInput,
      variable: 't',
      sVariable: 's',
      result: `${numStr}/(${denomStr})`,
      resultLatex: `\\frac{${numLatex}}{${denomLatex}}`,
      rule: `Damped Oscillation: L{e^(at)·${trigType}(wt)} = F(s - a)`,
      domain: `s > ${a}`,
      steps
    };
  }

  throw new Error(`Unsupported expression structure: "${exprInput}"`);
}

/**
 * Handles linear combinations of multiple terms via linearity property
 */
function transformLinearCombination(exprInput: string, terms: string[]): LaplaceTransformResult {
  const steps: (string | VisualMathStep)[] = [
    {
      title: 'Linearity Property of the Laplace Transform',
      explanation: 'The unilateral Laplace transform is a linear operator:',
      expression: '\\mathcal{L}\\{c_1 f_1(t) + c_2 f_2(t)\\} = c_1 \\mathcal{L}\\{f_1(t)\\} + c_2 \\mathcal{L}\\{f_2(t)\\}',
      rule: 'Linearity Theorem',
      type: 'formula'
    }
  ];

  const results: LaplaceTransformResult[] = [];

  for (let i = 0; i < terms.length; i++) {
    const tStr = terms[i];
    const subRes = transformSingleTerm(tStr, tStr.replace(/\s+/g, ''));
    results.push(subRes);

    steps.push({
      title: `Term ${i + 1}: \\mathcal{L}\\{${tStr}\\}`,
      explanation: `Transforming individual component using ${subRes.rule}:`,
      expression: `\\mathcal{L}\\{${tStr}\\} = ${subRes.resultLatex || subRes.result}`,
      type: 'general'
    });
  }

  // Combine results into sum
  const combinedLatex = results.map(r => r.resultLatex || r.result).join(' + ').replace(/\+\s*-/g, '- ');
  const combinedStr = results.map(r => r.result).join(' + ').replace(/\+\s*-/g, '- ');

  steps.push({
    title: 'Sum of Component Transforms',
    explanation: 'Combine all transformed frequency-domain terms:',
    expression: `F(s) = ${combinedLatex}`,
    type: 'conclusion'
  });

  return {
    functionInput: exprInput,
    variable: 't',
    sVariable: 's',
    result: combinedStr,
    resultLatex: combinedLatex,
    rule: 'Linearity Theorem (Sum of Transforms)',
    domain: 's > max(Re(poles))',
    steps
  };
}

/**
 * Computes Inverse Laplace Transform L^-1{F(s)} = f(t)
 */
export function calculateInverseLaplace(FsInput: string): InverseLaplaceResult {
  const rawInput = FsInput.trim();
  if (!rawInput) {
    throw new Error('Please enter a valid frequency-domain function F(s).');
  }

  const clean = rawInput.replace(/\s+/g, '');

  // Split into linear combination terms if multiple terms
  const terms = splitTopLevelTerms(clean);
  if (terms.length > 1) {
    return invertLinearCombination(rawInput, terms);
  }

  return invertSingleTerm(rawInput, clean);
}

/**
 * Inverts a single rational term in s
 */
function invertSingleTerm(FsInput: string, clean: string): InverseLaplaceResult {
  const steps: (string | VisualMathStep)[] = [
    {
      title: 'Inverse Laplace Transform Definition',
      explanation: 'Transform complex frequency-domain function F(s) into real time-domain signal f(t):',
      expression: 'f(t) = \\mathcal{L}^{-1}\\{F(s)\\} = \\frac{1}{2\\pi i} \\int_{\\gamma - i\\infty}^{\\gamma + i\\infty} e^{st} F(s)\\,ds',
      type: 'formula'
    }
  ];

  // 1. F(s) = c / s -> c
  const constMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/s$/);
  if (constMatch) {
    const coeffStr = constMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const cFormatted = formatNumber(c);

    steps.push({
      title: 'Standard Step Function Pair',
      explanation: '1/s corresponds to the Heaviside unit step u(t) = 1 for t ≥ 0:',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{1}{s}\\right\\} = 1',
      rule: 'Step Pair',
      type: 'formula'
    });
    steps.push({
      title: 'Multiply by Numerator Constant',
      explanation: `Scale unit step by constant ${cFormatted}:`,
      expression: `\\mathcal{L}^{-1}\\left\\{\\frac{${cFormatted}}{s}\\right\\} = ${cFormatted}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: cFormatted,
      resultLatex: cFormatted,
      method: 'Standard Step Pair: 1/s → 1',
      steps
    };
  }

  // 2. F(s) = c / s^n -> c * t^(n-1) / (n-1)!
  const powerMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/s\^(\d+)$/);
  if (powerMatch) {
    const coeffStr = powerMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const n = parseInt(powerMatch[2], 10);
    const tPower = n - 1;
    const fact = factorial(tPower);
    const netCoeff = c / fact;
    const coeffFormatted = formatNumber(netCoeff);

    const tStr = tPower === 1 ? 't' : `t^${tPower}`;
    const tLatex = tPower === 1 ? 't' : `t^{${tPower}}`;

    const resFt = netCoeff === 1 ? tStr : netCoeff === -1 ? `-${tStr}` : `${coeffFormatted}*${tStr}`;
    const resLatex = netCoeff === 1 ? tLatex : netCoeff === -1 ? `-${tLatex}` : `${coeffFormatted}${tLatex}`;

    steps.push({
      title: 'Inverse Monomial / Power Theorem',
      explanation: 'Use the standard power rule for polynomials:',
      expression: `\\mathcal{L}^{-1}\\left\\{\\frac{n!}{s^{n+1}}\\right\\} = t^n \\implies \\mathcal{L}^{-1}\\left\\{\\frac{1}{s^{${n}}}\\right\\} = \\frac{t^{${tPower}}}{${fact}}`,
      rule: `Power Pair (denominator s^${n})`,
      type: 'formula'
    });
    steps.push({
      title: 'Calculate Time Function',
      explanation: `Here denominator power is ${n}, so time power is n - 1 = ${tPower}. (n-1)! = ${fact}. Multiplied by numerator ${formatNumber(c)}:`,
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: `Power Pair: 1/s^${n} → t^${tPower} / ${tPower}!`,
      steps
    };
  }

  // 3. F(s) = c / (s - a) or c / (s + a)
  const shiftMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/\(s([+-]\d*(?:\.\d+)?)\)$/);
  if (shiftMatch) {
    const coeffStr = shiftMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const signVal = parseFloat(shiftMatch[2]);
    const a = -signVal;
    const cFormatted = formatNumber(c);

    const expStr = a === 1 ? 'e^t' : a === -1 ? 'e^(-t)' : `e^(${formatNumber(a)}t)`;
    const expLatex = a === 1 ? 'e^{t}' : a === -1 ? 'e^{-t}' : `e^{${formatNumber(a)}t}`;

    const resFt = c === 1 ? expStr : c === -1 ? `-${expStr}` : `${cFormatted}*${expStr}`;
    const resLatex = c === 1 ? expLatex : c === -1 ? `-${expLatex}` : `${cFormatted}${expLatex}`;

    steps.push({
      title: 'First Shifting Theorem / Simple Pole',
      explanation: 'A first-order pole at s = a corresponds to exponential growth or decay:',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{1}{s - a}\\right\\} = e^{at}',
      rule: 'Exponential Shift Pair',
      type: 'formula'
    });
    steps.push({
      title: 'Identify Pole Location',
      explanation: `Here denominator is (s - (${a})), meaning pole a = ${a}. Multiply by numerator ${cFormatted}:`,
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: `Exponential Shift: 1/(s - ${a}) → e^(${a}t)`,
      steps
    };
  }

  // 4. F(s) = c / (s - a)^n
  const shiftPowerMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/\(s([+-]\d*(?:\.\d+)?)\)\^(\d+)$/);
  if (shiftPowerMatch) {
    const coeffStr = shiftPowerMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const a = -parseFloat(shiftPowerMatch[2]);
    const n = parseInt(shiftPowerMatch[3], 10);
    const tPower = n - 1;
    const fact = factorial(tPower);
    const netCoeff = c / fact;
    const cFormatted = formatNumber(netCoeff);

    const tStr = tPower === 1 ? 't' : `t^${tPower}`;
    const tLatex = tPower === 1 ? 't' : `t^{${tPower}}`;
    const expStr = `e^(${formatNumber(a)}t)`;
    const expLatex = `e^{${formatNumber(a)}t}`;

    const resFt = `${cFormatted === '1' ? '' : `${cFormatted}*`}${tStr}*${expStr}`;
    const resLatex = `${cFormatted === '1' ? '' : `${cFormatted}`}${tLatex}${expLatex}`;

    steps.push({
      title: 'Shifted Power Rule',
      explanation: 'Combine the power theorem with the first shifting property:',
      expression: `\\mathcal{L}^{-1}\\left\\{\\frac{1}{(s - a)^n}\\right\\} = \\frac{t^{n-1} e^{at}}{(n-1)!}`,
      type: 'formula'
    });
    steps.push({
      title: 'Compute Shifted Polynomial',
      explanation: `Here n = ${n}, pole a = ${a}, (n-1)! = ${fact}:`,
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: 'Shifted Repeated Pole Rule',
      steps
    };
  }

  // 5. Quadratic denominator: c / (s^2 + w^2) -> (c/w) sin(wt)
  const sinMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/\(s\^2\+(\d+(?:\.\d+)?)\)$/);
  if (sinMatch) {
    const coeffStr = sinMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const w2 = parseFloat(sinMatch[2]);
    const w = Math.sqrt(w2);
    const netCoeff = c / w;
    const wFormatted = Number.isInteger(w) ? `${w}` : formatNumber(w);
    const coeffFormatted = formatNumber(netCoeff);

    const resFt = Number.isInteger(w) && c === 1
      ? `(1/${w})*sin(${w}t)`
      : `${coeffFormatted}*sin(${wFormatted}t)`;
    const resLatex = Number.isInteger(w) && c === 1
      ? `\\frac{1}{${w}} \\sin(${w}t)`
      : `${coeffFormatted} \\sin(${wFormatted}t)`;

    steps.push({
      title: 'Trigonometric Sine Standard Pair',
      explanation: 'Identify the imaginary axis poles ±wi producing pure oscillations:',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{w}{s^2 + w^2}\\right\\} = \\sin(wt)',
      rule: 'Sine Transform Pair',
      type: 'formula'
    });
    steps.push({
      title: 'Determine Frequency Parameter',
      explanation: `Here w² = ${w2} ⇒ w = ${wFormatted}. Scale numerator ${formatNumber(c)} by 1/w = 1/${wFormatted}:`,
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: `Sine Pair: 1/(s² + ${w2}) → (1/${wFormatted})·sin(${wFormatted}t)`,
      steps
    };
  }

  // 6. Quadratic denominator: s / (s^2 + w^2) or c*s / (s^2 + w^2) -> c*cos(wt)
  const cosMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?s\/\(s\^2\+(\d+(?:\.\d+)?)\)$/);
  if (cosMatch) {
    const coeffStr = cosMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const w2 = parseFloat(cosMatch[2]);
    const w = Math.sqrt(w2);
    const wFormatted = Number.isInteger(w) ? `${w}` : formatNumber(w);
    const cFormatted = formatNumber(c);

    const resFt = c === 1 ? `cos(${wFormatted}t)` : c === -1 ? `-cos(${wFormatted}t)` : `${cFormatted}*cos(${wFormatted}t)`;
    const resLatex = c === 1 ? `\\cos(${wFormatted}t)` : c === -1 ? `-\\cos(${wFormatted}t)` : `${cFormatted} \\cos(${wFormatted}t)`;

    steps.push({
      title: 'Trigonometric Cosine Standard Pair',
      explanation: 'A numerator proportional to s indicates a cosine oscillation:',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{s}{s^2 + w^2}\\right\\} = \\cos(wt)',
      rule: 'Cosine Transform Pair',
      type: 'formula'
    });
    steps.push({
      title: 'Determine Angular Frequency',
      explanation: `Here parameter w² = ${w2} ⇒ w = ${wFormatted}:`,
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: `Cosine Pair: s/(s² + ${w2}) → cos(${wFormatted}t)`,
      steps
    };
  }

  // 7. Hyperbolic: c / (s^2 - w^2) -> (c/w) sinh(wt)
  const sinhMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/\(s\^2\-(\d+(?:\.\d+)?)\)$/);
  if (sinhMatch) {
    const coeffStr = sinhMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const w2 = parseFloat(sinhMatch[2]);
    const w = Math.sqrt(w2);
    const wFormatted = Number.isInteger(w) ? `${w}` : formatNumber(w);
    const netCoeff = c / w;
    const resFt = `${formatNumber(netCoeff)}*sinh(${wFormatted}t)`;
    const resLatex = `${formatNumber(netCoeff)} \\sinh(${wFormatted}t)`;

    steps.push({
      title: 'Hyperbolic Sine Standard Pair',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{w}{s^2 - w^2}\\right\\} = \\sinh(wt)',
      type: 'formula'
    });
    steps.push({
      title: 'Calculate Result',
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: 'Hyperbolic Sine Pair',
      steps
    };
  }

  // 8. Hyperbolic: s / (s^2 - w^2) -> cosh(wt)
  const coshMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?s\/\(s\^2\-(\d+(?:\.\d+)?)\)$/);
  if (coshMatch) {
    const coeffStr = coshMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const w2 = parseFloat(coshMatch[2]);
    const w = Math.sqrt(w2);
    const wFormatted = Number.isInteger(w) ? `${w}` : formatNumber(w);
    const cFormatted = formatNumber(c);

    const resFt = c === 1 ? `cosh(${wFormatted}t)` : `${cFormatted}*cosh(${wFormatted}t)`;
    const resLatex = c === 1 ? `\\cosh(${wFormatted}t)` : `${cFormatted} \\cosh(${wFormatted}t)`;

    steps.push({
      title: 'Hyperbolic Cosine Standard Pair',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{s}{s^2 - w^2}\\right\\} = \\cosh(wt)',
      type: 'formula'
    });
    steps.push({
      title: 'Calculate Result',
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: 'Hyperbolic Cosine Pair',
      steps
    };
  }

  // 9. Damped oscillation with completed square denominator:
  // c / ((s - a)^2 + w^2) -> (c/w) e^(at) sin(wt)
  const dampedSinMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)\/\(\(s([+-]\d*(?:\.\d+)?)\)\^2\+(\d+(?:\.\d+)?)\)$/);
  if (dampedSinMatch) {
    const coeffStr = dampedSinMatch[1];
    const c = !coeffStr || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
    const a = -parseFloat(dampedSinMatch[2]);
    const w2 = parseFloat(dampedSinMatch[3]);
    const w = Math.sqrt(w2);
    const netCoeff = c / w;
    const wFormatted = Number.isInteger(w) ? `${w}` : formatNumber(w);
    const coeffFormatted = formatNumber(netCoeff);
    const expStr = `e^(${formatNumber(a)}t)`;
    const expLatex = `e^{${formatNumber(a)}t}`;

    const resFt = `${coeffFormatted}*${expStr}*sin(${wFormatted}t)`;
    const resLatex = `${coeffFormatted}${expLatex} \\sin(${wFormatted}t)`;

    steps.push({
      title: 'Damped Sine Inversion via Frequency Shifting',
      explanation: 'Use the frequency shifting theorem on a sine pair:',
      expression: '\\mathcal{L}^{-1}\\left\\{\\frac{w}{(s - a)^2 + w^2}\\right\\} = e^{at} \\sin(wt)',
      type: 'formula'
    });
    steps.push({
      title: 'Compute Inverse Function',
      explanation: `Here decay parameter a = ${a}, frequency w = ${wFormatted}:`,
      expression: `f(t) = ${resLatex}`,
      type: 'conclusion'
    });

    return {
      inputFs: FsInput,
      resultFt: resFt,
      resultLatex: resLatex,
      method: 'Damped Sine Transform Pair',
      steps
    };
  }

  // 10. Distinct linear poles in product: 1 / ((s - p1)*(s - p2))
  const twoPoleMatch = clean.match(/^1\/\(\(s([+-]\d*(?:\.\d+)?)\)\*\(s([+-]\d*(?:\.\d+)?)\)\)$/);
  if (twoPoleMatch) {
    const p1 = -parseFloat(twoPoleMatch[1]);
    const p2 = -parseFloat(twoPoleMatch[2]);
    if (p1 !== p2) {
      const A = 1 / (p1 - p2);
      const B = -A;
      const formattedA = formatNumber(A);
      const formattedB = formatNumber(B);

      steps.push({
        title: 'Partial Fraction Decomposition',
        explanation: 'Expand rational expression into distinct simple linear poles:',
        expression: `\\frac{1}{(s - ${p1})(s - ${p2})} = \\frac{A}{s - ${p1}} + \\frac{B}{s - ${p2}}`,
        type: 'formula'
      });
      steps.push({
        title: 'Heaviside Cover-Up Method',
        explanation: 'Evaluate residue at each pole:',
        expression: `A = \\lim_{s \\to ${p1}} (s - ${p1}) F(s) = \\frac{1}{${p1} - (${p2})} = ${formattedA}, \\quad B = ${formattedB}`,
        type: 'general'
      });

      const resFt = `${formattedA}*e^(${p1}t) + ${formattedB}*e^(${p2}t)`.replace(/\+\s*-/g, '- ');
      const resLatex = `${formattedA}e^{${p1}t} + ${formattedB}e^{${p2}t}`.replace(/\+\s*-/g, '- ');

      steps.push({
        title: 'Invert Linear Terms',
        explanation: 'Apply exponential shift pair to each component:',
        expression: `f(t) = ${resLatex}`,
        type: 'conclusion'
      });

      return {
        inputFs: FsInput,
        resultFt: resFt,
        resultLatex: resLatex,
        method: 'Partial Fraction Decomposition',
        partialFractions: [`${formattedA} / (s - ${p1})`, `${formattedB} / (s - ${p2})`],
        steps
      };
    }
  }

  throw new Error(
    `The frequency-domain function "${FsInput}" is not currently supported for analytical inversion. Supported forms include 1/s, c/sⁿ, 1/(s - a), c/(s² + w²), s/(s² + w²), hyperbolic forms, frequency shifted poles 1/(s - a)ⁿ, and damped quadratic expressions.`
  );
}

/**
 * Inverts linear combination of rational terms
 */
function invertLinearCombination(FsInput: string, terms: string[]): InverseLaplaceResult {
  const steps: (string | VisualMathStep)[] = [
    {
      title: 'Linearity of the Inverse Laplace Transform',
      explanation: 'The inverse Laplace transform is a linear operator:',
      expression: '\\mathcal{L}^{-1}\\{c_1 F_1(s) + c_2 F_2(s)\\} = c_1 \\mathcal{L}^{-1}\\{F_1(s)\\} + c_2 \\mathcal{L}^{-1}\\{F_2(s)\\}',
      rule: 'Linearity Theorem',
      type: 'formula'
    }
  ];

  const results: InverseLaplaceResult[] = [];

  for (let i = 0; i < terms.length; i++) {
    const tStr = terms[i];
    const subRes = invertSingleTerm(tStr, tStr.replace(/\s+/g, ''));
    results.push(subRes);

    steps.push({
      title: `Component ${i + 1}: \\mathcal{L}^{-1}\\{${tStr}\\}`,
      explanation: `Inverting using ${subRes.method}:`,
      expression: `\\mathcal{L}^{-1}\\{${tStr}\\} = ${subRes.resultLatex || subRes.resultFt}`,
      type: 'general'
    });
  }

  const combinedLatex = results.map(r => r.resultLatex || r.resultFt).join(' + ').replace(/\+\s*-/g, '- ');
  const combinedStr = results.map(r => r.resultFt).join(' + ').replace(/\+\s*-/g, '- ');

  steps.push({
    title: 'Sum of Inverted Components',
    explanation: 'Assemble full real time-domain response:',
    expression: `f(t) = ${combinedLatex}`,
    type: 'conclusion'
  });

  return {
    inputFs: FsInput,
    resultFt: combinedStr,
    resultLatex: combinedLatex,
    method: 'Linearity Property (Term-by-Term Inversion)',
    steps
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
