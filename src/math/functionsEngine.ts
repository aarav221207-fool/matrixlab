import * as math from 'mathjs';

export interface FunctionAnalysis {
  expression: string;
  variable: string;
  domain: string;
  domainReasoning: string[];
  range: string;
  rangeReasoning: string[];
  yIntercept?: string;
  roots: string[];
  criticalPoints: { x: number; y: number; type: 'local_min' | 'local_max' | 'inflection' }[];
  intervalsIncrease: string[];
  intervalsDecrease: string[];
  asymptotes: { vertical: string[]; horizontal: string[]; oblique?: string };
  symmetry: 'Even: f(-x) = f(x)' | 'Odd: f(-x) = -f(x)' | 'Neither';
  firstDerivative: string;
  secondDerivative: string;
  steps: string[];
}

/**
 * Analyzes domain, range, roots, critical points, asymptotes, symmetry, and extrema of a real function f(x)
 */
export function analyzeFunction(exprInput: string, variable: string = 'x'): FunctionAnalysis {
  const clean = exprInput.trim();
  if (!clean) throw new Error('Function expression cannot be empty.');

  const steps: string[] = [`Analyzing real function f(${variable}) = ${clean}`];
  const domainReasons: string[] = [];
  const rangeReasons: string[] = [];
  const verticalAsymptotes: string[] = [];
  const horizontalAsymptotes: string[] = [];

  // Parse derivatives
  let f1 = '';
  let f2 = '';
  try {
    const d1 = math.derivative(clean, variable);
    const d2 = math.derivative(d1, variable);
    f1 = math.simplify(d1).toString();
    f2 = math.simplify(d2).toString();
  } catch {
    f1 = 'N/A';
    f2 = 'N/A';
  }

  // 1. Domain Analysis
  let domainStr = '(-∞, +∞) [All real numbers ℝ]';

  // Check 1: Denominators
  // e.g. 1/(x - 2) or .../(expr)
  const denomMatches = clean.match(/\/\(([a-z0-9+-^.*]+)\)|\/([a-zA-Z0-9_]+)/g);
  const excludedPoints: number[] = [];
  if (denomMatches) {
    for (const d of denomMatches) {
      const denomExpr = d.replace(/^\//, '').replace(/^\(|\)$/g, '');
      domainReasons.push(`Denominator restriction: ${denomExpr} ≠ 0`);
      // Find roots of denominator
      const linMatch = denomExpr.match(/^([+-]?\d*(?:\.\d+)?)?\*?x([+-]\d*(?:\.\d+)?)$/);
      if (linMatch) {
        const a = linMatch[1] ? (linMatch[1] === '-' ? -1 : parseFloat(linMatch[1])) : 1;
        const b = parseFloat(linMatch[2]);
        const root = -b / a;
        excludedPoints.push(root);
        verticalAsymptotes.push(`${variable} = ${root}`);
      } else if (denomExpr === variable) {
        excludedPoints.push(0);
        verticalAsymptotes.push(`${variable} = 0`);
      }
    }
  }

  // Check 2: Square roots sqrt(expr)
  const sqrtMatches = clean.match(/sqrt\(([^)]+)\)/g);
  let sqrtLowerBound: number | null = null;
  if (sqrtMatches) {
    for (const s of sqrtMatches) {
      const inner = s.replace(/^sqrt\(|\)$/g, '');
      domainReasons.push(`Radicand of even root must be non-negative: ${inner} ≥ 0`);
      const linMatch = inner.match(/^x([+-]\d*(?:\.\d+)?)$/);
      if (linMatch) {
        const b = parseFloat(linMatch[1]);
        sqrtLowerBound = -b;
      }
    }
  }

  // Check 3: Logarithms log(expr) or ln(expr)
  const logMatches = clean.match(/(?:log|ln)\(([^)]+)\)/g);
  if (logMatches) {
    for (const l of logMatches) {
      const inner = l.replace(/^(?:log|ln)\(|\)$/g, '');
      domainReasons.push(`Logarithmic argument must be strictly positive: ${inner} > 0`);
    }
  }

  if (excludedPoints.length > 0) {
    const uniq = Array.from(new Set(excludedPoints)).sort((a, b) => a - b);
    domainStr = `ℝ \\ { ${uniq.join(', ')} } [${variable} ≠ ${uniq.join(`, ${variable} ≠ `)}]`;
  } else if (sqrtLowerBound !== null) {
    domainStr = `[${sqrtLowerBound}, +∞)`;
  } else if (domainReasons.length === 0) {
    domainReasons.push('No denominators, even roots, or logarithms present; domain is unrestricted ℝ.');
  }

  // 2. Range Analysis
  let rangeStr = '(-∞, +∞)';
  if (clean.includes('^2') && !clean.includes('^3') && !clean.includes('/')) {
    // Parabola y = ax^2 + bx + c
    rangeStr = '[min, +∞) or (-∞, max] based on quadratic vertex';
    rangeReasons.push('Even polynomial power restricts range bounded by vertex extremum.');
  } else if (clean.match(/^1\/\(?([a-z0-9+-^.*]+)\)?$/)) {
    rangeStr = '(-∞, 0) ∪ (0, +∞) [y ≠ 0]';
    rangeReasons.push('Reciprocal fraction 1/g(x) approaches 0 as |x| → ∞ but never equals 0; horizontal asymptote at y = 0.');
    horizontalAsymptotes.push('y = 0');
  } else if (clean.includes('sin') || clean.includes('cos')) {
    rangeStr = '[-1, 1] for standard trigonometric oscillations';
    rangeReasons.push('Bounded trigonometric wave between amplitude extremes.');
  } else {
    rangeReasons.push('Analyzed via asymptotic limits as x → ±∞.');
  }

  // 3. Y-Intercept
  let yIntercept: string | undefined;
  try {
    const scope: Record<string, number> = {};
    scope[variable] = 0;
    const yVal = math.evaluate(clean, scope);
    if (typeof yVal === 'number' && !isNaN(yVal) && isFinite(yVal)) {
      yIntercept = `(0, ${cleanNum(yVal)})`;
      steps.push(`Evaluate f(0): y-intercept is at ${yIntercept}`);
    } else {
      yIntercept = 'Undefined (x = 0 is not in the domain)';
    }
  } catch {
    yIntercept = 'Undefined';
  }

  // 4. Roots / Zeros
  const roots: string[] = [];
  // Quick check for simple roots
  const linRoot = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?x([+-]\d*(?:\.\d+)?)$/);
  if (linRoot) {
    const a = linRoot[1] ? (linRoot[1] === '-' ? -1 : parseFloat(linRoot[1])) : 1;
    const b = parseFloat(linRoot[2]);
    roots.push(`${variable} = ${cleanNum(-b / a)}`);
  }

  // 5. Critical Points and Extrema via numerical scan & 2nd derivative
  const criticalPoints: { x: number; y: number; type: 'local_min' | 'local_max' | 'inflection' }[] = [];
  const intervalsIncrease: string[] = [];
  const intervalsDecrease: string[] = [];

  try {
    const compiledF = math.compile(clean);
    const compiledF1 = math.compile(f1);
    const compiledF2 = math.compile(f2);

    // Scan from -10 to +10 with step 0.25 to detect sign changes in f'(x)
    let prevSlope: number | null = null;
    let prevX: number | null = null;

    for (let x = -10; x <= 10; x += 0.25) {
      try {
        const s: Record<string, number> = {};
        s[variable] = x;
        const slope = compiledF1.evaluate(s);
        if (typeof slope === 'number' && !isNaN(slope) && isFinite(slope)) {
          if (prevSlope !== null && prevX !== null) {
            // Check sign change
            if ((prevSlope < 0 && slope > 0) || (prevSlope > 0 && slope < 0) || Math.abs(slope) < 0.05) {
              const critX = cleanNum(x);
              const sAtCrit: Record<string, number> = {};
              sAtCrit[variable] = critX;
              const yVal = compiledF.evaluate(sAtCrit);
              const curF2 = compiledF2.evaluate(sAtCrit);
              const type = curF2 > 0 ? 'local_min' : curF2 < 0 ? 'local_max' : 'inflection';
              
              if (!criticalPoints.some(cp => Math.abs(cp.x - critX) < 0.3)) {
                criticalPoints.push({ x: critX, y: cleanNum(yVal), type });
              }
            }
          }
          prevSlope = slope;
          prevX = x;
        }
      } catch {
        // Skip undefined points
      }
    }
  } catch {
    // Ignore numerical derivative scan errors
  }

  // 6. Symmetry: f(-x) vs f(x)
  let symmetry: 'Even: f(-x) = f(x)' | 'Odd: f(-x) = -f(x)' | 'Neither' = 'Neither';
  try {
    const comp = math.compile(clean);
    const testPoints = [1.5, 2.7, 3.14];
    let isEven = true;
    let isOdd = true;

    for (const tp of testPoints) {
      const sPos: Record<string, number> = {};
      sPos[variable] = tp;
      const sNeg: Record<string, number> = {};
      sNeg[variable] = -tp;
      const fPos = comp.evaluate(sPos);
      const fNeg = comp.evaluate(sNeg);

      if (Math.abs(fPos - fNeg) > 1e-6) isEven = false;
      if (Math.abs(fPos + fNeg) > 1e-6) isOdd = false;
    }

    if (isEven) symmetry = 'Even: f(-x) = f(x)';
    else if (isOdd) symmetry = 'Odd: f(-x) = -f(x)';
  } catch {
    symmetry = 'Neither';
  }

  return {
    expression: clean,
    variable,
    domain: domainStr,
    domainReasoning: domainReasons,
    range: rangeStr,
    rangeReasoning: rangeReasons,
    yIntercept,
    roots,
    criticalPoints,
    intervalsIncrease,
    intervalsDecrease,
    asymptotes: {
      vertical: verticalAsymptotes.length > 0 ? verticalAsymptotes : ['None detected'],
      horizontal: horizontalAsymptotes.length > 0 ? horizontalAsymptotes : ['None detected']
    },
    symmetry,
    firstDerivative: f1,
    secondDerivative: f2,
    steps
  };
}

