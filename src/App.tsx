import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Plus, 
  ArrowRight, 
  Copy, 
  Check, 
  X, 
  Play, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { MatrixEditor } from './components/MatrixEditor';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import * as m from './lib/math';
import { MatrixData, MatrixModel } from './types';
import anime from 'animejs';

// Layout & Navigation Design System
import { AppShell } from './components/layout/AppShell';
import { MathMode } from './components/navigation/ModeNavigator';
import { EquationToMatrixModal } from './components/matrix/EquationToMatrixModal';
import { CalculatorHeader } from './components/design-system/CalculatorHeader';
import { MatrixDisplay } from './components/design-system/MatrixDisplay';
import { ResultPanel } from './components/design-system/ResultPanel';

// Mathematical Modes
import { StrokeText } from './StrokeText';
import { LinearSystemsMode } from './modes/systems/LinearSystemsMode';
import { LinearAlgebraMode } from './modes/linear-algebra/LinearAlgebraMode';
import { CalculusMode } from './modes/calculus/CalculusMode';
import { IntegralMode } from './modes/integral/IntegralMode';
import { DifferentialEquationsMode } from './modes/differential/DifferentialEquationsMode';
import { LaplaceMode } from './modes/laplace/LaplaceMode';
import { InverseLaplaceMode } from './modes/laplace/InverseLaplaceMode';
import { FunctionCalculatorMode } from './modes/functions/FunctionCalculatorMode';
import { AlgebraMode } from './modes/algebra/AlgebraMode';
import { GeometryMode } from './modes/geometry/GeometryMode';
import { PreCalculusMode } from './modes/precalculus/PreCalculusMode';
import { DiscreteMathMode } from './modes/discrete/DiscreteMathMode';
import { ProbabilityStatsMode } from './modes/probability-statistics/ProbabilityStatsMode';
import { LinearProgrammingMode } from './modes/linear-programming/LinearProgrammingMode';

type OperationType = 
  | 'add' | 'subtract' | 'multiply' | 'multiplyScalar' | 'elementMultiply' 
  | 'elementDivide' | 'kronecker' | 'transpose' | 'det' | 'inv' | 'pinv' 
  | 'trace' | 'rref' | 'rank' | 'nullity' | 'power' | 'solve' | 'lu' 
  | 'qr' | 'eigen' | 'adjugate' | 'cofactor' | 'norm_fro' | 'norm_1' 
  | 'norm_inf' | 'cond' | 'isSymmetric' | 'isOrthogonal' | 'isSingular';

interface Operation {
  id: OperationType;
  name: string;
  category: 'Basic' | 'Square Matrix' | 'Row / Linear' | 'Eigen' | 'Norms';
  inputs: number; // -1 means 2 or more
  hasScalar?: boolean;
}

