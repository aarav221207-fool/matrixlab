import React, { useState } from 'react';
import { Camera, Calculator, Plus, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';
import { MatrixEditor } from './components/MatrixEditor';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import * as m from './lib/math';
import { MatrixData, MatrixModel } from './types';

type OperationType = 'add' | 'subtract' | 'multiply' | 'multiplyScalar' | 'elementMultiply' | 'elementDivide' | 'kronecker' | 'transpose' | 'det' | 'inv' | 'pinv' | 'trace' | 'rref' | 'rank' | 'nullity' | 'power' | 'solve' | 'lu' | 'qr' | 'eigen' | 'adjugate' | 'cofactor' | 'norm_fro' | 'norm_1' | 'norm_inf' | 'cond' | 'isSymmetric' | 'isOrthogonal' | 'isSingular';

interface Operation {
  id: OperationType;
  name: string;
  category: 'Basic' | 'Square Matrix' | 'Row / Linear' | 'Eigen' | 'Norms';
  inputs: number; // -1 means 2 or more
  hasScalar?: boolean;
}

const OPERATIONS: Operation[] = [
  { id: 'add', name: 'Add (+)', category: 'Basic', inputs: -1 },
  { id: 'subtract', name: 'Subtract (−)', category: 'Basic', inputs: 2 },
  { id: 'multiply', name: 'Multiply (×)', category: 'Basic', inputs: -1 },
  { id: 'multiplyScalar', name: 'Scalar × A', category: 'Basic', inputs: 1, hasScalar: true },
  { id: 'elementMultiply', name: 'Hadamard (∘)', category: 'Basic', inputs: -1 },
  { id: 'elementDivide', name: 'Element Divide (⊘)', category: 'Basic', inputs: 2 },
  { id: 'kronecker', name: 'Kronecker (⊗)', category: 'Basic', inputs: 2 },
  { id: 'transpose', name: 'Transpose (Aᵀ)', category: 'Basic', inputs: 1 },
  
  { id: 'det', name: 'Determinant |A|', category: 'Square Matrix', inputs: 1 },
  { id: 'inv', name: 'Inverse (A⁻¹)', category: 'Square Matrix', inputs: 1 },
  { id: 'pinv', name: 'Pseudoinverse (A⁺)', category: 'Square Matrix', inputs: 1 },
  { id: 'trace', name: 'Trace (tr(A))', category: 'Square Matrix', inputs: 1 },
  { id: 'power', name: 'Power (Aⁿ)', category: 'Square Matrix', inputs: 1, hasScalar: true },
  { id: 'adjugate', name: 'Adjugate', category: 'Square Matrix', inputs: 1 },
  { id: 'cofactor', name: 'Cofactor Matrix', category: 'Square Matrix', inputs: 1 },
  { id: 'isSingular', name: 'Is Singular?', category: 'Square Matrix', inputs: 1 },
  { id: 'isSymmetric', name: 'Is Symmetric?', category: 'Square Matrix', inputs: 1 },
  { id: 'isOrthogonal', name: 'Is Orthogonal?', category: 'Square Matrix', inputs: 1 },

  { id: 'rref', name: 'RREF', category: 'Row / Linear', inputs: 1 },
  { id: 'rank', name: 'Rank', category: 'Row / Linear', inputs: 1 },
  { id: 'nullity', name: 'Nullity', category: 'Row / Linear', inputs: 1 },
  { id: 'solve', name: 'Solve Ax = B', category: 'Row / Linear', inputs: 2 },
  { id: 'lu', name: 'LU Decomposition', category: 'Row / Linear', inputs: 1 },
  { id: 'qr', name: 'QR Decomposition', category: 'Row / Linear', inputs: 1 },
  
  { id: 'eigen', name: 'Eigenvalues & Vectors', category: 'Eigen', inputs: 1 },
  
  { id: 'norm_fro', name: 'Frobenius Norm', category: 'Norms', inputs: 1 },
  { id: 'norm_1', name: '1-Norm', category: 'Norms', inputs: 1 },
  { id: 'norm_inf', name: '∞-Norm', category: 'Norms', inputs: 1 },
  { id: 'cond', name: 'Condition Number', category: 'Norms', inputs: 1 },
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
  const [matrices, setMatrices] = useState<MatrixModel[]>(DEFAULT_MATRICES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [operationId, setOperationId] = useState<OperationType>('multiply');
  const [operandIds, setOperandIds] = useState<string[]>(['m1', 'm2']);
  const [scalar, setScalar] = useState<string>('2');
  const [precision, setPrecision] = useState<number>(4);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [resultData, setResultData] = useState<{ type: 'matrix' | 'scalar' | 'boolean' | 'complex' | 'error', value: any, details?: string } | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('matrixlab_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeOp = OPERATIONS.find(o => o.id === operationId) || OPERATIONS[0];

  const filteredOperations = selectedCategory === 'All' 
    ? OPERATIONS 
    : OPERATIONS.filter(o => o.category === selectedCategory);

  const getNextMatrixName = () => {
    const usedNames = new Set(matrices.map(m => m.name));
    for (let i = 65; i <= 90; i++) {
      const name = String.fromCharCode(i);
      if (!usedNames.has(name)) return name;
    }
    return `M${matrices.length + 1}`;
  };

  const addEmptyMatrix = () => {
    const newMatrix: MatrixModel = {
      id: Math.random().toString(36).substring(7),
      name: getNextMatrixName(),
      data: [['0', '0'], ['0', '0']]
    };
    setMatrices([...matrices, newMatrix]);
  };

  const updateMatrixData = (id: string, data: MatrixData) => {
    setMatrices(prev => prev.map(m => m.id === id ? { ...m, data } : m));
  };

  const duplicateMatrix = (id: string) => {
    const source = matrices.find(m => m.id === id);
    if (!source) return;
    const newMatrix: MatrixModel = {
      id: Math.random().toString(36).substring(7),
      name: getNextMatrixName(),
      data: source.data.map(row => [...row]),
    };
    setMatrices(prev => [...prev, newMatrix]);
  };

  const renameMatrix = (id: string, newName: string) => {
    setMatrices(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
  };

  const removeMatrix = (id: string) => {
    if (matrices.length <= 1) return;
    setMatrices(prev => prev.filter(m => m.id !== id));
    setOperandIds(prev => prev.filter(oid => oid !== id));
  };

  const handleScanApply = (matrixData: MatrixData) => {
    const newMatrix: MatrixModel = {
      id: Math.random().toString(36).substring(7),
      name: getNextMatrixName(),
      data: matrixData
    };
    setMatrices(prev => [...prev, newMatrix]);
  };

  const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = { ...item, id: Math.random().toString(36).substring(7), timestamp: Date.now() };
    const newHistory = [newItem, ...history].slice(0, 20);
    setHistory(newHistory);
    try {
      localStorage.setItem('matrixlab_history', JSON.stringify(newHistory));
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('matrixlab_history');
  };

  const addResultToWorkspace = () => {
    if (resultData?.type === 'matrix') {
      const newMatrix: MatrixModel = {
        id: Math.random().toString(36).substring(7),
        name: getNextMatrixName(),
        data: resultData.value
      };
      setMatrices(prev => [...prev, newMatrix]);
    }
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

      if (type === 'matrix') {
        res = m.cleanMatrix(res, precision).map(r => r.map(c => c.toString()));
      }

      setResultData({ type, value: res, details });
      
      const operandNames = operandIds.map(id => matrices.find(mat => mat.id === id)?.name || '?');
      saveToHistory({ operationId, operandNames, scalar, result: res, resultType: type });
    } catch (e: any) {
      setResultData({ type: 'error', value: e.message || 'An error occurred during calculation.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10"></div>
      
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">MatrixLab</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">v1</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold hidden sm:block">Advanced Matrix Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <button 
              onClick={() => setIsScannerOpen(true)}
              aria-label="Open matrix scanner"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 active:bg-blue-600/30 text-blue-400 rounded-xl font-semibold transition-colors border border-blue-500/30 min-h-[40px]"
            >
              <Camera size={16} />
              <span>Scan</span>
            </button>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-white/70">
              <span className="text-xs text-white/50 hidden md:inline">Precision:</span>
              <select 
                value={precision}
                onChange={(e) => setPrecision(Number(e.target.value))}
                aria-label="Numerical precision"
                className="bg-transparent text-white text-xs outline-none cursor-pointer"
              >
                {[2,3,4,5,6,8,10].map(p => <option key={p} value={p} className="bg-slate-900 text-white">{p} dec</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left Column: Operations & Matrices */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            
            {/* Operation Selector Card */}
            <div className="bg-slate-900/50 rounded-2xl p-4 sm:p-6 border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">1. Select Operation</h2>
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  {activeOp.name}
                </span>
              </div>

              {/* Category Filter Chips (Horizontal scrollable on mobile) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Operations Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredOperations.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setOperation(op.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left flex flex-col justify-center border min-h-[44px] ${
                      operationId === op.id 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] font-bold' 
                      : 'bg-white/5 border-white/5 text-white/75 hover:bg-white/10 hover:text-white active:bg-white/15'
                    }`}
                  >
                    <span className="truncate">{op.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Operands & Parameters Row */}
              <div className="bg-black/30 p-3.5 sm:p-4 rounded-xl border border-white/5 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50 shrink-0">Operands:</span>
                
                <div className="flex flex-wrap items-center gap-2">
                  {operandIds.map((id, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
                      {index > 0 && activeOp.inputs === -1 && (
                        <span className="text-blue-400 font-bold text-xs px-1">
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
                        className="bg-transparent text-white text-xs sm:text-sm font-semibold outline-none px-2 py-1 cursor-pointer"
                      >
                        {matrices.map(m => (
                          <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                            Matrix {m.name} ({m.data.length}×{m.data[0]?.length || 0})
                          </option>
                        ))}
                      </select>
                      {activeOp.inputs === -1 && operandIds.length > 2 && (
                        <button 
                          onClick={() => setOperandIds(operandIds.filter((_, i) => i !== index))}
                          aria-label="Remove operand"
                          className="text-red-400 hover:bg-red-400/20 active:bg-red-400/30 p-1 rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {activeOp.inputs === -1 && (
                    <button 
                      onClick={() => setOperandIds([...operandIds, matrices[0]?.id || ''])}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px]"
                      title="Add operand"
                    >
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>

                {activeOp.hasScalar && (
                  <div className="flex items-center gap-2 ml-auto shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
                    <span className="text-xs text-white/60 font-semibold">Scalar:</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={scalar} 
                      onChange={e => setScalar(e.target.value)}
                      className="bg-transparent w-16 text-white text-xs sm:text-sm font-mono outline-none text-center"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Matrix Workspace */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">2. Matrix Workspace</h2>
                  <p className="text-xs text-white/40">Edit cells, adjust dimensions, or add new matrices</p>
                </div>
                <button 
                  onClick={addEmptyMatrix}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm min-h-[40px]"
                >
                  <Plus size={16} /> New Matrix
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {matrices.map(matrix => (
                  <MatrixEditor 
                    key={matrix.id}
                    matrix={matrix.data} 
                    onChange={(data) => updateMatrixData(matrix.id, data)} 
                    title={`Matrix ${matrix.name}`}
                    onDelete={matrices.length > 1 ? () => removeMatrix(matrix.id) : undefined}
                    onDuplicate={() => duplicateMatrix(matrix.id)}
                    onRename={(newName) => renameMatrix(matrix.id, newName)}
                  />
                ))}
              </div>
            </div>
            
            {/* Big Calculate Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={calculate}
                className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl font-bold text-base sm:text-lg shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 min-h-[54px]"
              >
                <Sparkles size={20} className="text-blue-200" />
                Calculate Result
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Right Column: Result & History Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Result Box */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 min-h-[320px] flex flex-col shadow-2xl lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Result</span>
                  {resultData && (
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {resultData.type}
                    </span>
                  )}
                </h2>

                {resultData && resultData.type === 'matrix' && (
                  <div className="flex items-center gap-1.5">
                    <button 
                      title="Add result to workspace as new matrix"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-colors min-h-[34px]"
                      onClick={addResultToWorkspace}
                    >
                      <Plus size={14} /> Add to Workspace
                    </button>
                    <button 
                      title="Copy result matrix"
                      aria-label="Copy result"
                      className="p-2 bg-white/5 hover:bg-white/15 active:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center"
                      onClick={() => {
                        navigator.clipboard.writeText(resultData.value.map((r: string[]) => r.join('\t')).join('\n'));
                        setCopiedResult(true);
                        setTimeout(() => setCopiedResult(false), 1500);
                      }}
                    >
                      {copiedResult ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-4">
                {!resultData ? (
                  <div className="text-white/30 text-center py-8">
                    <Calculator size={44} className="mx-auto mb-3 opacity-25" />
                    <p className="text-sm font-medium">Select operands & tap Calculate</p>
                    <p className="text-xs opacity-60 mt-1">Calculations run 100% client-side</p>
                  </div>
                ) : resultData.type === 'error' ? (
                  <div className="text-red-400 text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20 w-full space-y-1">
                    <p className="font-bold text-sm text-red-300">Calculation Error</p>
                    <p className="text-xs text-red-200/80 break-words leading-relaxed">{resultData.value}</p>
                  </div>
                ) : resultData.type === 'matrix' ? (
                  <div className="w-full">
                    {resultData.details && <p className="text-center text-white/50 text-xs mb-3 font-medium">{resultData.details}</p>}
                    <MatrixEditor matrix={resultData.value} onChange={() => {}} readonly title="Result" />
                  </div>
                ) : resultData.type === 'scalar' ? (
                  <div className="text-center py-6">
                    <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                      {resultData.value}
                    </div>
                    <p className="text-xs text-white/40 mt-2">Scalar Result</p>
                  </div>
                ) : resultData.type === 'boolean' ? (
                  <div className="text-center py-6">
                    <div className={`text-4xl font-bold ${resultData.value ? 'text-green-400' : 'text-red-400'}`}>
                      {resultData.value ? 'True' : 'False'}
                    </div>
                    <p className="text-xs text-white/40 mt-2">Boolean Property</p>
                  </div>
                ) : resultData.type === 'complex' ? (
                  <div className="w-full space-y-4 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                    {Object.entries(resultData.value).map(([key, val]) => (
                      <div key={key} className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <h4 className="text-blue-400 text-xs font-bold mb-2 uppercase tracking-wider">{key}</h4>
                        {Array.isArray(val) && Array.isArray(val[0]) ? (
                          <MatrixEditor matrix={val.map(r => r.map((c: any) => String(c)))} onChange={() => {}} readonly />
                        ) : (
                          <div className="bg-black/40 px-3 py-2 rounded-lg font-mono text-xs border border-white/10 break-all text-center text-white">
                            {JSON.stringify(val)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* History Panel */}
            {history.length > 0 && (
              <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 sm:p-5 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white/70 font-bold uppercase tracking-wider text-xs">Recent Operations</h3>
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 transition-colors p-1">Clear</button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {history.map(item => {
                    const op = OPERATIONS.find(o => o.id === item.operationId);
                    return (
                      <div key={item.id} className="w-full text-left p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-white font-semibold text-xs">{op?.name || item.operationId}</span>
                          <span className="text-white/30 text-[10px]">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-white/50 text-[11px]">
                          Operands: {item.operandNames.join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <ScannerWorkspace 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onAddMatrix={handleScanApply} 
      />
    </div>
  );
}
