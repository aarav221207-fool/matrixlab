import React, { useState, useMemo } from 'react';
import { Camera, Calculator, Settings, Download, Trash2, ArrowRight, Copy, Plus, X } from 'lucide-react';
import { MatrixEditor } from './components/MatrixEditor';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import * as m from './lib/math';
import { MatrixData, MatrixModel } from './types';

type OperationType = 'add' | 'subtract' | 'multiply' | 'multiplyScalar' | 'elementMultiply' | 'elementDivide' | 'kronecker' | 'transpose' | 'det' | 'inv' | 'pinv' | 'trace' | 'rref' | 'rank' | 'nullity' | 'power' | 'solve' | 'lu' | 'qr' | 'eigen' | 'adjugate' | 'cofactor' | 'norm_fro' | 'norm_1' | 'norm_inf' | 'cond' | 'isSymmetric' | 'isOrthogonal' | 'isSingular';

interface Operation {
  id: OperationType;
  name: string;
  category: 'Basic' | 'Square Matrix' | 'Row/Linear' | 'Eigen' | 'Norms/Analysis';
  inputs: number; // -1 means 2 or more
  hasScalar?: boolean;
}

const OPERATIONS: Operation[] = [
  { id: 'add', name: 'Add (+)', category: 'Basic', inputs: -1 },
  { id: 'subtract', name: 'Subtract (-)', category: 'Basic', inputs: 2 },
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

  { id: 'rref', name: 'RREF', category: 'Row/Linear', inputs: 1 },
  { id: 'rank', name: 'Rank', category: 'Row/Linear', inputs: 1 },
  { id: 'nullity', name: 'Nullity', category: 'Row/Linear', inputs: 1 },
  { id: 'solve', name: 'Solve Ax = B', category: 'Row/Linear', inputs: 2 },
  { id: 'lu', name: 'LU Decomposition', category: 'Row/Linear', inputs: 1 },
  { id: 'qr', name: 'QR Decomposition', category: 'Row/Linear', inputs: 1 },
  
  { id: 'eigen', name: 'Eigenvalues/Vectors', category: 'Eigen', inputs: 1 },
  
  { id: 'norm_fro', name: 'Frobenius Norm', category: 'Norms/Analysis', inputs: 1 },
  { id: 'norm_1', name: '1-Norm', category: 'Norms/Analysis', inputs: 1 },
  { id: 'norm_inf', name: '∞-Norm', category: 'Norms/Analysis', inputs: 1 },
  { id: 'cond', name: 'Condition Number', category: 'Norms/Analysis', inputs: 1 },
];

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
  const [operationId, setOperationId] = useState<OperationType>('multiply');
  const [operandIds, setOperandIds] = useState<string[]>(['m1', 'm2']);
  const [scalar, setScalar] = useState<string>('2');
  const [precision, setPrecision] = useState<number>(4);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [resultData, setResultData] = useState<{ type: 'matrix' | 'scalar' | 'boolean' | 'complex' | 'error', value: any, details?: string } | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('matrixlab_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeOp = OPERATIONS.find(o => o.id === operationId)!;

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
      data: [['', ''], ['', '']]
    };
    setMatrices([...matrices, newMatrix]);
  };

  const updateMatrixData = (id: string, data: MatrixData) => {
    setMatrices(prev => prev.map(m => m.id === id ? { ...m, data } : m));
  };

  const removeMatrix = (id: string) => {
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
    const newHistory = [newItem, ...history].slice(0, 20); // Keep last 20
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
      setMatrices([...matrices, newMatrix]);
    }
  };

  const setOperation = (opId: OperationType) => {
    setOperationId(opId);
    setResultData(null);
    const op = OPERATIONS.find(o => o.id === opId)!;
    // Adjust operands count if needed
    if (op.inputs === 1) setOperandIds([matrices[0]?.id].filter(Boolean));
    else if (op.inputs === 2 && operandIds.length < 2) {
      setOperandIds([matrices[0]?.id, matrices[1]?.id || matrices[0]?.id].filter(Boolean));
    }
  };

  const calculate = () => {
    try {
      const opMats = operandIds.map(id => matrices.find(m => m.id === id)?.data).filter(Boolean) as MatrixData[];
      if (opMats.length === 0) throw new Error("No matrices selected.");
      
      const parsedMats = opMats.map(mat => m.parseMatrix(mat));
      const s = Number(scalar) || 0;
      let res: any;
      let type: 'matrix' | 'scalar' | 'boolean' | 'complex' = 'matrix';
      let details = '';

      const A = parsedMats[0];

      if (activeOp.inputs === -1) {
        if (parsedMats.length < 2) throw new Error(`Operation requires at least 2 matrices.`);
        res = parsedMats[0];
        for (let i = 1; i < parsedMats.length; i++) {
          if (operationId === 'add') res = m.add(res, parsedMats[i]);
          else if (operationId === 'multiply') res = m.multiply(res, parsedMats[i]);
          else if (operationId === 'elementMultiply') res = m.elementWiseMultiply(res, parsedMats[i]);
        }
      } else {
        const B = parsedMats[1];
        switch (operationId) {
          case 'subtract': res = m.subtract(A, B); break;
          case 'multiplyScalar': res = m.multiplyScalar(A, s); break;
          case 'elementDivide': res = m.elementWiseDivide(A, B); break;
          case 'kronecker': res = m.kroneckerProduct(A, B); break;
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
          case 'solve': res = m.solveLinear(A, B); break;
          case 'lu':
            const lu = m.luDecomp(A);
            type = 'complex';
            res = { L: m.cleanMatrix(lu.L, precision), U: m.cleanMatrix(lu.U, precision), P: lu.p };
            break;
          case 'qr':
            const qr = m.qrDecomp(A);
            type = 'complex';
            res = { Q: m.cleanMatrix(qr.Q, precision), R: m.cleanMatrix(qr.R, precision) };
            break;
          case 'eigen':
            const eig = m.eigen(A);
            type = 'complex';
            res = { Values: eig.values.map((v: any) => typeof v === 'number' ? m.cleanFloat(v, precision) : v), Vectors: m.cleanMatrix(eig.vectors, precision) };
            break;
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10"></div>
      
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">MatrixLab</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">Advanced Matrix Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
            >
              <Camera size={16} /> <span className="hidden sm:inline">Scan Matrix</span>
            </button>
            <div className="flex items-center gap-2 text-white/60">
              <span className="hidden sm:inline">Precision:</span>
              <select 
                value={precision}
                onChange={(e) => setPrecision(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500"
              >
                {[2,3,4,5,6,8,10].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Operations & Matrices */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Operation Selector */}
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-white/5 shadow-lg">
              <h2 className="text-sm uppercase tracking-widest text-white/40 font-semibold mb-4">Select Operation</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {OPERATIONS.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setOperation(op.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                      operationId === op.id 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <span className="text-sm font-semibold text-white/60">Operands:</span>
                
                {operandIds.map((id, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && activeOp.inputs === -1 && <span className="text-blue-400 font-bold">{activeOp.name.split(' ')[0]}</span>}
                    <select
                      value={id}
                      onChange={(e) => {
                        const newOperands = [...operandIds];
                        newOperands[index] = e.target.value;
                        setOperandIds(newOperands);
                      }}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-white"
                    >
                      {matrices.map(m => (
                        <option key={m.id} value={m.id}>Matrix {m.name}</option>
                      ))}
                    </select>
                    {activeOp.inputs === -1 && operandIds.length > 2 && (
                      <button 
                        onClick={() => setOperandIds(operandIds.filter((_, i) => i !== index))}
                        className="text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                {activeOp.inputs === -1 && (
                  <button 
                    onClick={() => setOperandIds([...operandIds, matrices[0]?.id || ''])}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    title="Add operand"
                  >
                    <Plus size={16} />
                  </button>
                )}

                {activeOp.hasScalar && (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-sm text-white/60">Scalar:</span>
                    <input 
                      type="text" 
                      value={scalar} 
                      onChange={e => setScalar(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 w-24 text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Matrix Workspace */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Workspace</h2>
                <button 
                  onClick={addEmptyMatrix}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors border border-white/10"
                >
                  <Plus size={16} /> New Matrix
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matrices.map(matrix => (
                  <div key={matrix.id} className="relative group">
                    <button 
                      onClick={() => removeMatrix(matrix.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-slate-900 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Matrix"
                    >
                      <X size={14} />
                    </button>
                    <MatrixEditor 
                      matrix={matrix.data} 
                      onChange={(data) => updateMatrixData(matrix.id, data)} 
                      title={`Matrix ${matrix.name}`} 
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center pt-8 border-t border-white/5">
              <button
                onClick={calculate}
                className="group relative px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                Calculate Result
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Result Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 min-h-[400px] flex flex-col shadow-2xl sticky top-24">
              <h2 className="text-xl font-semibold mb-6 text-white flex items-center justify-between">
                Result
                {resultData && resultData.type === 'matrix' && (
                  <div className="flex gap-2">
                    <button 
                      title="Add to Workspace"
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-colors"
                      onClick={addResultToWorkspace}
                    >
                      <Plus size={14} /> Add to Workspace
                    </button>
                    <button 
                      title="Copy Result"
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(resultData.value.map((r: string[]) => r.join('\t')).join('\n'));
                      }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                )}
              </h2>

              <div className="flex-1 flex flex-col items-center justify-center">
                {!resultData ? (
                  <div className="text-white/30 text-center">
                    <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select operands and click Calculate</p>
                  </div>
                ) : resultData.type === 'error' ? (
                  <div className="text-red-400 text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <p className="font-semibold mb-2">Calculation Error</p>
                    <p className="text-sm opacity-90">{resultData.value}</p>
                  </div>
                ) : resultData.type === 'matrix' ? (
                  <div className="w-full">
                    {resultData.details && <p className="text-center text-white/50 text-sm mb-4">{resultData.details}</p>}
                    <MatrixEditor matrix={resultData.value} onChange={() => {}} readonly title="Result Matrix" />
                  </div>
                ) : resultData.type === 'scalar' ? (
                  <div className="text-5xl font-light text-white tracking-tighter">
                    {resultData.value}
                  </div>
                ) : resultData.type === 'boolean' ? (
                  <div className={`text-4xl font-bold ${resultData.value ? 'text-green-400' : 'text-red-400'}`}>
                    {resultData.value ? 'True' : 'False'}
                  </div>
                ) : resultData.type === 'complex' ? (
                  <div className="w-full space-y-6 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin">
                    {Object.entries(resultData.value).map(([key, val]) => (
                      <div key={key} className="flex flex-col items-center">
                        <h4 className="text-white/60 text-sm font-semibold mb-2 uppercase tracking-widest">{key}</h4>
                        {Array.isArray(val) && Array.isArray(val[0]) ? (
                          <MatrixEditor matrix={val.map(r => r.map((c: any) => String(c)))} onChange={() => {}} readonly />
                        ) : (
                          <div className="bg-white/5 px-4 py-2 rounded font-mono text-sm border border-white/10 break-all text-center">
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
              <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white/80 font-semibold uppercase tracking-wider text-xs">Recent Operations</h3>
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear</button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {history.map(item => {
                    const op = OPERATIONS.find(o => o.id === item.operationId);
                    return (
                      <div key={item.id} className="w-full text-left p-3 rounded-xl bg-white/5 border border-transparent group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium text-sm">{op?.name}</span>
                          <span className="text-white/30 text-xs">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-white/50 text-xs">
                          Operands: {item.operandNames.join(', ')}
                        </div>
                      </div>
                    )
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
