export interface RelationAnalysis {
  domain: string[];
  range: string[];
  isReflexive: boolean;
  reflexiveCounterexample?: string;
  isIrreflexive: boolean;
  irreflexiveCounterexample?: string;
  isSymmetric: boolean;
  symmetricCounterexample?: string;
  isAntisymmetric: boolean;
  antisymmetricCounterexample?: string;
  isAsymmetric: boolean;
  asymmetricCounterexample?: string;
  isTransitive: boolean;
  transitiveCounterexample?: string;
  isEquivalence: boolean;
  isPartialOrder: boolean;
  steps: string[];
}

export interface SetOperationsResult {
  union: string[];
  intersection: string[];
  differenceAB: string[];
  differenceBA: string[];
  symmetricDifference: string[];
  cartesianProduct: [string, string][];
  powerSetA: string[][];
  steps: string[];
}

export interface TruthTableRow {
  assignment: Record<string, boolean>;
  result: boolean;
}

export interface TruthTableResult {
  variables: string[];
  expression: string;
  rows: TruthTableRow[];
  classification: 'Tautology (Always True)' | 'Contradiction (Always False)' | 'Contingency (Satisfiable)';
  steps: string[];
}

/**
 * Analyzes binary relations on a set A with formal counterexamples for mathematical rigor
 */
export function analyzeRelation(setA: string[], pairs: [string, string][]): RelationAnalysis {
  const pairSet = new Set(pairs.map(([a, b]) => `${a},${b}`));
  const domSet = new Set<string>();
  const rngSet = new Set<string>();
  for (const [a, b] of pairs) {
    domSet.add(a);
    rngSet.add(b);
  }

  const domain = Array.from(domSet);
  const range = Array.from(rngSet);
  const steps: string[] = [
    `Base Set A = { ${setA.join(', ')} }`,
    `Relation R = { ${pairs.map(([a, b]) => `(${a}, ${b})`).join(', ')} }`,
    `Domain(R) = { ${domain.join(', ')} }`,
    `Range(R) = { ${range.join(', ')} }`
  ];

  // 1. Reflexive: ∀ a ∈ A, (a, a) ∈ R
  let isReflexive = true;
  let reflexiveCounterexample: string | undefined;
  for (const a of setA) {
    if (!pairSet.has(`${a},${a}`)) {
      isReflexive = false;
      reflexiveCounterexample = `Element ${a} ∈ A, but (${a}, ${a}) ∉ R`;
      break;
    }
  }

  // 2. Irreflexive: ∀ a ∈ A, (a, a) ∉ R
  let isIrreflexive = true;
  let irreflexiveCounterexample: string | undefined;
  for (const a of setA) {
    if (pairSet.has(`${a},${a}`)) {
      isIrreflexive = false;
      irreflexiveCounterexample = `Self-loop found: (${a}, ${a}) ∈ R`;
      break;
    }
  }

  // 3. Symmetric: ∀ (a, b) ∈ R ⇒ (b, a) ∈ R
  let isSymmetric = true;
  let symmetricCounterexample: string | undefined;
  for (const [a, b] of pairs) {
    if (!pairSet.has(`${b},${a}`)) {
      isSymmetric = false;
      symmetricCounterexample = `(${a}, ${b}) ∈ R, but reciprocal (${b}, ${a}) ∉ R`;
      break;
    }
  }

  // 4. Antisymmetric: ∀ (a, b), (b, a) ∈ R ⇒ a = b
  let isAntisymmetric = true;
  let antisymmetricCounterexample: string | undefined;
  for (const [a, b] of pairs) {
    if (a !== b && pairSet.has(`${b},${a}`)) {
      isAntisymmetric = false;
      antisymmetricCounterexample = `(${a}, ${b}) and (${b}, ${a}) both ∈ R, but ${a} ≠ ${b}`;
      break;
    }
  }

  // 5. Asymmetric: (a, b) ∈ R ⇒ (b, a) ∉ R and irreflexive
  const isAsymmetric = isIrreflexive && isAntisymmetric;
  const asymmetricCounterexample = !isIrreflexive
    ? irreflexiveCounterexample
    : !isAntisymmetric
    ? antisymmetricCounterexample
    : undefined;

  // 6. Transitive: ∀ (a, b), (b, c) ∈ R ⇒ (a, c) ∈ R
  let isTransitive = true;
  let transitiveCounterexample: string | undefined;
  for (const [a, b] of pairs) {
    for (const [b2, c] of pairs) {
      if (b === b2) {
        if (!pairSet.has(`${a},${c}`)) {
          isTransitive = false;
          transitiveCounterexample = `(${a}, ${b}) and (${b}, ${c}) ∈ R, but transitive link (${a}, ${c}) ∉ R`;
          break;
        }
      }
    }
    if (!isTransitive) break;
  }

  const isEquivalence = isReflexive && isSymmetric && isTransitive;
  const isPartialOrder = isReflexive && isAntisymmetric && isTransitive;

  steps.push(
    `Reflexive: ${isReflexive ? 'YES' : `NO (${reflexiveCounterexample})`}`,
    `Symmetric: ${isSymmetric ? 'YES' : `NO (${symmetricCounterexample})`}`,
    `Antisymmetric: ${isAntisymmetric ? 'YES' : `NO (${antisymmetricCounterexample})`}`,
    `Transitive: ${isTransitive ? 'YES' : `NO (${transitiveCounterexample})`}`,
    `Equivalence Relation: ${isEquivalence ? 'YES (Reflexive + Symmetric + Transitive)' : 'NO'}`,
    `Partial Order: ${isPartialOrder ? 'YES (Reflexive + Antisymmetric + Transitive)' : 'NO'}`
  );

  return {
    domain,
    range,
    isReflexive,
    reflexiveCounterexample,
    isIrreflexive,
    irreflexiveCounterexample,
    isSymmetric,
    symmetricCounterexample,
    isAntisymmetric,
    antisymmetricCounterexample,
    isAsymmetric,
    asymmetricCounterexample,
    isTransitive,
    transitiveCounterexample,
    isEquivalence,
    isPartialOrder,
    steps
  };
}