const OPERATIONS: Operation[] = [
  { id: 'add', name: 'Add (A + B)', category: 'Basic', inputs: -1 },
  { id: 'subtract', name: 'Subtract (A − B)', category: 'Basic', inputs: 2 },
  { id: 'multiply', name: 'Multiply (A × B)', category: 'Basic', inputs: -1 },
  { id: 'multiplyScalar', name: 'Scalar Product (k · A)', category: 'Basic', inputs: 1, hasScalar: true },
  { id: 'elementMultiply', name: 'Hadamard Product (A ∘ B)', category: 'Basic', inputs: -1 },
  { id: 'elementDivide', name: 'Element Division (A ⊘ B)', category: 'Basic', inputs: 2 },
  { id: 'kronecker', name: 'Kronecker Product (A ⊗ B)', category: 'Basic', inputs: 2 },
  { id: 'transpose', name: 'Transpose (Aᵀ)', category: 'Basic', inputs: 1 },
  
  { id: 'det', name: 'Determinant det(A)', category: 'Square Matrix', inputs: 1 },
  { id: 'inv', name: 'Inverse Matrix (A⁻¹)', category: 'Square Matrix', inputs: 1 },
  { id: 'pinv', name: 'Moore-Penrose Pseudoinverse (A⁺)', category: 'Square Matrix', inputs: 1 },
  { id: 'trace', name: 'Trace tr(A)', category: 'Square Matrix', inputs: 1 },
  { id: 'power', name: 'Matrix Power (Aⁿ)', category: 'Square Matrix', inputs: 1, hasScalar: true },
  { id: 'adjugate', name: 'Adjugate Matrix adj(A)', category: 'Square Matrix', inputs: 1 },
  { id: 'cofactor', name: 'Cofactor Matrix', category: 'Square Matrix', inputs: 1 },
  { id: 'isSingular', name: 'Singularity Test', category: 'Square Matrix', inputs: 1 },
  { id: 'isSymmetric', name: 'Symmetry Test', category: 'Square Matrix', inputs: 1 },
  { id: 'isOrthogonal', name: 'Orthogonality Test', category: 'Square Matrix', inputs: 1 },

  { id: 'rref', name: 'Reduced Row Echelon Form (RREF)', category: 'Row / Linear', inputs: 1 },
  { id: 'rank', name: 'Matrix Rank rank(A)', category: 'Row / Linear', inputs: 1 },
  { id: 'nullity', name: 'Nullity null(A)', category: 'Row / Linear', inputs: 1 },
  { id: 'solve', name: 'Linear Solve (Ax = B)', category: 'Row / Linear', inputs: 2 },
  { id: 'lu', name: 'LU Decomposition', category: 'Row / Linear', inputs: 1 },
  { id: 'qr', name: 'QR Decomposition', category: 'Row / Linear', inputs: 1 },
  
  { id: 'eigen', name: 'Eigenvalues & Eigenvectors', category: 'Eigen', inputs: 1 },
  
  { id: 'norm_fro', name: 'Frobenius Norm ||A||_F', category: 'Norms', inputs: 1 },
  { id: 'norm_1', name: '1-Norm (Max Column Sum)', category: 'Norms', inputs: 1 },
  { id: 'norm_inf', name: '∞-Norm (Max Row Sum)', category: 'Norms', inputs: 1 },
  { id: 'cond', name: 'Condition Number cond(A)', category: 'Norms', inputs: 1 },
];

const CATEGORIES = ['All', 'Basic', 'Square Matrix', 'Row / Linear', 'Eigen', 'Norms'] as const;

interface HistoryItem {
  id: string;
  operationId: OperationType;
  operandNames: string[];
  scalar: string;
  result: any;
  resultType: 'matrix' | 'scalar' | 'boolean' | 'complex' | 'error';
  timestamp: number;
}

