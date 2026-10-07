import * as math from 'mathjs';

/**
 * Checks if a string already contains LaTeX markup
 */
export function isLatex(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return (
    str.includes('\\frac') ||
    str.includes('\\mathcal') ||
    str.includes('\\int') ||
    str.includes('\\sum') ||
    str.includes('\\begin{') ||
    str.includes('\\left') ||
    str.includes('\\right') ||
    str.includes('\\sqrt') ||
    str.includes('\\cdot') ||
    str.includes('\\times') ||
    str.includes('\\lim') ||
    str.includes('\\partial') ||
    str.includes('\\operatorname') ||
    /^\s*\\[a-zA-Z]+/.test(str)
  );
}

/**
 * Cleans up unnecessary LaTeX artifacts from mathjs toTex or raw transformations
 */
export function cleanLatex(tex: string): string {
  if (!tex) return '';

  return (
    tex
      // Remove mathjs \mathrm wrapping around single variables like \mathrm{x} -> x
      .replace(/\\mathrm\{([a-zA-Z])\}/g, '$1')
      // Clean up subscript variables: C1 -> C_1, x1 -> x_1
      .replace(/\b([a-zA-Z])(\d+)\b/g, '$1_{$2}')
      // Convert exp(...) to e^{...}
      .replace(/\\exp\\left\((.*?)\\right\)/g, 'e^{$1}')
      .replace(/\\exp\((.*?)\)/g, 'e^{$1}')
      .replace(/\bexp\((.*?)\)/g, 'e^{$1}')
      // Convert \cdot between numbers and variables: 3 \cdot x -> 3x
      .replace(/(\d+)\s*\\cdot\s*([a-zA-Z])/g, '$1$2')
      .replace(/(\d+)\s*\\cdot\s*\\/g, '$1\\')
      // Remove double parentheses in denominators \left(\left(s-3\right)\right) -> (s-3)
      .replace(/\\left\(\\left\((.*?)\\right\)\\right\)/g, '($1)')
      // Simplify simple denominator single grouping \frac{1}{\left(s^2+4\right)} -> \frac{1}{s^2+4}
      .replace(/\\frac\{([^{}]+)\}\{\\left\(([^{}]+)\\right\)\}/g, '\\frac{$1}{$2}')
      // Ensure proper multiplication spacing
      .replace(/\\cdot/g, ' \\cdot ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Creates a LaTeX fraction \frac{numerator}{denominator}
 */
export function fractionToLatex(numerator: string | number, denominator: string | number): string {
  const numTex = typeof numerator === 'number' ? String(numerator) : expressionToLatex(numerator);
  const denTex = typeof denominator === 'number' ? String(denominator) : expressionToLatex(denominator);
  return `\\frac{${numTex}}{${denTex}}`;
}

/**
 * Creates a LaTeX power base^{exponent}
 */
export function powerToLatex(base: string, exponent: string | number): string {
  const baseTex = expressionToLatex(base);
  const expTex = String(exponent);
  if (/^[a-zA-Z0-9]$/.test(baseTex)) {
    return `${baseTex}^{${expTex}}`;
  }
  return `\\left(${baseTex}\\right)^{${expTex}}`;
}

/**
 * Converts a 2D matrix into a LaTeX bmatrix
 */
export function matrixToLatex(matrix: (string | number)[][]): string {
  if (!matrix || matrix.length === 0) return '\\begin{bmatrix}\\end{bmatrix}';
  const rows = matrix.map(row =>
    row.map(cell => (cell !== undefined && cell !== null ? String(cell) : '0')).join(' & ')
  );
  return `\\begin{bmatrix}\n${rows.join(' \\\\\n')}\n\\end{bmatrix}`;
}

/**
 * Formats a derivative in LaTeX: \frac{d^n}{dx^n}\left[ expr \right]
 */
export function derivativeToLatex(expr: string, variable: string = 'x', order: number = 1): string {
  const innerTex = expressionToLatex(expr);
  if (order === 1) {
    return `\\frac{d}{d${variable}}\\left[ ${innerTex} \\right]`;
  }
  return `\\frac{d^{${order}}}{d${variable}^{${order}}}\\left[ ${innerTex} \\right]`;
}

/**
 * Formats an integral in LaTeX: \int_{lower}^{upper} expr \, dx or indefinite \int expr \, dx
 */
export function integralToLatex(
  integrand: string,
  variable: string = 'x',
  lower?: string | number,
  upper?: string | number
): string {
  const exprTex = expressionToLatex(integrand);
  if (lower !== undefined && upper !== undefined) {
    return `\\int_{${lower}}^{${upper}} ${exprTex}\\,d${variable}`;
  }
  return `\\int ${exprTex}\\,d${variable}`;
}

/**
 * Formats a Laplace transform expression into textbook LaTeX: \mathcal{L}\{ f(t) \}
 */
export function laplaceToLatex(expr: string): string {
  if (!expr) return '';
  const trimmed = expr.trim();

  // If already contains \mathcal{L}
  if (trimmed.includes('\\mathcal{L}')) return trimmed;

  // Pattern: L{ f(t) } or L{f(t)}
  const lMatch = trimmed.match(/^L\s*\{\s*(.*?)\s*\}$/);
  if (lMatch) {
    const inner = expressionToLatex(lMatch[1]);
    return `\\mathcal{L}\\left\\{ ${inner} \\right\\}`;
  }

  return expressionToLatex(trimmed);
}

/**
 * Formats an Inverse Laplace transform expression: \mathcal{L}^{-1}\{ F(s) \}
 */
export function inverseLaplaceToLatex(expr: string): string {
  if (!expr) return '';
  const trimmed = expr.trim();

  if (trimmed.includes('\\mathcal{L}^{-1}')) return trimmed;

  const invMatch = trimmed.match(/^L[\^⁻]?-?1\s*\{\s*(.*?)\s*\}$/);
  if (invMatch) {
    const inner = expressionToLatex(invMatch[1]);
    return `\\mathcal{L}^{-1}\\left\\{ ${inner} \\right\\}`;
  }

  return expressionToLatex(trimmed);
}

/**
 * Formats an equation or relation by converting LHS and RHS
 */
export function equationToLatex(equation: string): string {
  if (!equation) return '';

  // Handle common operators
  const operators = [
    { raw: ' = ', tex: ' = ' },
    { raw: ' ≈ ', tex: ' \\approx ' },
    { raw: ' ≤ ', tex: ' \\le ' },
    { raw: ' <= ', tex: ' \\le ' },
    { raw: ' ≥ ', tex: ' \\ge ' },
    { raw: ' >= ', tex: ' \\ge ' },
    { raw: ' ≠ ', tex: ' \\neq ' },
    { raw: ' != ', tex: ' \\neq ' },
    { raw: ' -> ', tex: ' \\to ' },
    { raw: ' → ', tex: ' \\to ' },
    { raw: ' ⇒ ', tex: ' \\implies ' },
    { raw: ' => ', tex: ' \\implies ' }
  ];

  for (const op of operators) {
    if (equation.includes(op.raw)) {
      const parts = equation.split(op.raw);
      return parts.map(p => expressionToLatex(p.trim())).join(op.tex);
    }
  }

  return expressionToLatex(equation);
}

/**
 * Central robust converter: transforms any math expression, calculation result, or formula into clean LaTeX
 */
export function expressionToLatex(expr: string | number): string {
  if (typeof expr === 'number') return String(expr);
  if (!expr) return '';

  const raw = String(expr).trim();
  if (isLatex(raw)) {
    return cleanLatex(raw);
  }

  // Check if it is an equation or multi-part expression with '='
  if (
    raw.includes(' = ') ||
    raw.includes(' ≈ ') ||
    raw.includes(' ≤ ') ||
    raw.includes(' <= ') ||
    raw.includes(' ≥ ') ||
    raw.includes(' >= ') ||
    raw.includes(' ≠ ') ||
    raw.includes(' != ') ||
    raw.includes(' -> ') ||
    raw.includes(' → ') ||
    raw.includes(' ⇒ ')
  ) {
    return equationToLatex(raw);
  }

  // Check for derivative notation e.g. d/dx [ f(x) ] or d^2/dx^2 [ f(x) ]
  const derivMatch = raw.match(/^d(?:\^(\d+))?\/d([a-zA-Z])(?:\^\d+)?\s*\[\s*(.*?)\s*\]$/);
  if (derivMatch) {
    const order = derivMatch[1] ? parseInt(derivMatch[1], 10) : 1;
    const variable = derivMatch[2] || 'x';
    const inner = derivMatch[3];
    return derivativeToLatex(inner, variable, order);
  }

  // Check for Laplace syntax L{...} or L^-1{...}
  if (/^L\s*\{/.test(raw)) {
    return laplaceToLatex(raw);
  }
  if (/^L[\^⁻]?-?1\s*\{/.test(raw)) {
    return inverseLaplaceToLatex(raw);
  }

  // Check for integral syntax ∫ ... dx or int ... dx
  const intDefMatch = raw.match(/^(?:∫|int)\s*\[\s*(.*?)\s*,\s*(.*?)\s*\]\s*(.*?)\s*d([a-zA-Z])$/);
  if (intDefMatch) {
    return integralToLatex(intDefMatch[3], intDefMatch[4], intDefMatch[1], intDefMatch[2]);
  }
  const intIndefMatch = raw.match(/^(?:∫|int)\s*(.*?)\s*d([a-zA-Z])$/);
  if (intIndefMatch) {
    return integralToLatex(intIndefMatch[1], intIndefMatch[2]);
  }

  // Check for common named functions like F(s) = ..., f(t) = ..., y(x) = ...
  const funcAssignMatch = raw.match(/^([a-zA-Z]+)\(([a-zA-Z]+)\)\s*=\s*(.*)$/);
  if (funcAssignMatch) {
    const fnName = funcAssignMatch[1];
    const arg = funcAssignMatch[2];
    const rhs = expressionToLatex(funcAssignMatch[3]);
    return `${fnName}(${arg}) = ${rhs}`;
  }

  // Check for simple single fractions like a/b or (expr1)/(expr2)
  const singleFracMatch = raw.match(/^\(?([^\/()]+|\([^()]+\))\)?\s*\/\s*\(?([^\/()]+|\([^()]+\))\)?$/);
  if (singleFracMatch) {
    const num = singleFracMatch[1].replace(/^\((.*)\)$/, '$1');
    const den = singleFracMatch[2].replace(/^\((.*)\)$/, '$1');
    return `\\frac{${expressionToLatex(num)}}{${expressionToLatex(den)}}`;
  }

  // Attempt mathjs AST parse & toTex conversion
  try {
    // Normalize unicode symbols before passing to mathjs
    let preprocessed = raw
      .replace(/·/g, '*')
      .replace(/×/g, '*')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/ⁿ/g, '^n');

    // Replace exponential e^(...) or e^(-...)
    preprocessed = preprocessed.replace(/\be\^(\([^)]+\)|[a-zA-Z0-9]+)/g, 'exp($1)');

    const node = math.parse(preprocessed);
    const tex = node.toTex({ parenthesis: 'keep' });
    return cleanLatex(tex);
  } catch {
    // Fallback: heuristic safe LaTeX conversion
    return fallbackToLatex(raw);
  }
}

/**
 * Fallback tokenizer and converter for expressions that mathjs parser doesn't accept
 */
function fallbackToLatex(str: string): string {
  let res = str;

  // Replace unicode superscripts
  res = res
    .replace(/²/g, '^{2}')
    .replace(/³/g, '^{3}')
    .replace(/⁴/g, '^{4}')
    .replace(/ⁿ/g, '^{n}')
    .replace(/\^([0-9a-zA-Z]+)/g, '^{$1}')
    .replace(/\^(\([^\)]+\))/g, '^{$1}');

  // Replace Greek letters
  res = res
    .replace(/\bpi\b/gi, '\\pi')
    .replace(/\btheta\b/gi, '\\theta')
    .replace(/\balpha\b/gi, '\\alpha')
    .replace(/\bbeta\b/gi, '\\beta')
    .replace(/\bgamma\b/gi, '\\gamma')
    .replace(/\bdelta\b/gi, '\\delta')
    .replace(/\blambda\b/gi, '\\lambda')
    .replace(/\bomega\b/gi, '\\omega')
    .replace(/\binf\b/gi, '\\infty')
    .replace(/\bInfinity\b/g, '\\infty');

  // Replace trigonometric and standard functions
  res = res
    .replace(/\bsin\b/g, '\\sin')
    .replace(/\bcos\b/g, '\\cos')
    .replace(/\btan\b/g, '\\tan')
    .replace(/\bsinh\b/g, '\\sinh')
    .replace(/\bcosh\b/g, '\\cosh')
    .replace(/\btanh\b/g, '\\tanh')
    .replace(/\bln\b/g, '\\ln')
    .replace(/\blog\b/g, '\\log')
    .replace(/\bsqrt\((.*?)\)/g, '\\sqrt{$1}')
    .replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');

  // Replace exponential notation
  res = res
    .replace(/e\^\((.*?)\)/g, 'e^{$1}')
    .replace(/exp\((.*?)\)/g, 'e^{$1}')
    .replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}');

  // Multiplication symbol
  res = res.replace(/\s*\*\s*/g, ' \\cdot ').replace(/\s*·\s*/g, ' \\cdot ');

  // Plus minus
  res = res.replace(/±/g, '\\pm ');

  return res.trim();
}
