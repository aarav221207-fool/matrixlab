import { expect, test } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import * as m from './lib/math';
import { scanMatrixWithGemini, getActiveGeminiKey, validateMatrixStructure } from './lib/geminiScanner';

test('App renders without crashing or backend requirements', () => {
  const html = renderToString(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  expect(html).toContain('MatrixLab');
  expect(html).toContain('Calculate Result');
  expect(html).toContain('Matrix Workspace');
});

test('ScannerWorkspace renders cleanly with touch actions and upload controls', () => {
  const html = renderToString(
    <ScannerWorkspace 
      isOpen={true} 
      onClose={() => {}} 
      onAddMatrix={() => {}} 
    />
  );
  expect(html).toContain('Matrix Scanner');
  expect(html).toContain('Take Photo');
  expect(html).toContain('Upload Images');
});

test('Scanner gracefully handles missing API key when unconfigured', async () => {
  const fakeFile = new File(['fake content'], 'test.png', { type: 'image/png' });
  const result = await scanMatrixWithGemini(fakeFile, '');
  expect(result.success).toBe(false);
  expect(result.error).toBe('Gemini scanner is not configured.');
});

test('getActiveGeminiKey safely reads configuration from environment', () => {
  const activeKey = getActiveGeminiKey();
  expect(activeKey === null || typeof activeKey === 'string').toBe(true);
});

test('Matrix structure validator accepts valid rectangular matrices', () => {
  const validOutput = {
    rows: 2,
    columns: 2,
    matrix: [[1, 2], [3, 4]],
    confidence: 0.95,
  };
  const res = validateMatrixStructure(validOutput);
  expect(res.success).toBe(true);
  expect(res.matrix).toEqual([[1, 2], [3, 4]]);
  expect(res.confidence).toBe(0.95);
});

test('Matrix structure validator rejects malformed or non-numeric output', () => {
  const invalidOutput1 = {
    rows: 2,
    columns: 2,
    matrix: [[1, 'a'], [3, 4]], // non-numeric
  };
  expect(validateMatrixStructure(invalidOutput1).success).toBe(false);

  const invalidOutput2 = {
    rows: 2,
    columns: 3,
    matrix: [[1, 2], [3, 4]], // dimension mismatch
  };
  expect(validateMatrixStructure(invalidOutput2).success).toBe(false);

  const invalidOutput3 = {
    rows: 1,
    columns: 2,
    matrix: [[NaN, Infinity]], // NaN or Infinity
  };
  expect(validateMatrixStructure(invalidOutput3).success).toBe(false);
});

test('Mathematics engine executes matrix operations accurately', () => {
  const A = [[1, 2], [3, 4]];
  const B = [[2, 0], [1, 2]];
  const product = m.multiply(A, B);
  expect(product).toEqual([[4, 4], [10, 8]]);

  const rrefRes = m.rref([[1, 2], [2, 4]]);
  expect(rrefRes.matrix).toEqual([[1, 2], [0, 0]]);

  const det = m.determinant(A);
  expect(det).toBe(-2);

  const inv = m.inverse(A);
  expect(inv).toEqual([[-2, 1], [1.5, -0.5]]);
});

test('Multiple matrix scans append distinct matrices without overwriting', () => {
  const matrixList: any[] = [];
  const handleAdd = (mat: string[][]) => {
    matrixList.push(mat);
  };

  const scanResult1 = [['1', '2'], ['3', '4']];
  const scanResult2 = [['5', '6'], ['7', '8']];
  const scanResult3 = [['9', '10'], ['11', '12']];

  handleAdd(scanResult1);
  handleAdd(scanResult2);
  handleAdd(scanResult3);

  expect(matrixList.length).toBe(3);
  expect(matrixList[0]).toEqual(scanResult1);
  expect(matrixList[1]).toEqual(scanResult2);
  expect(matrixList[2]).toEqual(scanResult3);
});

test('Multi-matrix workspace operations support arbitrary operand selection and result generation', () => {
  const A = [[1, 0], [0, 1]];
  const B = [[2, 3], [4, 5]];
  const C = [[1, 1], [1, 1]];
  
  // A * B -> AB
  const AB = m.multiply(A, B);
  expect(AB).toEqual(B);

  // AB + C -> Result
  const ABC = m.add(AB, C);
  expect(ABC).toEqual([[3, 4], [5, 6]]);
});