/**
 * Computes set operations: Union, Intersection, Difference, Symmetric Difference, Cartesian Product, Power Set
 */
export function computeSetOperations(setA: string[], setB: string[]): SetOperationsResult {
  const sa = new Set(setA);
  const sb = new Set(setB);

  const union = Array.from(new Set([...setA, ...setB]));
  const intersection = setA.filter(x => sb.has(x));
  const diffAB = setA.filter(x => !sb.has(x));
  const diffBA = setB.filter(x => !sa.has(x));
  const symDiff = Array.from(new Set([...diffAB, ...diffBA]));

  const cartesian: [string, string][] = [];
  for (const a of setA) {
    for (const b of setB) {
      cartesian.push([a, b]);
    }
  }

  // Power set for set A (limited to 10 elements to prevent memory exhaustion)
  const powerSetA: string[][] = [[]];
  const cappedA = setA.slice(0, 8);
  for (const elem of cappedA) {
    const len = powerSetA.length;
    for (let i = 0; i < len; i++) {
      powerSetA.push([...powerSetA[i], elem]);
    }
  }

  const steps = [
    `Set A = { ${setA.join(', ')} } (|A| = ${setA.length})`,
    `Set B = { ${setB.join(', ')} } (|B| = ${setB.length})`,
    `A ∪ B = { ${union.join(', ')} }`,
    `A ∩ B = { ${intersection.join(', ')} }`,
    `A \\ B = { ${diffAB.join(', ')} }`,
    `A △ B = (A \\ B) ∪ (B \\ A) = { ${symDiff.join(', ')} }`,
    `|A × B| = ${cartesian.length} pairs`,
    `|𝒫(A)| = 2^|A| = 2^${setA.length} = ${Math.pow(2, setA.length)} subsets`
  ];

  return {
    union,
    intersection,
    differenceAB: diffAB,
    differenceBA: diffBA,
    symmetricDifference: symDiff,
    cartesianProduct: cartesian,
    powerSetA,
    steps
  };
}

/**
 * Generates full truth table and classifies propositions
 * Supports: p, q, r, and, or, not, xor, -> (implies), <-> (iff)
 */
