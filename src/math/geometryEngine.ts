export interface ShapeProperty {
  label: string;
  value: number | string;
  unit: string;
  formula: string;
}

export interface GeometryCalculation {
  shape: string;
  is3D: boolean;
  properties: ShapeProperty[];
  steps: string[];
}

export function calculateTriangle(a: number, b: number, c: number): GeometryCalculation {
  if (a <= 0 || b <= 0 || c <= 0) throw new Error('All sides must be positive.');
  if (a + b <= c || a + c <= b || b + c <= a) {
    throw new Error('Triangle Inequality violated: The sum of any two sides must exceed the third side.');
  }

  const perimeter = a + b + c;
  const s = perimeter / 2;
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

  // Law of cosines for angles in degrees
  const angleA = (Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180) / Math.PI;
  const angleB = (Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180) / Math.PI;
  const angleC = 180 - angleA - angleB;

  const ha = (2 * area) / a;
  const inradius = area / s;
  const circumradius = (a * b * c) / (4 * area);

  return {
    shape: 'Triangle',
    is3D: false,
    properties: [
      { label: 'Area', value: clean(area), unit: 'sq units', formula: 'Heron: √[s(s-a)(s-b)(s-c)]' },
      { label: 'Perimeter', value: clean(perimeter), unit: 'units', formula: 'a + b + c' },
      { label: 'Semi-perimeter (s)', value: clean(s), unit: 'units', formula: '(a + b + c) / 2' },
      { label: 'Angle A (opposite a)', value: clean(angleA), unit: '°', formula: 'cos⁻¹((b²+c²-a²)/2bc)' },
      { label: 'Angle B (opposite b)', value: clean(angleB), unit: '°', formula: 'cos⁻¹((a²+c²-b²)/2ac)' },
      { label: 'Angle C (opposite c)', value: clean(angleC), unit: '°', formula: '180° - A - B' },
      { label: 'Height (hₐ)', value: clean(ha), unit: 'units', formula: '2·Area / a' },
      { label: 'Inradius (r)', value: clean(inradius), unit: 'units', formula: 'Area / s' },
      { label: 'Circumradius (R)', value: clean(circumradius), unit: 'units', formula: 'abc / (4·Area)' }
    ],
    steps: [
      `1. Compute semi-perimeter: s = (${a} + ${b} + ${c}) / 2 = ${clean(s)}`,
      `2. Apply Heron's formula: Area = √[${clean(s)} · (${clean(s)}-${a}) · (${clean(s)}-${b}) · (${clean(s)}-${c})] = ${clean(area)}`,
      `3. Compute interior angles using Law of Cosines: A = ${clean(angleA)}°, B = ${clean(angleB)}°, C = ${clean(angleC)}°`
    ]
  };
}

export function calculateCircle(radius: number): GeometryCalculation {
  if (radius <= 0) throw new Error('Radius must be positive.');
  const diameter = 2 * radius;
  const area = Math.PI * radius * radius;
  const circumference = 2 * Math.PI * radius;

  return {
    shape: 'Circle',
    is3D: false,
    properties: [
      { label: 'Radius (r)', value: clean(radius), unit: 'units', formula: 'Given r' },
      { label: 'Diameter (d)', value: clean(diameter), unit: 'units', formula: '2·r' },
      { label: 'Area', value: clean(area), unit: 'sq units', formula: 'π·r²' },
      { label: 'Circumference', value: clean(circumference), unit: 'units', formula: '2·π·r' }
    ],
    steps: [
      `Diameter: d = 2 · ${radius} = ${clean(diameter)}`,
      `Area: A = π · (${radius})² = π · ${radius * radius} ≈ ${clean(area)}`,
      `Circumference: C = 2 · π · ${radius} ≈ ${clean(circumference)}`
    ]
  };
}

export function calculateRectangle(width: number, height: number): GeometryCalculation {
  if (width <= 0 || height <= 0) throw new Error('Dimensions must be positive.');
  const area = width * height;
  const perimeter = 2 * (width + height);
  const diagonal = Math.sqrt(width * width + height * height);

  return {
    shape: 'Rectangle',
    is3D: false,
    properties: [
      { label: 'Area', value: clean(area), unit: 'sq units', formula: 'w · h' },
      { label: 'Perimeter', value: clean(perimeter), unit: 'units', formula: '2·(w + h)' },
      { label: 'Diagonal', value: clean(diagonal), unit: 'units', formula: '√(w² + h²)' }
    ],
    steps: [
      `Area: A = ${width} × ${height} = ${clean(area)}`,
      `Perimeter: P = 2 · (${width} + ${height}) = ${clean(perimeter)}`,
      `Diagonal: d = √(${width}² + ${height}²) = √(${width * width + height * height}) ≈ ${clean(diagonal)}`
    ]
  };
}