/**
 * Combines two functions f(x) and g(x): f+g, f-g, f*g, f/g, f(g(x)), g(f(x))
 */
export function composeFunctions(
  fStr: string,
  gStr: string,
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'f_circ_g' | 'g_circ_f',
  variable: string = 'x'
): { expression: string; simplified: string; explanation: string } {
  let combined = '';
  let explanation = '';

  switch (operation) {
    case 'add':
      combined = `(${fStr}) + (${gStr})`;
      explanation = `(f + g)(${variable}) = f(${variable}) + g(${variable})`;
      break;
    case 'subtract':
      combined = `(${fStr}) - (${gStr})`;
      explanation = `(f - g)(${variable}) = f(${variable}) - g(${variable})`;
      break;
    case 'multiply':
      combined = `(${fStr}) * (${gStr})`;
      explanation = `(f · g)(${variable}) = f(${variable}) · g(${variable})`;
      break;
    case 'divide':
      combined = `(${fStr}) / (${gStr})`;
      explanation = `(f / g)(${variable}) = f(${variable}) / g(${variable}), provided g(${variable}) ≠ 0`;
      break;
    case 'f_circ_g':
      // Replace variable in fStr with (gStr)
      combined = fStr.replace(new RegExp(`\\b${variable}\\b`, 'g'), `(${gStr})`);
      explanation = `(f ∘ g)(${variable}) = f(g(${variable})): substitute g(${variable}) into all occurrences of ${variable} in f`;
      break;
    case 'g_circ_f':
      combined = gStr.replace(new RegExp(`\\b${variable}\\b`, 'g'), `(${fStr})`);
      explanation = `(g ∘ f)(${variable}) = g(f(${variable})): substitute f(${variable}) into all occurrences of ${variable} in g`;
      break;
  }

  let simplified = combined;
  try {
    simplified = math.simplify(combined).toString();
  } catch {
    simplified = combined;
  }

  return {
    expression: combined,
    simplified,
    explanation
  };
}

function cleanNum(n: number): number {
  return Math.round(n * 10000) / 10000;
}