const DEFAULT_MATRICES: MatrixModel[] = [
  { id: 'm1', name: 'A', data: [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']] },
  { id: 'm2', name: 'B', data: [['1', '0', '0'], ['0', '1', '0'], ['0', '0', '1']] }
];

export default function App() {
  const [activeMode, setActiveMode] = useState<MathMode>('matrix');
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [matrices, setMatrices] = useState<MatrixModel[]>(DEFAULT_MATRICES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [operationId, setOperationId] = useState<OperationType>('multiply');
  const [operandIds, setOperandIds] = useState<string[]>(['m1', 'm2']);
  const [scalar, setScalar] = useState<string>('2');
  const [precision, setPrecision] = useState<number>(4);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [resultData, setResultData] = useState<{ 
    type: 'matrix' | 'scalar' | 'boolean' | 'complex' | 'error', 
    value: any, 
    details?: string 
  } | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('matrixlab_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const resultBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultData && resultBoxRef.current) {
      anime({
        targets: resultBoxRef.current,
        scale: [0.98, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  }, [resultData]);

  const activeOp = OPERATIONS.find(o => o.id === operationId) || OPERATIONS[0];

  const filteredOps = selectedCategory === 'All' 
    ? OPERATIONS 
    : OPERATIONS.filter(o => o.category === selectedCategory);

  const addEmptyMatrix = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedNames = new Set(matrices.map(m => m.name));
    let name = 'M';
    for (let i = 0; i < letters.length; i++) {
      if (!usedNames.has(letters[i])) {
        name = letters[i];
        break;
      }
    }

    const newMatrix: MatrixModel = {
      id: Math.random().toString(36).substring(7),
      name,
      data: [['1', '0'], ['0', '1']]
    };
    setMatrices([...matrices, newMatrix]);
  };

  const updateMatrixData = (id: string, data: MatrixData) => {
    setMatrices(matrices.map(m => m.id === id ? { ...m, data } : m));
  };

  const updateMatrixName = (id: string, name: string) => {
    setMatrices(matrices.map(m => m.id === id ? { ...m, name } : m));
  };

  const deleteMatrix = (id: string) => {
    if (matrices.length <= 1) return;
    setMatrices(matrices.filter(m => m.id !== id));
    setOperandIds(operandIds.filter(opId => opId !== id));
  };

  const addResultToWorkspace = () => {
    if (!resultData || resultData.type !== 'matrix') return;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedNames = new Set(matrices.map(m => m.name));
    let name = 'R';
    for (let i = 0; i < letters.length; i++) {
      if (!usedNames.has(letters[i])) {
        name = letters[i];
        break;
      }
    }
    const newMatrix: MatrixModel = {
      id: Math.random().toString(36).substring(7),
      name,
      data: resultData.value
    };
    setMatrices([...matrices, newMatrix]);
  };

  const handleScanComplete = (mat: string[][]) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedNames = new Set(matrices.map(m => m.name));
    let name = 'S';
    for (let i = 0; i < letters.length; i++) {
      if (!usedNames.has(letters[i])) {
        name = letters[i];
        break;
      }
    }
    const newMatrix: MatrixModel = {
      id: Math.random().toString(36).substring(7),
      name,
      data: mat
    };
    setMatrices(prev => [...prev, newMatrix]);
  };

  const handleApplyEquations = (matA: string[][], matB: string[][]) => {
    setMatrices(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = { ...updated[0], data: matA };
      } else {
        updated.push({ id: Math.random().toString(36).substring(7), name: 'A', data: matA });
      }
      if (updated.length > 1) {
        updated[1] = { ...updated[1], data: matB };
      } else {
        updated.push({ id: Math.random().toString(36).substring(7), name: 'B', data: matB });
      }
      return updated;
    });
  };

  const setOperation = (opId: OperationType) => {
    setOperationId(opId);
    setResultData(null);
    const op = OPERATIONS.find(o => o.id === opId)!;
    if (op.inputs === 1) {
      setOperandIds([matrices[0]?.id].filter(Boolean));
    } else if (op.inputs === 2 && operandIds.length < 2) {
      setOperandIds([matrices[0]?.id, matrices[1]?.id || matrices[0]?.id].filter(Boolean));
    }
  };

  const calculate = () => {
    try {
      const opMats = operandIds.map(id => matrices.find(m => m.id === id)?.data).filter(Boolean) as MatrixData[];
      if (opMats.length === 0) throw new Error("Please select matrices to operate on.");
      
      const parsedMats = opMats.map(mat => m.parseMatrix(mat));
      const s = Number(scalar) || 0;
      let res: any;
      let type: 'matrix' | 'scalar' | 'boolean' | 'complex' = 'matrix';
      let details = '';

      const A = parsedMats[0];

      if (activeOp.inputs === -1) {
        if (parsedMats.length < 2) throw new Error(`${activeOp.name} requires at least 2 matrices.`);
        res = parsedMats[0];
        for (let i = 1; i < parsedMats.length; i++) {
          if (operationId === 'add') res = m.add(res, parsedMats[i]);
          else if (operationId === 'multiply') res = m.multiply(res, parsedMats[i]);
          else if (operationId === 'elementMultiply') res = m.elementWiseMultiply(res, parsedMats[i]);
        }
      } else {
        const B = parsedMats[1];
        switch (operationId) {
          case 'subtract': 
            if (!B) throw new Error("Subtraction requires 2 matrices.");
            res = m.subtract(A, B); 
            break;
          case 'multiplyScalar': res = m.multiplyScalar(A, s); break;
          case 'elementDivide': 
            if (!B) throw new Error("Element division requires 2 matrices.");
            res = m.elementWiseDivide(A, B); 
            break;
          case 'kronecker': 
            if (!B) throw new Error("Kronecker product requires 2 matrices.");
            res = m.kroneckerProduct(A, B); 
            break;
          case 'transpose': res = m.transpose(A); break;
          case 'det': res = m.cleanFloat(m.determinant(A), precision); type = 'scalar'; break;
          case 'inv': res = m.inverse(A); break;
          case 'pinv': res = m.pinv(A); break;
          case 'trace': res = m.cleanFloat(m.trace(A), precision); type = 'scalar'; break;
          case 'power': res = m.matrixPower(A, s); break;
          case 'adjugate': res = m.adjugate(A); break;
          case 'cofactor': res = m.cofactorMatrix(A); break;
          case 'isSingular': res = Math.abs(m.determinant(A)) < 1e-10; type = 'boolean'; break;
          case 'isSymmetric': res = m.isSymmetric(A); type = 'boolean'; break;
          case 'isOrthogonal': res = m.isOrthogonal(A); type = 'boolean'; break;
          case 'rref': 
            res = m.rref(A).matrix;
            details = 'Reduced Row Echelon Form';
            break;
          case 'rank': res = m.rank(A); type = 'scalar'; break;
          case 'nullity': res = m.nullity(A); type = 'scalar'; break;
          case 'solve': 
            if (!B) throw new Error("Solving Ax = B requires a coefficient matrix A and constants vector/matrix B.");
            res = m.solveLinear(A, B); 
            break;
          case 'lu': {
            const lu = m.luDecomp(A);
            type = 'complex';
            res = { L: m.cleanMatrix(lu.L, precision), U: m.cleanMatrix(lu.U, precision), P: lu.p };
            break;
          }
          case 'qr': {
            const qr = m.qrDecomp(A);
            type = 'complex';
            res = { Q: m.cleanMatrix(qr.Q, precision), R: m.cleanMatrix(qr.R, precision) };
            break;
          }
          case 'eigen': {
            const eig = m.eigen(A);
            type = 'complex';
            res = { 
              Values: eig.values.map((v: any) => typeof v === 'number' ? m.cleanFloat(v, precision) : v), 
              Vectors: m.cleanMatrix(eig.vectors, precision) 
            };
            break;
          }
          case 'norm_fro': res = m.cleanFloat(m.norm(A, 'fro'), precision); type = 'scalar'; break;
          case 'norm_1': res = m.cleanFloat(m.norm(A, 1), precision); type = 'scalar'; break;
          case 'norm_inf': res = m.cleanFloat(m.norm(A, 'inf'), precision); type = 'scalar'; break;
          case 'cond': res = m.cleanFloat(m.conditionNumber(A), precision); type = 'scalar'; break;
        }
      }

      let finalVal: any;
      if (type === 'matrix') {
        finalVal = m.cleanMatrix(res, precision);
      } else {
        finalVal = res;
      }

      setResultData({ type, value: finalVal, details });

      // Save to History
      const operandNames = operandIds.map(id => matrices.find(mat => mat.id === id)?.name || id);
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        operationId,
        operandNames,
        scalar,
        result: finalVal,
        resultType: type,
        timestamp: Date.now()
      };
      
      const newHistory = [newHistoryItem, ...history.slice(0, 19)];
      setHistory(newHistory);
      try {
        localStorage.setItem('matrixlab_history', JSON.stringify(newHistory));
      } catch {
        // ignore storage quota error
      }

    } catch (err: any) {
      setResultData({ type: 'error', value: err.message || "An unexpected mathematical error occurred." });
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('matrixlab_history');
  };

  return (
    <AppShell
      activeMode={activeMode}
      onSelectMode={setActiveMode}
      onOpenScanner={() => setIsScannerOpen(true)}
      onOpenEqModal={() => setIsEqModalOpen(true)}
      precision={precision}
      onPrecisionChange={setPrecision}
    >
      {/* 1. Matrix Calculator Mode */}
      {activeMode === 'matrix' && (
        <div className="space-y-8">
          {/* Animated MatrixLab Identity Title */}
          <div className="w-full py-2 sm:py-4 flex flex-col items-center justify-center min-w-0 max-w-full overflow-hidden text-center select-none">
            <div className="w-full max-w-xs sm:max-w-md mx-auto flex items-center justify-center min-w-0 px-2">
              <StrokeText
                text="MatrixLab"
                strokeColor="#60A5FA"
                fillColor="#F8FAFC"
                strokeWidth={1.5}
                drawDuration={1.1}
                fillDelay={0.1}
                stagger={0.035}
                fontSize={56}
                letterSpacing={-1.5}
              />
            </div>
            <p className="text-[11px] sm:text-xs font-mono tracking-widest uppercase text-blue-400/80 mt-1">
              Scientific Computing & Mathematics Workstation
            </p>
          </div>

          <CalculatorHeader
            category="Linear Algebra"
            title="Matrix Calculator & Decompositions"
            description="Multi-matrix linear algebra workstation. Compute matrix products, inverses, determinants, row reductions (RREF), rank, eigenvalues/eigenvectors, and matrix factorizations (LU, QR)."
          />

          {/* Operation Selector */}
          <section className="space-y-4">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Operation Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredOps.map(op => {
                const isSelected = op.id === operationId;
                return (
                  <button
                    key={op.id}
                    onClick={() => setOperation(op.id)}
                    className={`p-3 rounded-xl text-left border text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/40 text-white shadow-sm ring-1 ring-blue-500/30'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span>{op.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Operands & Parameters Selection Bar */}
          <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Operands:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {operandIds.map((id, index) => (
                  <div key={index} className="flex items-center gap-1 bg-slate-950/80 border border-slate-700/80 rounded-xl p-1.5">
                    {index > 0 && activeOp.inputs === -1 && (
                      <span className="text-blue-400 font-bold text-sm px-1.5">
                        {activeOp.id === 'add' ? '+' : activeOp.id === 'multiply' ? '×' : '∘'}
                      </span>
                    )}
                    <select
                      value={id}
                      aria-label={`Operand ${index + 1}`}
                      onChange={(e) => {
                        const newOperands = [...operandIds];
                        newOperands[index] = e.target.value;
                        setOperandIds(newOperands);
                      }}
                      className="bg-transparent text-slate-100 text-xs sm:text-sm font-medium outline-none px-2 py-1 cursor-pointer"
                    >
                      {matrices.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100 font-sans">
                          [{m.name}] {m.data.length}×{m.data[0]?.length || 0}
                        </option>
                      ))}
                    </select>

                    {activeOp.inputs === -1 && operandIds.length > 2 && (
                      <button 
                        onClick={() => setOperandIds(operandIds.filter((_, i) => i !== index))}
                        aria-label="Remove operand"
                        className="text-red-400 hover:bg-red-400/20 p-1 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {activeOp.inputs === -1 && (
                  <button 
                    onClick={() => setOperandIds([...operandIds, matrices[0]?.id || ''])}
                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-xl text-blue-400 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Add Operand
                  </button>
                )}
              </div>

              {activeOp.hasScalar && (
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-slate-400 font-medium">Scalar k =</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={scalar} 
                    onChange={e => setScalar(e.target.value)}
                    className="bg-transparent w-16 text-slate-100 text-sm font-mono font-semibold outline-none text-center"
                  />
                </div>
              )}
            </div>

            {/* Execute Compute Button */}
            <button
              onClick={calculate}
              aria-label={`EXECUTE COMPUTATION (${activeOp.name})`}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 shrink-0 min-h-[44px]"
            >
              <Play size={16} fill="currentColor" />
              <span>EXECUTE COMPUTATION ({activeOp.name})</span>
            </button>
          </section>

          {/* Dominant Result Output */}
          {resultData && (
            <div ref={resultBoxRef} className="w-full">
              {resultData.type === 'error' ? (
                <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
                  <p className="font-semibold text-red-200 mb-1">Computation Error</p>
                  <p className="text-xs font-mono">{resultData.value}</p>
                </div>
              ) : resultData.type === 'matrix' ? (
                <div className="rounded-2xl bg-slate-900/90 border-2 border-blue-500/30 p-6 sm:p-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md">
                      RESULT MATRIX
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={addResultToWorkspace}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Plus size={14} /> Import to Workspace
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(resultData.value.map((r: string[]) => r.join('\t')).join('\n'));
                          setCopiedResult(true);
                          setTimeout(() => setCopiedResult(false), 1500);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        {copiedResult ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="py-6 flex flex-col items-center justify-center">
                    <MatrixDisplay matrix={resultData.value} size="lg" />
                    {resultData.details && (
                      <p className="mt-3 text-xs text-slate-400">{resultData.details}</p>
                    )}
                  </div>
                </div>
              ) : resultData.type === 'scalar' ? (
                <ResultPanel
                  title="SCALAR OUTPUT"
                  result={resultData.value}
                  subtitle={`Computed value for ${activeOp.name}`}
                />
              ) : resultData.type === 'boolean' ? (
                <ResultPanel
                  title="LOGICAL PROPERTY"
                  result={resultData.value ? 'TRUE' : 'FALSE'}
                  subtitle={`Axiomatic test for ${activeOp.name}`}
                />
              ) : resultData.type === 'complex' ? (
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md">
                    DECOMPOSITION COMPONENTS
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {Object.entries(resultData.value).map(([key, val]) => (
                      <div key={key} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                        <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block mb-2">
                          {key} Component
                        </span>
                        {Array.isArray(val) && Array.isArray(val[0]) ? (
                          <div className="flex justify-center">
                            <MatrixDisplay matrix={val as any} size="sm" />
                          </div>
                        ) : (
                          <div className="font-mono text-sm text-slate-200 select-all">
                            {JSON.stringify(val)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Matrix Workspace Grid */}
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Data Workspace
                </h3>
                <p className="text-xs text-slate-400">
                  Manage active matrix registers ({matrices.length} defined)
                </p>
              </div>

              <button 
                onClick={addEmptyMatrix}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-medium transition-colors"
              >
                <Plus size={15} /> Add Matrix
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matrices.map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMatrixName(m.id, e.target.value)}
                      className="font-serif font-bold text-lg text-slate-100 bg-transparent outline-none w-20 px-1 border-b border-transparent focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        {m.data.length}×{m.data[0]?.length || 0}
                      </span>
                      {matrices.length > 1 && (
                        <button
                          onClick={() => deleteMatrix(m.id)}
                          title="Delete matrix"
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <MatrixEditor 
                    matrix={m.data} 
                    onChange={(newData) => updateMatrixData(m.id, newData)} 
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Execution History Log */}
          {history.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recent Calculations Log
                </span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400/80 hover:text-red-300 transition-colors"
                >
                  Clear Log
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {history.slice(0, 8).map(item => {
                  const op = OPERATIONS.find(o => o.id === item.operationId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-300">{op?.name || item.operationId}</span>
                        <span className="text-slate-500 font-mono">({item.operandNames.join(', ')})</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 2. Linear Systems Mode */}
      {activeMode === 'systems' && <LinearSystemsMode />}

      {/* 3. Linear Algebra Mode */}
      {activeMode === 'linear-algebra' && <LinearAlgebraMode />}

      {/* 4. Calculus Mode */}
      {activeMode === 'calculus' && <CalculusMode />}

      {/* 5. Integrals Mode */}
      {activeMode === 'integral' && <IntegralMode />}

      {/* 6. Differential Equations Mode */}
      {activeMode === 'differential' && <DifferentialEquationsMode />}

      {/* 7. Laplace Mode */}
      {activeMode === 'laplace' && <LaplaceMode />}

      {/* 8. Inverse Laplace Mode */}
      {activeMode === 'inverse-laplace' && <InverseLaplaceMode />}

      {/* 9. Functions Mode */}
      {activeMode === 'functions' && <FunctionCalculatorMode />}

      {/* 10. Algebra Mode */}
      {activeMode === 'algebra' && <AlgebraMode />}

      {/* 11. Geometry Mode */}
      {activeMode === 'geometry' && <GeometryMode />}

      {/* 12. Pre-Calculus & Trigonometry Mode */}
      {activeMode === 'precalculus' && <PreCalculusMode />}

      {/* 13. Discrete Math & Combinatorics Mode */}
      {activeMode === 'discrete' && <DiscreteMathMode />}

      {/* 14. Probability & Statistics Mode */}
      {activeMode === 'probability-statistics' && <ProbabilityStatsMode />}

      {/* 15. Linear Programming Mode */}
      {activeMode === 'linear-programming' && <LinearProgrammingMode />}

      {/* Modals */}
      <ScannerWorkspace
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddMatrix={handleScanComplete}
      />

      <EquationToMatrixModal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        onImport={(matA, matB) => handleApplyEquations(matA, matB)}
      />
    </AppShell>
  );
}