export function calculateSphere(radius: number): GeometryCalculation {
  if (radius <= 0) throw new Error('Radius must be positive.');
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const surfaceArea = 4 * Math.PI * radius * radius;

  return {
    shape: 'Sphere',
    is3D: true,
    properties: [
      { label: 'Volume (V)', value: clean(volume), unit: 'cubic units', formula: '(4/3)·π·r³' },
      { label: 'Surface Area (A)', value: clean(surfaceArea), unit: 'sq units', formula: '4·π·r²' },
      { label: 'Diameter', value: clean(2 * radius), unit: 'units', formula: '2·r' }
    ],
    steps: [
      `Volume: V = (4/3)·π·(${radius})³ = (4/3)·π·${Math.pow(radius, 3)} ≈ ${clean(volume)}`,
      `Surface Area: A = 4·π·(${radius})² = 4·π·${radius * radius} ≈ ${clean(surfaceArea)}`
    ]
  };
}

export function calculateCylinder(radius: number, height: number): GeometryCalculation {
  if (radius <= 0 || height <= 0) throw new Error('Radius and height must be positive.');
  const baseArea = Math.PI * radius * radius;
  const lateralArea = 2 * Math.PI * radius * height;
  const totalArea = 2 * baseArea + lateralArea;
  const volume = baseArea * height;

  return {
    shape: 'Cylinder',
    is3D: true,
    properties: [
      { label: 'Volume (V)', value: clean(volume), unit: 'cubic units', formula: 'π·r²·h' },
      { label: 'Total Surface Area', value: clean(totalArea), unit: 'sq units', formula: '2·π·r·(r + h)' },
      { label: 'Lateral Area', value: clean(lateralArea), unit: 'sq units', formula: '2·π·r·h' },
      { label: 'Base Area', value: clean(baseArea), unit: 'sq units', formula: 'π·r²' }
    ],
    steps: [
      `Base Area: A_base = π · (${radius})² ≈ ${clean(baseArea)}`,
      `Lateral Area: A_lat = 2 · π · ${radius} · ${height} ≈ ${clean(lateralArea)}`,
      `Total Area: A_total = 2·A_base + A_lat ≈ ${clean(totalArea)}`,
      `Volume: V = A_base · h = ${clean(baseArea)} · ${height} ≈ ${clean(volume)}`
    ]
  };
}

export function calculateCone(radius: number, height: number): GeometryCalculation {
  if (radius <= 0 || height <= 0) throw new Error('Radius and height must be positive.');
  const slantHeight = Math.sqrt(radius * radius + height * height);
  const baseArea = Math.PI * radius * radius;
  const lateralArea = Math.PI * radius * slantHeight;
  const totalArea = baseArea + lateralArea;
  const volume = (1 / 3) * baseArea * height;

  return {
    shape: 'Cone',
    is3D: true,
    properties: [
      { label: 'Volume (V)', value: clean(volume), unit: 'cubic units', formula: '(1/3)·π·r²·h' },
      { label: 'Slant Height (l)', value: clean(slantHeight), unit: 'units', formula: '√(r² + h²)' },
      { label: 'Total Surface Area', value: clean(totalArea), unit: 'sq units', formula: 'π·r·(r + l)' },
      { label: 'Lateral Area', value: clean(lateralArea), unit: 'sq units', formula: 'π·r·l' }
    ],
    steps: [
      `Slant Height: l = √(${radius}² + ${height}²) = √(${radius * radius + height * height}) ≈ ${clean(slantHeight)}`,
      `Volume: V = (1/3) · π · ${radius}² · ${height} ≈ ${clean(volume)}`,
      `Total Area: A = π·${radius}·(${radius} + ${clean(slantHeight)}) ≈ ${clean(totalArea)}`
    ]
  };
}

export function calculateCuboid(length: number, width: number, height: number): GeometryCalculation {
  if (length <= 0 || width <= 0 || height <= 0) throw new Error('All dimensions must be positive.');
  const volume = length * width * height;
  const surfaceArea = 2 * (length * width + length * height + width * height);
  const spaceDiagonal = Math.sqrt(length * length + width * width + height * height);

  return {
    shape: 'Cuboid / Rectangular Prism',
    is3D: true,
    properties: [
      { label: 'Volume (V)', value: clean(volume), unit: 'cubic units', formula: 'l · w · h' },
      { label: 'Surface Area (A)', value: clean(surfaceArea), unit: 'sq units', formula: '2·(lw + lh + wh)' },
      { label: 'Space Diagonal', value: clean(spaceDiagonal), unit: 'units', formula: '√(l² + w² + h²)' }
    ],
    steps: [
      `Volume: V = ${length} × ${width} × ${height} = ${clean(volume)}`,
      `Surface Area: A = 2·(${length}·${width} + ${length}·${height} + ${width}·${height}) = ${clean(surfaceArea)}`,
      `Space Diagonal: d = √(${length}² + ${width}² + ${height}²) ≈ ${clean(spaceDiagonal)}`
    ]
  };
}

export type GeometryResult = GeometryCalculation;
export const calculateTriangleHeron = calculateTriangle;

function clean(n: number): number {
  return Math.round(n * 10000) / 10000;
}
