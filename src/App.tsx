import React, { useState, useEffect, useRef } from 'react';
import { Camera, Calculator, Plus, ArrowRight, Copy, Check, Sparkles, X } from 'lucide-react';
import { MatrixEditor } from './components/MatrixEditor';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import { NeuralMesh } from './components/NeuralMesh';
import * as m from './lib/math';
import { MatrixData, MatrixModel } from './types';
import anime from 'animejs';
import StrokeText from './StrokeText';

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

  const headerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resultBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial page entrance animation
    if (headerRef.current && contentRef.current) {
      const tl = anime.timeline({ easing: 'easeOutExpo' });
      tl.add({
        targets: headerRef.current,
        translateY: [-40, 0],
        opacity: [0, 1],
        duration: 700
      });
      if (heroRef.current) {
        tl.add({
          targets: heroRef.current,
          translateY: [-20, 0],
          opacity: [0, 1],
          duration: 700
        }, '-=400');
      }
      tl.add({
        targets: contentRef.current,
        translateY: [25, 0],
        opacity: [0, 1],
        duration: 600
      }, '-=450');
    }
  }, []);

  useEffect(() => {
    // Result appearance micro-interaction
    if (resultData && resultBoxRef.current) {
      anime({
        targets: resultBoxRef.current,
        opacity: [0.7, 1],
        scale: [0.98, 1],
        duration: 350,
        easing: 'easeOutCubic'
      });
    }
  }, [resultData]);

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
    <div className="min-h-screen text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      <NeuralMesh />
      
      {/* Header */}
      <header ref={headerRef} className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Calculator size={20} className="drop-shadow-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-indigo-100 tracking-tight">MatrixLab</h1>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.2)]">PRO</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-blue-300/50 font-semibold hidden sm:block">Scientific Computing Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <button 
              onClick={() => setIsScannerOpen(true)}
              aria-label="Open matrix scanner"
              className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-blue-600/15 hover:bg-blue-600/25 active:bg-blue-600/35 text-blue-300 rounded-xl font-bold transition-all border border-blue-500/30 min-h-[40px] shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]"
            >
              <Camera size={16} />
              <span className="tracking-wide">VISION SCAN</span>
            </button>
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-white/70 shadow-inner hidden md:flex">
              <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">Precision</span>
              <select 
                value={precision}
                onChange={(e) => setPrecision(Number(e.target.value))}
                aria-label="Numerical precision"
                className="bg-transparent text-white text-xs outline-none cursor-pointer font-mono font-bold appearance-none pl-1 pr-2"
              >
                {[2,3,4,5,6,8,10].map(p => <option key={p} value={p} className="bg-slate-900 text-white">{p} DEC</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Title Section with StrokeText */}
      <section 
        ref={heroRef}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 sm:pt-10 sm:pb-4 flex flex-col items-center justify-center text-center overflow-hidden opacity-0 z-20"
      >
        {/* Main MatrixLab Title using StrokeText */}
        <div className="w-full max-w-3xl mx-auto flex items-center justify-center px-2">
          <StrokeText 
            text="MatrixLab" 
            strokeColor="#A78BFA" 
            fillColor="#F8FAFC" 
            strokeWidth={1.4} 
            drawDuration={1.6} 
            fillDelay={0.2} 
            stagger={0.05} 
            ease="power2.out" 
            trigger="mount" 
            fillMode="wipe" 
            fontSize={128} 
            fontWeight={800} 
            letterSpacing={-4} 
          />
        </div>

        <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base font-medium text-slate-400 max-w-xl mx-auto tracking-wide px-4">
          High-performance matrix intelligence, linear algebraic solvers, and vision-assisted decomposition engine
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 opacity-0">
          
          {/* Left Column: Operations & Matrices */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            
            {/* Operation Selector Card */}
            <div className="glass-panel rounded-3xl p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                  <h2 className="text-sm sm:text-base uppercase tracking-widest text-white/70 font-bold">Operation Center</h2>
                </div>
                <div className="text-[11px] font-bold text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  {activeOp.name}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/50'
                        : 'bg-black/40 text-white/50 border border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Operations Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {filteredOperations.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setOperation(op.id)}
                    className={`px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left flex items-center justify-center text-center border min-h-[48px] ${
                      operationId === op.id 
                      ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10 hover:text-white active:bg-white/15'
                    }`}
                  >
                    <span className="line-clamp-2">{op.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Operands & Parameters Row */}
              <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-wrap items-center gap-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 shrink-0 flex items-center gap-1.5">
                  Operands <ArrowRight size={12} className="text-white/30" />
                </span>
                
                <div className="flex flex-wrap items-center gap-2.5">
                  {operandIds.map((id, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1.5 shadow-inner">
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
                        className="bg-transparent text-white text-xs sm:text-sm font-bold outline-none px-2 py-1 cursor-pointer appearance-none"
                      >
                        {matrices.map(m => (
                          <option key={m.id} value={m.id} className="bg-slate-900 text-white font-mono">
                            [{m.name}] {m.data.length}×{m.data[0]?.length || 0}
                          </option>
                        ))}
                      </select>
                      {activeOp.inputs === -1 && operandIds.length > 2 && (
                        <button 
                          onClick={() => setOperandIds(operandIds.filter((_, i) => i !== index))}
                          aria-label="Remove operand"
                          className="text-red-400 hover:bg-red-400/20 active:bg-red-400/30 p-1.5 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {activeOp.inputs === -1 && (
                    <button 
                      onClick={() => setOperandIds([...operandIds, matrices[0]?.id || ''])}
                      className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 active:bg-blue-500/30 rounded-xl text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors min-h-[40px]"
                      title="Add operand"
                    >
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>

                {activeOp.hasScalar && (
                  <div className="flex items-center gap-2 ml-auto shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 shadow-inner">
                    <span className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Scalar:</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={scalar} 
                      onChange={e => setScalar(e.target.value)}
                      className="bg-transparent w-16 text-white text-sm font-mono font-bold outline-none text-center glow-focus rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Matrix Workspace */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                  <h2 className="text-sm sm:text-base uppercase tracking-widest text-white/70 font-bold">Data Workspace</h2>
                </div>
                <button 
                  onClick={addEmptyMatrix}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 active:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm min-h-[40px]"
                >
                  <Plus size={16} /> Create Matrix
                </button>
              </div>
              
              {matrices.length === 0 ? (
                <div className="glass-panel rounded-3xl p-10 text-center flex flex-col items-center justify-center border-dashed border-white/20">
                  <Calculator size={48} className="text-white/20 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Workspace Empty</h3>
                  <p className="text-sm text-white/50 max-w-sm mb-6">Create a new matrix manually or use the Vision Scanner to extract matrices from images.</p>
                  <div className="flex items-center gap-4">
                    <button onClick={addEmptyMatrix} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-bold transition-colors">
                      Create Matrix
                    </button>
                    <button onClick={() => setIsScannerOpen(true)} className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-bold transition-colors">
                      Open Scanner
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
              )}
            </div>
            
            {/* Big Calculate Button */}
            <div className="flex justify-center pt-6 pb-10">
              <button
                onClick={calculate}
                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white rounded-2xl font-bold text-base sm:text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 min-h-[60px]"
              >
                <Sparkles size={22} className="text-blue-200" />
                EXECUTE COMPUTATION
                <ArrowRight size={22} />
              </button>
            </div>
          </div>

          {/* Right Column: Result & History Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Result Box */}
            <div ref={resultBoxRef} className="glass-panel rounded-3xl p-5 sm:p-7 min-h-[360px] flex flex-col lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                  <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    Output
                  </h2>
                </div>
                {resultData && (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    {resultData.type}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                {!resultData ? (
                  <div className="text-white/30 text-center py-10">
                    <Calculator size={56} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold tracking-widest uppercase">System Ready</p>
                    <p className="text-xs font-mono opacity-50 mt-2">Awaiting computation parameters</p>
                  </div>
                ) : resultData.type === 'error' ? (
                  <div className="text-red-400 text-center bg-red-950/40 p-5 rounded-2xl border border-red-500/20 w-full space-y-2 shadow-inner">
                    <p className="font-bold text-sm text-red-400 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Computation Error
                    </p>
                    <p className="text-xs font-mono text-red-300/80 break-words leading-relaxed">{resultData.value}</p>
                  </div>
                ) : resultData.type === 'matrix' ? (
                  <div className="w-full flex flex-col items-center">
                    {resultData.details && <p className="text-center text-blue-300/50 text-[10px] uppercase font-bold tracking-widest mb-4">{resultData.details}</p>}
                    <MatrixEditor matrix={resultData.value} onChange={() => {}} readonly />
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-6 w-full">
                      <button 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/15 hover:bg-blue-600/25 active:bg-blue-600/35 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px]"
                        onClick={addResultToWorkspace}
                      >
                        <Plus size={14} /> Import
                      </button>
                      <button 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/70 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] border border-white/10"
                        onClick={() => {
                          navigator.clipboard.writeText(resultData.value.map((r: string[]) => r.join('\t')).join('\n'));
                          setCopiedResult(true);
                          setTimeout(() => setCopiedResult(false), 1500);
                        }}
                      >
                        {copiedResult ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} 
                        {copiedResult ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ) : resultData.type === 'scalar' ? (
                  <div className="text-center py-8 w-full bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                    <div className="text-5xl sm:text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight">
                      {resultData.value}
                    </div>
                    <p className="text-[10px] text-white/40 mt-4 uppercase tracking-widest font-bold">Scalar Output</p>
                  </div>
                ) : resultData.type === 'boolean' ? (
                  <div className="text-center py-8 w-full bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                    <div className={`text-4xl sm:text-5xl font-bold uppercase tracking-widest ${resultData.value ? 'text-green-400' : 'text-red-400'}`}>
                      {resultData.value ? 'True' : 'False'}
                    </div>
                    <p className="text-[10px] text-white/40 mt-4 uppercase tracking-widest font-bold">Boolean Property</p>
                  </div>
                ) : resultData.type === 'complex' ? (
                  <div className="w-full space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin">
                    {Object.entries(resultData.value).map(([key, val]) => (
                      <div key={key} className="flex flex-col items-center bg-black/30 p-4 rounded-2xl border border-white/5">
                        <h4 className="text-blue-400 text-[11px] font-bold mb-3 uppercase tracking-widest">{key} Component</h4>
                        {Array.isArray(val) && Array.isArray(val[0]) ? (
                          <MatrixEditor matrix={val.map(r => r.map((c: any) => String(c)))} onChange={() => {}} readonly />
                        ) : (
                          <div className="bg-black/50 px-4 py-3 rounded-xl font-mono text-xs border border-white/10 break-all text-center text-white/80 w-full shadow-inner">
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
              <div className="glass-panel rounded-3xl p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                  <h3 className="text-white/60 font-bold uppercase tracking-widest text-[11px]">Execution Log</h3>
                  <button onClick={clearHistory} className="text-[10px] font-bold uppercase tracking-wider text-red-400/70 hover:text-red-400 transition-colors p-1">Clear Log</button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {history.map(item => {
                    const op = OPERATIONS.find(o => o.id === item.operationId);
                    return (
                      <div key={item.id} className="w-full text-left p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-white font-bold text-xs">{op?.name || item.operationId}</span>
                          <span className="text-white/30 text-[9px] font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <div className="text-white/50 text-[10px] font-mono uppercase tracking-wider">
                          CMD: {item.operandNames.join(' ')} {item.scalar && op?.hasScalar ? `(${item.scalar})` : ''}
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
