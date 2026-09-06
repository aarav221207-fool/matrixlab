import { formatNumber } from '../utils/formatting';
import * as math from 'mathjs';

export interface ODESolution {
  type: 'first-order-separable' | 'first-order-linear' | 'second-order-linear-homogeneous' | 'unsupported';
  equation: string;
  generalSolution: string;
  particularSolution?: string;
  initialConditions?: { x0: number; y0: number; dy0?: number };
  steps: string[];
  verification: string;
}

/**
 * Solves standard first-order and second-order differential equations with step-by-step reasoning
 */
export function solveDifferentialEquation(
  eqInput: string,
  initialConditions?: { x0: number; y0: number; dy0?: number }
): ODESolution {
  const cleanEq = eqInput.trim().replace(/\s+/g, '');

  // 1. Try Second-Order Linear Homogeneous ODE: a*y'' + b*y' + c*y = 0
  const secondOrderMatch = cleanEq.match(/^([+-]?\d*(?:\.\d+)?)y''([+-]\d*(?:\.\d+)?)y'([+-]\d*(?:\.\d+)?)y=0$/i);
  if (secondOrderMatch) {
    return solveSecondOrderHomogeneous(
      parseCoeff(secondOrderMatch[1]),
      parseCoeff(secondOrderMatch[2]),
      parseCoeff(secondOrderMatch[3]),
      eqInput,
      initialConditions
    );
  }

  // 2. Try simple Second-Order without middle term: a*y'' + c*y = 0
  const secondOrderNoB = cleanEq.match(/^([+-]?\d*(?:\.\d+)?)y''([+-]\d*(?:\.\d+)?)y=0$/i);
  if (secondOrderNoB) {
    return solveSecondOrderHomogeneous(
      parseCoeff(secondOrderNoB[1]),
      0,
      parseCoeff(secondOrderNoB[2]),
      eqInput,
      initialConditions
    );
  }

  // 3. First-Order Linear: dy/dx + P*y = Q (constant P, linear/constant Q)
  // e.g. dy/dx + y = x or dy/dx + 2y = 4 or y' + y = x
  const linearMatch = cleanEq.match(/^(?:dy\/dx|y')\+([+-]?\d*(?:\.\d+)?)y=([a-z0-9+-^.*]+)$/i);
  if (linearMatch) {
    const P = parseCoeff(linearMatch[1]);
    const QStr = linearMatch[2];
    return solveFirstOrderLinear(P, QStr, eqInput, initialConditions);
  }

  // 4. Separable: dy/dx = k*x or dy/dx = k*x^n or dy/dx = k*y
  const separableMatch = cleanEq.match(/^(?:dy\/dx|y')=([a-z0-9+-^.*()]+)$/i);
  if (separableMatch) {
    const rhs = separableMatch[1];
    return solveSeparableODE(rhs, eqInput, initialConditions);
  }

  return {
    type: 'unsupported',
    equation: eqInput,
    generalSolution: 'Symbolic ODE form not recognized',
    steps: [
      'The current symbolic engine supports:',
      '• First-order separable equations: dy/dx = f(x)',
      '• First-order linear ODEs: dy/dx + P·y = Q(x)',
      '• Second-order linear constant coefficient ODEs: a·y\'\' + b·y\' + c·y = 0',
      'Please check your notation (e.g., "dy/dx = 2x", "dy/dx + y = x", or "y\'\' + 3y\' + 2y = 0").'
    ],
    verification: 'N/A'
  };
}

function parseCoeff(str: string): number {
  if (!str || str === '+') return 1;
  if (str === '-') return -1;
  const num = parseFloat(str);
  return isNaN(num) ? 1 : num;
}

/**
 * Solves a*y'' + b*y' + c*y = 0 using characteristic equation a*r^2 + b*r + c = 0
 */
function solveSecondOrderHomogeneous(
  a: number,
  b: number,
  c: number,
  origEq: string,
  ic?: { x0: number; y0: number; dy0?: number }
): ODESolution {
  const steps: string[] = [
    `Standard second-order linear constant-coefficient form: ${a}y'' + ${b}y' + ${c}y = 0`,
    `Assume trial solution y = e^(r·x). Substituting yields the characteristic equation:`,
    `${a}r² + ${b}r + ${c} = 0`
  ];

  const discriminant = b * b - 4 * a * c;
  steps.push(`Discriminant: Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${discriminant}`);

  let generalSol = '';
  let partSol: string | undefined;
  let verification = '';

  if (Math.abs(discriminant) < 1e-9) {
    // Repeated real root
    const r = -b / (2 * a);
    steps.push(
      `Δ = 0: Repeated real root r = ${formatNumber(r)}`,
      `Fundamental solutions: y₁(x) = e^(${r}x), y₂(x) = x·e^(${r}x)`,
      `General Solution: y(x) = (C₁ + C₂·x)·e^(${r}x)`
    );
    generalSol = `y(x) = (C₁ + C₂·x)·e^(${r}x)`;
    verification = `Substituting y(x) into ${a}y'' + ${b}y' + ${c}y yields identically 0.`;

    if (ic && ic.x0 === 0 && ic.dy0 !== undefined) {
      // y(0) = C1 = y0
      const C1 = ic.y0;
      // y'(0) = r*C1 + C2 = dy0 => C2 = dy0 - r*C1
      const C2 = ic.dy0 - r * C1;
      partSol = `y(x) = (${formatNumber(C1)} + ${formatNumber(C2)}·x)·e^(${formatNumber(r)}x)`;
      steps.push(
        `Apply initial conditions y(0) = ${ic.y0}, y'(0) = ${ic.dy0}:`,
        `1. y(0) = C₁ = ${ic.y0} ⇒ C₁ = ${formatNumber(C1)}`,
        `2. y'(0) = r·C₁ + C₂ = ${ic.dy0} ⇒ C₂ = ${formatNumber(C2)}`,
        `Particular Solution: ${partSol}`
      );
    }
  } else if (discriminant > 0) {
    // Distinct real roots
    const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    steps.push(
      `Δ > 0: Two distinct real roots r₁ = ${formatNumber(r1)}, r₂ = ${formatNumber(r2)}`,
      `Fundamental solutions: y₁(x) = e^(${formatNumber(r1)}x), y₂(x) = e^(${formatNumber(r2)}x)`,
      `General Solution: y(x) = C₁·e^(${formatNumber(r1)}x) + C₂·e^(${formatNumber(r2)}x)`
    );
    generalSol = `y(x) = C₁·e^(${formatNumber(r1)}x) + C₂·e^(${formatNumber(r2)}x)`;
    verification = `Direct check: Characteristic roots satisfy ar² + br + c = 0, verifying linear independence.`;

    if (ic && ic.x0 === 0 && ic.dy0 !== undefined) {
      // y(0) = C1 + C2 = y0
      // y'(0) = r1*C1 + r2*C2 = dy0
      // C2 = (dy0 - r1*y0)/(r2 - r1)
      const C2 = (ic.dy0 - r1 * ic.y0) / (r2 - r1);
      const C1 = ic.y0 - C2;
      partSol = `y(x) = ${formatNumber(C1)}·e^(${formatNumber(r1)}x) + ${formatNumber(C2)}·e^(${formatNumber(r2)}x)`;
      steps.push(
        `Apply initial conditions y(0) = ${ic.y0}, y'(0) = ${ic.dy0}:`,
        `Solve 2x2 system: [1, 1; ${formatNumber(r1)}, ${formatNumber(r2)}] [C₁; C₂] = [${ic.y0}; ${ic.dy0}]`,
        `C₁ = ${formatNumber(C1)}, C₂ = ${formatNumber(C2)}`,
        `Particular Solution: ${partSol}`
      );
    }
  } else {
    // Complex conjugate roots r = α ± iβ
    const alpha = -b / (2 * a);
    const beta = Math.sqrt(-discriminant) / (2 * a);
    const alphaStr = Math.abs(alpha) < 1e-9 ? '' : `e^(${formatNumber(alpha)}x)·`;
    steps.push(
      `Δ < 0: Complex conjugate roots r = ${formatNumber(alpha)} ± ${formatNumber(beta)}i`,
      `Using Euler's formula e^(iθ) = cos(θ) + i·sin(θ):`,
      `General Solution: y(x) = ${alphaStr}(C₁·cos(${formatNumber(beta)}x) + C₂·sin(${formatNumber(beta)}x))`
    );
    generalSol = `y(x) = ${alphaStr}(C₁·cos(${formatNumber(beta)}x) + C₂·sin(${formatNumber(beta)}x))`;
    verification = `Oscillatory solution with angular frequency ω = ${formatNumber(beta)}${Math.abs(alpha) > 1e-9 ? ` and damping factor α = ${formatNumber(alpha)}` : ''}.`;

    if (ic && ic.x0 === 0 && ic.dy0 !== undefined) {
      // y(0) = C1 = y0
      const C1 = ic.y0;
      // y'(0) = alpha*C1 + beta*C2 = dy0 => C2 = (dy0 - alpha*C1)/beta
      const C2 = (ic.dy0 - alpha * C1) / beta;
      partSol = `y(x) = ${alphaStr}(${formatNumber(C1)}·cos(${formatNumber(beta)}x) + ${formatNumber(C2)}·sin(${formatNumber(beta)}x))`;
      steps.push(
        `Apply initial conditions y(0) = ${ic.y0}, y'(0) = ${ic.dy0}:`,
        `C₁ = y(0) = ${formatNumber(C1)}`,
        `C₂ = (y'(0) - α·C₁) / β = ${formatNumber(C2)}`,
        `Particular Solution: ${partSol}`
      );
    }
  }

  return {
    type: 'second-order-linear-homogeneous',
    equation: origEq,
    generalSolution: generalSol,
    particularSolution: partSol,
    initialConditions: ic,
    steps,
    verification
  };
}

/**
 * Solves first-order linear ODE: dy/dx + P·y = Q(x)
 */
function solveFirstOrderLinear(
  P: number,
  QStr: string,
  origEq: string,
  ic?: { x0: number; y0: number }
): ODESolution {
  const steps: string[] = [
    `First-order linear form: dy/dx + P(x)·y = Q(x)`,
    `Identify coefficients: P(x) = ${P}, Q(x) = ${QStr}`,
    `1. Calculate Integrating Factor I(x) = exp(∫ P dx) = exp(${P}x)`
  ];

  // Multiply through: d/dx [ y · e^(Px) ] = Q(x) · e^(Px)
  let generalSol = '';
  let partSol: string | undefined;

  if (QStr === '0') {
    // Homogeneous: dy/dx + Py = 0 => y = C*e^(-Px)
    generalSol = `y(x) = C·e^(${-P}x)`;
    steps.push(
      `2. Homogeneous right-hand side (Q = 0):`,
      `dy / y = -${P} dx ⇒ ln|y| = -${P}x + C* ⇒ y(x) = C·e^(${-P}x)`
    );
  } else if (QStr === 'x') {
    // dy/dx + Py = x
    // ∫ x*e^(Px) dx = (e^(Px)/P^2)*(Px - 1)
    // y = x/P - 1/P^2 + C*e^(-Px)
    const invP = 1 / P;
    const invP2 = 1 / (P * P);
    generalSol = `y(x) = ${invP === 1 ? '' : `${formatNumber(invP)}`}x - ${formatNumber(invP2)} + C·e^(${-P}x)`;
    steps.push(
      `2. Multiply equation by integrating factor e^(${P}x):`,
      `d/dx [ y·e^(${P}x) ] = x·e^(${P}x)`,
      `3. Integrate right-hand side using integration by parts: ∫ x·e^(${P}x) dx = e^(${P}x)·(x/${P} - 1/${P}²) + C`,
      `4. Divide by e^(${P}x): y(x) = x/${P} - 1/${P}² + C·e^(${-P}x)`
    );
  } else {
    // General constant Q
    const qVal = parseFloat(QStr);
    if (!isNaN(qVal)) {
      const steadyState = qVal / P;
      generalSol = `y(x) = ${formatNumber(steadyState)} + C·e^(${-P}x)`;
      steps.push(
        `2. Constant RHS Q = ${qVal}:`,
        `Particular solution is steady-state y_p = Q / P = ${qVal} / ${P} = ${formatNumber(steadyState)}`,
        `General Solution: y(x) = y_p + y_h = ${formatNumber(steadyState)} + C·e^(${-P}x)`
      );
    } else {
      generalSol = `y(x) = e^(${-P}x) · [ ∫ ${QStr}·e^(${P}x) dx + C ]`;
      steps.push(`General solution expressed via integrating factor: y(x) = e^(${-P}x) · (∫ ${QStr}·e^(${P}x) dx + C)`);
    }
  }

  if (ic && ic.x0 === 0) {
    // Compute C
    if (QStr === 'x') {
      const invP2 = 1 / (P * P);
      // y(0) = -invP2 + C = y0 => C = y0 + invP2
      const C = ic.y0 + invP2;
      partSol = `y(x) = ${formatNumber((1/P))}x - ${formatNumber(invP2)} + ${formatNumber(C)}·e^(${-P}x)`;
      steps.push(`Apply initial condition y(0) = ${ic.y0}: C = ${formatNumber(C)} ⇒ ${partSol}`);
    } else if (!isNaN(parseFloat(QStr))) {
      const steadyState = parseFloat(QStr) / P;
      const C = ic.y0 - steadyState;
      partSol = `y(x) = ${formatNumber(steadyState)} + ${formatNumber(C)}·e^(${-P}x)`;
      steps.push(`Apply initial condition y(0) = ${ic.y0}: C = ${formatNumber(C)} ⇒ ${partSol}`);
    }
  }

  return {
    type: 'first-order-linear',
    equation: origEq,
    generalSolution: generalSol,
    particularSolution: partSol,
    initialConditions: ic,
    steps,
    verification: `Differentiating y(x) and substituting into dy/dx + (${P})y recovers ${QStr}.`
  };
}

/**
 * Solves separable ODE: dy/dx = f(x)
 */
function solveSeparableODE(
  rhs: string,
  origEq: string,
  ic?: { x0: number; y0: number }
): ODESolution {
  const steps: string[] = [
    `Separable form: dy = (${rhs}) dx`,
    `Integrate both sides: ∫ 1 dy = ∫ (${rhs}) dx`
  ];

  let generalSol = '';
  let partSol: string | undefined;

  // Check simple powers like 2x, x^2, etc.
  if (rhs === '2x' || rhs === '2*x') {
    generalSol = 'y(x) = x² + C';
    steps.push(
      '∫ 2x dx = x² + C',
      'General Solution: y(x) = x² + C'
    );
    if (ic) {
      // y(x0) = x0^2 + C = y0 => C = y0 - x0^2
      const C = ic.y0 - ic.x0 * ic.x0;
      partSol = `y(x) = x² + ${C}`;
      steps.push(`Apply initial condition y(${ic.x0}) = ${ic.y0}: C = ${C} ⇒ ${partSol}`);
    }
  } else if (rhs === 'x') {
    generalSol = 'y(x) = (1/2)x² + C';
    steps.push('∫ x dx = (1/2)x² + C');
    if (ic) {
      const C = ic.y0 - 0.5 * ic.x0 * ic.x0;
      partSol = `y(x) = 0.5x² + ${C}`;
    }
  } else if (rhs === 'y') {
    generalSol = 'y(x) = C·e^x';
    steps.push(
      'Separate variables: dy / y = dx',
      'Integrate: ln|y| = x + c₁ ⇒ y(x) = C·e^x'
    );
    if (ic) {
      const C = ic.y0 / Math.exp(ic.x0);
      partSol = `y(x) = ${formatNumber(C)}·e^x`;
    }
  } else {
    generalSol = `y(x) = ∫ (${rhs}) dx + C`;
    steps.push(`Evaluate antiderivative of (${rhs}) with respect to x, plus constant C.`);
  }

  return {
    type: 'first-order-separable',
    equation: origEq,
    generalSolution: generalSol,
    particularSolution: partSol,
    initialConditions: ic,
    steps,
    verification: `d/dx[${generalSol}] = ${rhs}`
  };
}
