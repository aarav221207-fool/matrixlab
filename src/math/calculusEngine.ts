import { formatNumber } from '../utils/formatting';
import * as math from 'mathjs';

export interface DerivativeStep {
  title: string;
  rule: string;
  expression: string;
  transformation?: string;
  explanation?: string;
  before?: string;
  after?: string;
  type?: 'derivative' | 'rule' | 'conclusion' | 'equation' | 'general';
}

export interface DerivativeResult {
  expression: string;
  variable: string;
  order: number;
  result: string;
  simplified: string;
  steps: DerivativeStep[];
  evaluationAtPoint?: { point: number; value: number };
}

export interface IntegralResult {
  integrand: string;
  variable: string;
  type: 'indefinite' | 'definite';
  result: string;
  constantOfIntegration?: string;
  lowerBound?: number;
  upperBound?: number;
  numericalValue?: number;
  method: string;
  steps: string[];
}

export interface LimitResult {
  expression: string;
  variable: string;
  target: number | string;
  direction?: 'left' | 'right' | 'both';
  result: number | string;
  steps: string[];
}

export interface TaylorSeriesResult {
  expression: string;
  variable: string;
  point: number;
  order: number;
  series: string;
  terms: { order: number; coefficient: number; term: string }[];
  steps: string[];
}

/**
 * Calculates 1st, 2nd, or nth derivative with simplification and rule explanation
 */
export function calculateDerivative(
  exprStr: string,
  variable: string = 'x',
  order: number = 1,
  evalPoint?: number
): DerivativeResult {
  if (!exprStr.trim()) throw new Error('Expression cannot be empty.');
  const steps: DerivativeStep[] = [];

  let current = exprStr;
  let simplified = exprStr;

  steps.push({
    title: 'ORIGINAL FUNCTION',
    rule: 'Initial function state',
    expression: `f(${variable}) = ${exprStr}`,
    explanation: `We begin with the function that we want to differentiate with respect to ${variable}.`,
    type: 'derivative'
  });

  for (let i = 1; i <= order; i++) {
    try {
      const parsed = math.parse(current);
      const derived = math.derivative(parsed, variable);
      const simplifiedNode = math.simplify(derived);
      
      const prev = current;
      current = derived.toString();
      simplified = simplifiedNode.toString();

      // Identify rule used for step explanation
      let rule = 'Sum/Difference Rule: d/dx[u ± v] = u\' ± v\'';
      let transformation = `d/d${variable}[${prev}] → ${current}`;
      let explanation = `Differentiate term by term using fundamental calculus differentiation rules.`;

      if (exprStr.includes('^')) {
        rule = 'Power Rule: d/dx[xⁿ] = n·xⁿ⁻¹';
        explanation = 'For power terms xⁿ, multiply by the current exponent n and decrement the power by 1.';
      }
      if (exprStr.includes('sin') || exprStr.includes('cos') || exprStr.includes('tan')) {
        rule = 'Trigonometric & Chain Rule: d/dx[sin(u)] = cos(u)·u\', d/dx[cos(u)] = -sin(u)·u\'';
        explanation = 'Apply trigonometric differentiation rules combined with the chain rule for inner arguments.';
      }
      if (exprStr.includes('exp') || exprStr.includes('e^')) {
        rule = 'Exponential Rule: d/dx[eᵘ] = eᵘ·u\'';
        explanation = 'The natural exponential function differentiates to itself multiplied by the derivative of its exponent.';
      }
      if (exprStr.includes('log') || exprStr.includes('ln')) {
        rule = 'Logarithmic Rule: d/dx[ln(u)] = u\'/u';
        explanation = 'The derivative of ln(u) equals the reciprocal of the inner argument multiplied by the derivative of the inner argument.';
      }

      steps.push({
        title: order === 1 ? 'APPLY DIFFERENTIATION RULES' : `APPLY RULES: ORDER ${i} DERIVATIVE`,
        rule,
        expression: current,
        transformation,
        explanation,
        type: 'derivative'
      });

      steps.push({
        title: order === 1 ? 'COMBINE AND SIMPLIFY TERMS' : `SIMPLIFY ORDER ${i} DERIVATIVE`,
        rule: `Algebraic Simplification: f${i > 1 ? `^(${i})` : '\''}(${variable})`,
        expression: `f${i > 1 ? `^(${i})` : '\''}(${variable}) = ${simplified}`,
        explanation: 'Group like terms and reduce algebraic coefficients to obtain the simplified derivative function.',
        type: 'conclusion'
      });
    } catch (e: any) {
      throw new Error(`Differentiation failed: ${e.message || 'Syntax error in mathematical expression'}`);
    }
  }

  let evaluationAtPoint: { point: number; value: number } | undefined;
  if (evalPoint !== undefined && !isNaN(evalPoint)) {
    try {
      const scope: Record<string, number> = {};
      scope[variable] = evalPoint;
      const val = math.evaluate(simplified, scope);
      if (typeof val === 'number' && !isNaN(val)) {
        evaluationAtPoint = { point: evalPoint, value: val };
        steps.push({
          title: `EVALUATE AT ${variable} = ${evalPoint}`,
          rule: 'Direct Coordinate Substitution',
          expression: `f${order > 1 ? `^(${order})` : '\''}(${evalPoint}) = ${val}`,
          transformation: `Substitute ${variable} = ${evalPoint} into ${simplified} → ${val}`,
          explanation: `Evaluating the derivative at ${variable} = ${evalPoint} computes the instantaneous rate of change and the exact slope of the tangent line at that point.`,
          type: 'conclusion'
        });
      }
    } catch {
      // Ignore evaluation errors if out of domain
    }
  }

  return {
    expression: exprStr,
    variable,
    order,
    result: current,
    simplified,
    steps,
    evaluationAtPoint
  };
}