export function generateTruthTable(exprInput: string): TruthTableResult {
  const clean = exprInput.trim();
  if (!clean) throw new Error('Logical expression cannot be empty.');

  // Detect propositional variables (single letters p, q, r, s, etc.)
  const varMatches = clean.match(/\b[p-zP-Z]\b/g);
  const variables = Array.from(new Set(varMatches || ['p'])).sort();

  const numRows = Math.pow(2, variables.length);
  const rows: TruthTableRow[] = [];
  let trueCount = 0;

  for (let i = 0; i < numRows; i++) {
    const assignment: Record<string, boolean> = {};
    for (let j = 0; j < variables.length; j++) {
      // Bit shift to determine T/F
      const bit = (i >> (variables.length - 1 - j)) & 1;
      assignment[variables[j]] = bit === 0; // standard convention: 0 is true first
    }

    const val = evaluateLogicalExpr(clean, assignment);
    if (val) trueCount++;
    rows.push({ assignment, result: val });
  }

  let classification: 'Tautology (Always True)' | 'Contradiction (Always False)' | 'Contingency (Satisfiable)';
  if (trueCount === numRows) classification = 'Tautology (Always True)';
  else if (trueCount === 0) classification = 'Contradiction (Always False)';
  else classification = 'Contingency (Satisfiable)';

  const steps = [
    `Expression: ${clean}`,
    `Identified propositional variables: [${variables.join(', ')}]`,
    `Evaluated 2^${variables.length} = ${numRows} truth assignments`,
    `Result distribution: ${trueCount} TRUE, ${numRows - trueCount} FALSE`,
    `Classification: ${classification}`
  ];

  return {
    variables,
    expression: clean,
    rows,
    classification,
    steps
  };
}

function evaluateLogicalExpr(expr: string, scope: Record<string, boolean>): boolean {
  // Translate standard logical tokens to JS operators
  let jsExpr = expr
    .replace(/<->|iff/gi, '===')
    .replace(/->|implies/gi, '<=') // p -> q is equivalent to (!p || q) which in bool comparison is p <= q
    .replace(/\bxor\b/gi, '!==')
    .replace(/\band\b|∧|&/gi, '&&')
    .replace(/\bor\b|∨|\|/gi, '||')
    .replace(/\bnot\b|¬|~/gi, '!');

  for (const [k, v] of Object.entries(scope)) {
    jsExpr = jsExpr.replace(new RegExp(`\\b${k}\\b`, 'g'), `${v}`);
  }

  try {
    // eslint-disable-next-line no-new-func
    return Boolean(new Function(`return (${jsExpr});`)());
  } catch {
    return false;
  }
}

export interface CombinatoricsResult {
  n: number;
  r: number;
  permutations_nPr: number;
  combinations_nCr: number;
  permutationsWithRepetition: number;
  combinationsWithRepetition: number;
  subsets2n: number;
  factorialN: number;
  steps: string[];
}

function fact(num: number): number {
  if (num <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= num; i++) res *= i;
  return res;
}

export function calculateCombinatorics(n: number, r: number): CombinatoricsResult {
  if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r)) {
    throw new Error('Values for n and r must be non-negative integers.');
  }
  if (r > n) {
    throw new Error('Selection size r cannot exceed total items n for standard nPr and nCr.');
  }

  const factN = fact(n);
  const factR = fact(r);
  const factNminusR = fact(n - r);

  const nPr = factN / factNminusR;
  const nCr = factN / (factR * factNminusR);
  const permRep = Math.pow(n, r);
  const combRep = fact(n + r - 1) / (factR * fact(n - 1));
  const subsets = Math.pow(2, n);

  const steps = [
    `Total elements n = ${n}, chosen items r = ${r}`,
    `Factorial: n! = ${n}! = ${factN}`,
    `Permutations (order matters): nPr = n! / (n - r)! = ${factN} / ${factNminusR} = ${nPr}`,
    `Combinations (order does NOT matter): nCr = n! / (r! · (n - r)!) = ${factN} / (${factR} · ${factNminusR}) = ${nCr}`,
    `Permutations with repetition allowed: nʳ = ${n}^${r} = ${permRep}`,
    `Combinations with repetition (stars & bars): (n + r - 1)! / (r! · (n - 1)!) = ${combRep}`,
    `Total possible subsets of set with n items (Power Set size): 2ⁿ = 2^${n} = ${subsets}`
  ];

  return {
    n,
    r,
    permutations_nPr: nPr,
    combinations_nCr: nCr,
    permutationsWithRepetition: permRep,
    combinationsWithRepetition: combRep,
    subsets2n: subsets,
    factorialN: factN,
    steps
  };
}
