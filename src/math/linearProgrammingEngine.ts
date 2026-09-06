export interface LPConstraint {
  id: string;
  a: number;
  b: number;
  sign: '<=' | '>=' | '=';
  c: number;
  label?: string;
}

export interface LPVertex {
  x: number;
  y: number;
  zValue: number;
  isOptimal: boolean;
  activeConstraints: string[];
}

export interface LinearProgrammingResult {
  objective: 'maximize' | 'minimize';
  c1: number;
  c2: number;
  constraints: LPConstraint[];
  status: 'optimal' | 'infeasible' | 'unbounded';
  optimalValue?: number;
  optimalVertex?: { x: number; y: number };
  feasibleVertices: LPVertex[];
  polygonPoints: { x: number; y: number }[];
  steps: string[];
}

export function solve2DLinearProgramming(
  c1: number,
  c2: number,
  objective: 'maximize' | 'minimize',
  inputConstraints: LPConstraint[],
  enforceNonNegativity: boolean = true
): LinearProgrammingResult {
  const constraints = [...inputConstraints];
  if (enforceNonNegativity) {
    constraints.push({ id: 'nn_x', a: 1, b: 0, sign: '>=', c: 0, label: 'x ≥ 0' });
    constraints.push({ id: 'nn_y', a: 0, b: 1, sign: '>=', c: 0, label: 'y ≥ 0' });
  }

  const steps: string[] = [
    `Objective: ${objective.toUpperCase()} Z = ${c1}x + ${c2}y`,
    `Total Constraints: ${constraints.length}`
  ];

  // 1. Find all pairwise intersection points between boundary lines a1*x + b1*y = c1 and a2*x + b2*y = c2
  const candidatePoints: { x: number; y: number; cIds: string[] }[] = [];
  const numC = constraints.length;

  for (let i = 0; i < numC; i++) {
    for (let j = i + 1; j < numC; j++) {
      const cA = constraints[i];
      const cB = constraints[j];

      // 2x2 determinant
      const det = cA.a * cB.b - cA.b * cB.a;
      if (Math.abs(det) > 1e-9) {
        const x = (cA.c * cB.b - cA.b * cB.c) / det;
        const y = (cA.a * cB.c - cA.c * cB.a) / det;

        if (isFinite(x) && isFinite(y)) {
          candidatePoints.push({
            x: clean(x),
            y: clean(y),
            cIds: [cA.id, cB.id]
          });
        }
      }
    }
  }

  // 2. Filter candidate points to those satisfying ALL constraints within tolerance
  const tol = 1e-6;
  const feasible: { x: number; y: number; cIds: string[] }[] = [];

  for (const pt of candidatePoints) {
    let satisfiesAll = true;
    for (const c of constraints) {
      const val = c.a * pt.x + c.b * pt.y;
      if (c.sign === '<=' && val > c.c + tol) {
        satisfiesAll = false;
        break;
      }
      if (c.sign === '>=' && val < c.c - tol) {
        satisfiesAll = false;
        break;
      }
      if (c.sign === '=' && Math.abs(val - c.c) > tol) {
        satisfiesAll = false;
        break;
      }
    }

    if (satisfiesAll) {
      // Avoid duplicate points
      if (!feasible.some(f => Math.abs(f.x - pt.x) < 1e-4 && Math.abs(f.y - pt.y) < 1e-4)) {
        feasible.push(pt);
      }
    }
  }

  steps.push(
    `1. Calculated all line intersections: found ${candidatePoints.length} candidate intersection points.`,
    `2. Tested feasibility: ${feasible.length} corner points satisfy all constraints simultaneously.`
  );

  if (feasible.length === 0) {
    return {
      objective,
      c1,
      c2,
      constraints,
      status: 'infeasible',
      feasibleVertices: [],
      polygonPoints: [],
      steps: [...steps, 'Constraint set is inconsistent. Feasible region is EMPTY (Infeasible problem).']
    };
  }

  // 3. Evaluate objective function Z at all feasible vertices
  const verticesWithZ: LPVertex[] = feasible.map(f => {
    const z = clean(c1 * f.x + c2 * f.y);
    return {
      x: f.x,
      y: f.y,
      zValue: z,
      isOptimal: false,
      activeConstraints: f.cIds
    };
  });

  // Find optimal
  let bestIdx = 0;
  for (let i = 1; i < verticesWithZ.length; i++) {
    if (objective === 'maximize') {
      if (verticesWithZ[i].zValue > verticesWithZ[bestIdx].zValue) bestIdx = i;
    } else {
      if (verticesWithZ[i].zValue < verticesWithZ[bestIdx].zValue) bestIdx = i;
    }
  }

  verticesWithZ[bestIdx].isOptimal = true;
  const optVal = verticesWithZ[bestIdx].zValue;
  const optVertex = { x: verticesWithZ[bestIdx].x, y: verticesWithZ[bestIdx].y };

  steps.push(
    `3. Evaluated objective function Z = ${c1}x + ${c2}y at each corner point:`,
    ...verticesWithZ.map(v => `   Point (${v.x}, ${v.y}) ⇒ Z = ${v.zValue}${v.isOptimal ? ' ★ [OPTIMAL]' : ''}`),
    `4. Optimal solution located at (${optVertex.x}, ${optVertex.y}) with ${objective.toUpperCase()} value Z* = ${optVal}`
  );

  // 4. Sort feasible vertices in counter-clockwise angular order to form convex polygon
  const centroidX = feasible.reduce((acc, p) => acc + p.x, 0) / feasible.length;
  const centroidY = feasible.reduce((acc, p) => acc + p.y, 0) / feasible.length;

  const polygonPoints = [...feasible]
    .map(p => ({ x: p.x, y: p.y }))
    .sort((a, b) => {
      const angleA = Math.atan2(a.y - centroidY, a.x - centroidX);
      const angleB = Math.atan2(b.y - centroidY, b.x - centroidX);
      return angleA - angleB;
    });

  return {
    objective,
    c1,
    c2,
    constraints,
    status: 'optimal',
    optimalValue: optVal,
    optimalVertex: optVertex,
    feasibleVertices: verticesWithZ,
    polygonPoints,
    steps
  };
}

function clean(n: number): number {
  return Math.round(n * 10000) / 10000;
}