/**
 * Calculates partial derivatives: fx, fy, and gradient vector [fx, fy]
 */
export function calculatePartialDerivatives(exprStr: string): {
  fx: string;
  fy: string;
  gradient: string;
  steps: string[];
} {
  const fxResult = calculateDerivative(exprStr, 'x', 1);
  const fyResult = calculateDerivative(exprStr, 'y', 1);

  return {
    fx: fxResult.simplified,
    fy: fyResult.simplified,
    gradient: `∇f(x, y) = [ ${fxResult.simplified},  ${fyResult.simplified} ]`,
    steps: [
      `1. Treat y as a constant, differentiate with respect to x: ∂f/∂x = ${fxResult.simplified}`,
      `2. Treat x as a constant, differentiate with respect to y: ∂f/∂y = ${fyResult.simplified}`,
      `3. Formulate the gradient vector: ∇f = (∂f/∂x) i + (∂f/∂y) j`
    ]
  };
}

/**
 * Performs symbolic integration for common elementary functions and numerical integration for definite bounds
 */
export function calculateIntegral(
  integrandStr: string,
  variable: string = 'x',
  type: 'indefinite' | 'definite' = 'indefinite',
  lowerBound?: number,
  upperBound?: number
): IntegralResult {
  const trimmed = integrandStr.trim();
  if (!trimmed) throw new Error('Integrand cannot be empty.');

  const steps: string[] = [];
  let symbolicResult = '';
  let method = 'Standard integration identities';

  // Symbolic integration engine for common functions
  try {
    const parsed = math.parse(trimmed);
    const sym = trySymbolicIntegration(parsed, variable);
    if (sym) {
      symbolicResult = sym.result;
      method = sym.method;
      steps.push(...sym.steps);
    } else {
      // Fallback to polynomial/linear term integration
      symbolicResult = `∫(${trimmed}) d${variable}`;
      steps.push('Expression does not possess an elementary symbolic antiderivative or requires advanced special functions.');
    }
  } catch (e: any) {
    symbolicResult = `∫(${trimmed}) d${variable}`;
    steps.push('Applying numerical approximation.');
  }

  if (type === 'definite') {
    if (lowerBound === undefined || upperBound === undefined || isNaN(lowerBound) || isNaN(upperBound)) {
      throw new Error('Both lower and upper bounds must be provided for definite integration.');
    }

    // Numerical quadrature using Adaptive Simpson's 1/3 rule
    const numericalVal = simpsonsRule(trimmed, variable, lowerBound, upperBound, 1000);
    steps.push(
      `Evaluate definite integral from ${variable} = ${lowerBound} to ${variable} = ${upperBound}`,
      `Fundamental Theorem of Calculus: ∫ₐᵇ f(x)dx = F(b) - F(a)`,
      `Numerical approximation via Simpson's 1/3 quadrature (1,000 sub-intervals): ≈ ${formatNumber(numericalVal)}`
    );

    return {
      integrand: trimmed,
      variable,
      type: 'definite',
      result: formatNumber(numericalVal),
      lowerBound,
      upperBound,
      numericalValue: numericalVal,
      method,
      steps
    };
  } else {
    // Indefinite
    steps.push(`Add constant of integration: + C`);
    return {
      integrand: trimmed,
      variable,
      type: 'indefinite',
      result: symbolicResult.startsWith('∫') ? symbolicResult : `${symbolicResult} + C`,
      constantOfIntegration: 'C',
      method,
      steps
    };
  }
}

/**
 * Symbolic integration rules for common families: polynomials, powers, e^ax, sin(ax), cos(ax), 1/x, etc.
 */
function trySymbolicIntegration(
  node: math.MathNode,
  variable: string
): { result: string; method: string; steps: string[] } | null {
  const expr = node.toString().replace(/\s+/g, '');

  // 1. Constant c -> c*x
  if (node.type === 'ConstantNode') {
    const val = (node as any).value;
    return {
      result: `${val}*${variable}`,
      method: 'Constant Rule: ∫ c dx = c·x',
      steps: [`Integrate constant ${val}: result is ${val}·${variable}`]
    };
  }

  // 2. x -> (1/2)*x^2
  if (node.type === 'SymbolNode' && (node as any).name === variable) {
    return {
      result: `(1/2)*${variable}^2`,
      method: 'Power Rule: ∫ xⁿ dx = xⁿ⁺¹/(n+1)',
      steps: [`Apply power rule to ${variable}¹: (1/2)·${variable}²`]
    };
  }

  // 3. x^n
  if (expr.match(new RegExp(`^${variable}\\^(\\d+)$`))) {
    const m = expr.match(new RegExp(`^${variable}\\^(\\d+)$`));
    if (m) {
      const n = parseInt(m[1], 10);
      const newN = n + 1;
      return {
        result: `(1/${newN})*${variable}^${newN}`,
        method: 'Power Rule: ∫ xⁿ dx = xⁿ⁺¹/(n+1)',
        steps: [`Power increases from ${n} to ${newN}: (1/${newN})·${variable}^${newN}`]
      };
    }
  }

  // 4. c * x^n
  const polyMatch = expr.match(new RegExp(`^([+-]?\\d*(?:\\.\\d+)?)\\*?${variable}(?:\\^(\\d+))?$`));
  if (polyMatch) {
    let coeffStr = polyMatch[1];
    let coeff = 1;
    if (coeffStr === '-' || coeffStr === '') coeff = coeffStr === '-' ? -1 : 1;
    else coeff = parseFloat(coeffStr);

    const power = polyMatch[2] ? parseInt(polyMatch[2], 10) : 1;
    const newPower = power + 1;
    const newCoeff = coeff / newPower;
    return {
      result: `${formatFractionOrNum(newCoeff)}*${variable}^${newPower}`,
      method: 'Power Rule with Constant Multiple',
      steps: [`Factor out constant ${coeff}, integrate ${variable}^${power} to obtain (1/${newPower})·${variable}^${newPower}`]
    };
  }

  // 5. sin(kx) -> -cos(kx)/k
  const sinMatch = expr.match(new RegExp(`^sin\\(([+-]?\\d*(?:\\.\\d+)?)\\*?${variable}\\)$`));
  if (sinMatch) {
    const kStr = sinMatch[1];
    const k = (kStr === '' || kStr === '+') ? 1 : (kStr === '-' ? -1 : parseFloat(kStr));
    return {
      result: `${k === 1 ? '-' : `${-1/k}*`}cos(${k === 1 ? '' : `${k}*`}${variable})`,
      method: 'Trigonometric Integral: ∫ sin(kx) dx = -(1/k)·cos(kx)',
      steps: [`Apply substitution u = ${k}${variable}, du = ${k} dx`]
    };
  }

  // 6. cos(kx) -> sin(kx)/k
  const cosMatch = expr.match(new RegExp(`^cos\\(([+-]?\\d*(?:\\.\\d+)?)\\*?${variable}\\)$`));
  if (cosMatch) {
    const kStr = cosMatch[1];
    const k = (kStr === '' || kStr === '+') ? 1 : (kStr === '-' ? -1 : parseFloat(kStr));
    return {
      result: `${k === 1 ? '' : `${1/k}*`}sin(${k === 1 ? '' : `${k}*`}${variable})`,
      method: 'Trigonometric Integral: ∫ cos(kx) dx = (1/k)·sin(kx)',
      steps: [`Apply substitution u = ${k}${variable}, du = ${k} dx`]
    };
  }

  // 7. e^(kx) or exp(kx) -> (1/k)*e^(kx)
  const expMatch = expr.match(new RegExp(`^(?:exp|e\\^)\\(([+-]?\\d*(?:\\.\\d+)?)\\*?${variable}\\)$`));
  if (expMatch) {
    const kStr = expMatch[1];
    const k = (kStr === '' || kStr === '+') ? 1 : (kStr === '-' ? -1 : parseFloat(kStr));
    return {
      result: `${k === 1 ? '' : `(1/${k})*`}exp(${k === 1 ? '' : `${k}*`}${variable})`,
      method: 'Exponential Rule: ∫ eᵏˣ dx = (1/k)·eᵏˣ',
      steps: [`Apply u-substitution u = ${k}${variable}`]
    };
  }

  // 8. 1/x -> ln(|x|)
  if (expr === `1/${variable}`) {
    return {
      result: `ln(|${variable}|)`,
      method: 'Reciprocal Rule: ∫ (1/x) dx = ln|x|',
      steps: [`Recall fundamental identity d/dx(ln|x|) = 1/x`]
    };
  }

  // 9. Polynomial sum (OperatorNode '+')
  if (node.type === 'OperatorNode' && (node as any).isAddNode?.()) {
    const left = trySymbolicIntegration((node as any).args[0], variable);
    const right = trySymbolicIntegration((node as any).args[1], variable);
    if (left && right) {
      return {
        result: `${left.result} + ${right.result}`,
        method: 'Sum Rule: ∫ [f(x) + g(x)] dx = ∫ f(x) dx + ∫ g(x) dx',
        steps: [
          `Split by linearity of integration: ∫ f(x) dx + ∫ g(x) dx`,
          ...left.steps,
          ...right.steps
        ]
      };
    }
  }

  return null;
}

function formatFractionOrNum(val: number): string {
  try {
    const frac = math.fraction(val) as any;
    if (frac.d === 1) return `${frac.s * frac.n}`;
    return `(${frac.s * frac.n}/${frac.d})`;
  } catch {
    return formatNumber(val);
  }
}

/**
 * Numerical integration using Composite Simpson's 1/3 rule
 */
export function simpsonsRule(
  exprStr: string,
  variable: string,
  a: number,
  b: number,
  n: number = 1000
): number {
  if (n % 2 !== 0) n++; // Must be even
  const h = (b - a) / n;
  const compiled = math.compile(exprStr);

  const evalAt = (val: number): number => {
    const scope: Record<string, number> = {};
    scope[variable] = val;
    const res = compiled.evaluate(scope);
    return typeof res === 'number' && !isNaN(res) ? res : 0;
  };

  let sum = evalAt(a) + evalAt(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += evalAt(x) * (i % 2 === 0 ? 2 : 4);
  }

  return (h / 3) * sum;
}

/**
 * Calculates Taylor or Maclaurin series expansion
 */
export function calculateTaylorSeries(
  exprStr: string,
  variable: string = 'x',
  point: number = 0,
  order: number = 4
): TaylorSeriesResult {
  const steps: string[] = [
    `Taylor Series formula around ${variable} = a: ∑ₙ₌₀ⁿ [f⁽ⁿ⁾(a) / n!] · (x - a)ⁿ`,
    `Expansion point: a = ${point}, maximum polynomial degree: ${order}`
  ];

  const terms: { order: number; coefficient: number; term: string }[] = [];
  let currentExpr = exprStr;

  for (let n = 0; n <= order; n++) {
    // Evaluate nth derivative at point
    let fnAtA = 0;
    try {
      const scope: Record<string, number> = {};
      scope[variable] = point;
      fnAtA = math.evaluate(currentExpr, scope);
      if (typeof fnAtA !== 'number' || isNaN(fnAtA)) fnAtA = 0;
    } catch {
      fnAtA = 0;
    }

    const factorial = math.factorial(n);
    const coeff = fnAtA / factorial;

    if (Math.abs(coeff) > 1e-7) {
      const powerStr = n === 0 ? '' : n === 1 ? (point === 0 ? variable : `(${variable} - ${point})`) : (point === 0 ? `${variable}^${n}` : `(${variable} - ${point})^${n}`);
      const termStr = n === 0 ? `${formatNumber(coeff)}` : `${formatNumber(coeff)}·${powerStr}`;
      terms.push({ order: n, coefficient: coeff, term: termStr });
      steps.push(`Order ${n}: f⁽${n}⁾(${point}) = ${formatNumber(fnAtA)}, term = (${formatNumber(fnAtA)} / ${n}!) · (${variable} - ${point})ⁿ = ${termStr}`);
    }

    // Compute next derivative
    try {
      currentExpr = math.derivative(currentExpr, variable).toString();
    } catch {
      break;
    }
  }

  const series = terms.length > 0 ? terms.map(t => t.term).join(' + ').replace(/\+\s+-/g, '- ') : '0';

  return {
    expression: exprStr,
    variable,
    point,
    order,
    series,
    terms,
    steps
  };
}

/**
 * Computes limit lim_{x -> c} f(x) analytically and numerically with substitution and one-sided steps
 */
export function calculateLimit(
  exprStr: string,
  variable: string = 'x',
  target: number | string = 0,
  direction: 'left' | 'right' | 'both' = 'both'
): LimitResult {
  const steps: string[] = [
    `Evaluate limit of f(${variable}) = ${exprStr} as ${variable} → ${target} (${direction === 'left' ? 'from left' : direction === 'right' ? 'from right' : 'two-sided'})`
  ];

  const isInfinity = target === 'Infinity' || target === '+Infinity' || target === 'inf' || target === '+inf';
  const isNegInfinity = target === '-Infinity' || target === '-inf';
  const c = isInfinity ? 1e6 : isNegInfinity ? -1e6 : typeof target === 'number' ? target : parseFloat(String(target));

  if (isNaN(c)) throw new Error('Invalid limit target value.');

  const compiled = math.compile(exprStr);
  const evalAt = (val: number): number => {
    const scope: Record<string, number> = {};
    scope[variable] = val;
    try {
      const res = compiled.evaluate(scope);
      return typeof res === 'number' && !isNaN(res) ? res : NaN;
    } catch {
      return NaN;
    }
  };

  // Direct substitution if not infinity
  if (!isInfinity && !isNegInfinity) {
    const directVal = evalAt(c);
    if (!isNaN(directVal) && isFinite(directVal)) {
      steps.push(
        `Step 1: Direct substitution ${variable} = ${c}:`,
        `f(${c}) = ${directVal}`,
        `Function is continuous at ${variable} = ${c}. Limit value is ${directVal}`
      );
      return {
        expression: exprStr,
        variable,
        target,
        direction,
        result: directVal,
        steps
      };
    }
    steps.push(`Step 1: Direct substitution yields undefined or indeterminate expression.`);
  }

  // Numerical sampling around target
  const deltas = [1e-3, 1e-4, 1e-5, 1e-6];
  let leftVal = 0;
  let rightVal = 0;

  if (isInfinity) {
    leftVal = evalAt(1e5);
    rightVal = evalAt(1e6);
    steps.push(`Sample as ${variable} → +∞: f(10⁵) = ${formatNumber(leftVal)}, f(10⁶) = ${formatNumber(rightVal)}`);
  } else if (isNegInfinity) {
    leftVal = evalAt(-1e5);
    rightVal = evalAt(-1e6);
    steps.push(`Sample as ${variable} → -∞: f(-10⁵) = ${formatNumber(leftVal)}, f(-10⁶) = ${formatNumber(rightVal)}`);
  } else {
    for (const d of deltas) {
      const vL = evalAt(c - d);
      const vR = evalAt(c + d);
      if (!isNaN(vL)) leftVal = vL;
      if (!isNaN(vR)) rightVal = vR;
    }
    steps.push(
      `Approaching from left (${variable} → ${c}⁻): f(${c} - 10⁻⁵) ≈ ${formatNumber(leftVal)}`,
      `Approaching from right (${variable} → ${c}⁺): f(${c} + 10⁻⁵) ≈ ${formatNumber(rightVal)}`
    );
  }

  let finalRes: number | string = rightVal;
  if (direction === 'left') {
    finalRes = isNaN(leftVal) ? 'Does not exist (DNE)' : Number(formatNumber(leftVal));
  } else if (direction === 'right') {
    finalRes = isNaN(rightVal) ? 'Does not exist (DNE)' : Number(formatNumber(rightVal));
  } else {
    if (Math.abs(leftVal - rightVal) < 1e-3) {
      finalRes = Number(((leftVal + rightVal) / 2).toFixed(6));
      steps.push(`Left and right limits agree: lim_{${variable} → ${target}} f(${variable}) = ${finalRes}`);
    } else {
      finalRes = 'Does not exist (Left ≠ Right)';
      steps.push(`Left limit (${formatNumber(leftVal)}) ≠ Right limit (${formatNumber(rightVal)}). Two-sided limit does not exist.`);
    }
  }

  return {
    expression: exprStr,
    variable,
    target,
    direction,
    result: finalRes,
    steps
  };
}
