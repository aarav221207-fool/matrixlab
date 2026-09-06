import React, { useState } from 'react';
import {
  calculateVectorOperations,
  gramSchmidt,
  computeBasisAndSpan,
  solveLeastSquares,
  VectorOperationsResult,
  GramSchmidtResult,
  BasisSpanResult,
  LeastSquaresResult
} from '../../math/linearAlgebraEngine';
import { MatrixEditor } from '../../components/MatrixEditor';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LinearAlgebraMode: React.FC = () => {
  const [subTab, setSubTab] = useState<'vectors' | 'gram-schmidt' | 'basis-span' | 'least-squares'>('vectors');

  // Vectors state
  const [vecUStr, setVecUStr] = useState('1, 2, 3');
  const [vecVStr, setVecVStr] = useState('2, -1, 1');
  const [vectorResult, setVectorResult] = useState<VectorOperationsResult | null>(null);

  // Gram Schmidt state
  const [gsInput, setGsInput] = useState('1, 1, 0\n1, 0, 2\n0, 1, 2');
  const [gsResult, setGsResult] = useState<GramSchmidtResult | null>(null);

  // Basis & Span state
  const [basisMatrix, setBasisMatrix] = useState<string[][]>([
    ['1', '2', '0', '1'],
    ['0', '1', '1', '0'],
    ['1', '3', '1', '1']
  ]);
  const [basisResult, setBasisResult] = useState<BasisSpanResult | null>(null);

  // Least squares state
  const [lsA, setLsA] = useState<string[][]>([
    ['1', '1'],
    ['1', '2'],
    ['1', '3']
  ]);
  const [lsBStr, setLsBStr] = useState('2, 3, 5');
  const [lsResult, setLsResult] = useState<LeastSquaresResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleComputeVector = () => {
    setError(null);
    try {
      const u = vecUStr.split(/[\s,]+/).filter(Boolean).map(Number);
      const v = vecVStr.split(/[\s,]+/).filter(Boolean).map(Number);
      const res = calculateVectorOperations(u, v);
      setVectorResult(res);
    } catch (e: any) {
      setError(e.message);
      setVectorResult(null);
    }
  };

  const handleComputeGS = () => {
    setError(null);
    try {
      const vectors = gsInput
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => l.split(/[\s,]+/).filter(Boolean).map(Number));
      const res = gramSchmidt(vectors);
      setGsResult(res);
    } catch (e: any) {
      setError(e.message);
      setGsResult(null);
    }
  };

  const handleComputeBasis = () => {
    setError(null);
    try {
      const A = basisMatrix.map(row => row.map(c => parseFloat(c) || 0));
      const res = computeBasisAndSpan(A);
      setBasisResult(res);
    } catch (e: any) {
      setError(e.message);
      setBasisResult(null);
    }
  };

  const handleComputeLS = () => {
    setError(null);
    try {
      const A = lsA.map(row => row.map(c => parseFloat(c) || 0));
      const b = lsBStr.split(/[\s,]+/).filter(Boolean).map(Number);
      const res = solveLeastSquares(A, b);
      setLsResult(res);
    } catch (e: any) {
      setError(e.message);
      setLsResult(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 glass-panel overflow-x-auto scrollbar-none">
        {[
          { id: 'vectors', label: 'Vector Operations' },
          { id: 'gram-schmidt', label: 'Gram-Schmidt' },
          { id: 'basis-span', label: 'Basis, Span & Null Space' },
          { id: 'least-squares', label: 'Least Squares' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setSubTab(t.id as any);
              setError(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap uppercase tracking-wider transition-all ${
              subTab === t.id
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vector Operations Sub-panel */}
      {subTab === 'vectors' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                  Vector u (e.g. 1, 2, 3)
                </label>
                <input
                  type="text"
                  value={vecUStr}
                  onChange={e => setVecUStr(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                  Vector v (e.g. 2, -1, 1)
                </label>
                <input
                  type="text"
                  value={vecVStr}
                  onChange={e => setVecVStr(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <button
              onClick={handleComputeVector}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" /> Compute Vector Operations
            </button>
          </div>

          {vectorResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Vector Geometry & Algebraic Metrics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Norm ||u||</div>
                  <div className="text-lg font-mono font-bold text-blue-300">{vectorResult.normU}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Norm ||v||</div>
                  <div className="text-lg font-mono font-bold text-blue-300">{vectorResult.normV}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Dot Product u · v</div>
                  <div className="text-lg font-mono font-bold text-green-400">{vectorResult.dotProduct}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Angle θ</div>
                  <div className="text-lg font-mono font-bold text-purple-300">{vectorResult.angleDeg}°</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Projection of v onto u</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">[{vectorResult.projectionVontoU.join(', ')}]</div>
                </div>
                {vectorResult.crossProduct && (
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Cross Product u × v</div>
                    <div className="text-sm font-mono font-bold text-amber-300">[{vectorResult.crossProduct.join(', ')}]</div>
                  </div>
                )}
              </div>

              <StepsViewer steps={vectorResult.steps} title="Vector Calculations Breakdown" defaultOpen={true} />
            </div>
          )}
        </div>
      )}

      {/* Gram-Schmidt Sub-panel */}
      {subTab === 'gram-schmidt' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                Input Vectors (one per line, comma or space separated)
              </label>
              <textarea
                value={gsInput}
                onChange={e => setGsInput(e.target.value)}
                rows={4}
                className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button
              onClick={handleComputeGS}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" /> Run Gram-Schmidt Orthogonalization
            </button>
          </div>

          {gsResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Orthogonal & Orthonormal Bases
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Orthogonal Vectors {'{uᵢ}'}
                  </div>
                  {gsResult.orthogonalVectors.map((v, i) => (
                    <div key={i} className="font-mono text-xs text-white/90">
                      u_{i + 1} = [ {v.join(', ')} ]
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-green-400">
                    Orthonormal Vectors {'{eᵢ}'} (Unit Length)
                  </div>
                  {gsResult.orthonormalVectors.map((v, i) => (
                    <div key={i} className="font-mono text-xs text-white/90">
                      e_{i + 1} = [ {v.join(', ')} ]
                    </div>
                  ))}
                </div>
              </div>

              <StepsViewer steps={gsResult.steps} title="Gram-Schmidt Step-by-Step Derivation" defaultOpen={true} />
            </div>
          )}
        </div>
      )}

      {/* Basis & Span Sub-panel */}
      {subTab === 'basis-span' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
                Matrix A (Rows and Columns)
              </label>
              <div className="flex justify-center overflow-x-auto py-2">
                <MatrixEditor matrix={basisMatrix} onChange={setBasisMatrix} />
              </div>
            </div>

            <button
              onClick={handleComputeBasis}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" /> Compute Basis, Rank & Null Space
            </button>
          </div>

          {basisResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Subspace Dimensions & Rank-Nullity
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                    Rank = {basisResult.rank}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                    Nullity = {basisResult.nullity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Column Space Col(A)
                  </div>
                  {basisResult.columnSpaceBasis.map((vec, i) => (
                    <div key={i} className="font-mono text-xs text-white/90">
                      c_{i + 1} = [{vec.join(', ')}]
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-green-400">
                    Row Space Row(A)
                  </div>
                  {basisResult.rowSpaceBasis.map((vec, i) => (
                    <div key={i} className="font-mono text-xs text-white/90">
                      r_{i + 1} = [{vec.join(', ')}]
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Null Space Null(A)
                  </div>
                  {basisResult.nullSpaceBasis.length > 0 ? (
                    basisResult.nullSpaceBasis.map((vec, i) => (
                      <div key={i} className="font-mono text-xs text-white/90">
                        n_{i + 1} = [{vec.join(', ')}]
                      </div>
                    ))
                  ) : (
                    <div className="font-mono text-xs text-white/40">Trivial space {'{0}'}</div>
                  )}
                </div>
              </div>

              <StepsViewer steps={basisResult.steps} title="Subspace Decomposition Steps" defaultOpen={true} />
            </div>
          )}
        </div>
      )}

      {/* Least Squares Sub-panel */}
      {subTab === 'least-squares' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
                  Overdetermined Matrix A (m × n)
                </label>
                <div className="flex justify-center overflow-x-auto py-1">
                  <MatrixEditor matrix={lsA} onChange={setLsA} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
                  Observation Vector b (length m)
                </label>
                <input
                  type="text"
                  value={lsBStr}
                  onChange={e => setLsBStr(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="e.g. 2, 3, 5"
                />
              </div>
            </div>

            <button
              onClick={handleComputeLS}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" /> Solve via Normal Equations (AᵀA)x = Aᵀb
            </button>
          </div>

          {lsResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Least Squares Approximate Solution
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                    Optimal Parameter Vector x̂
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-300">
                    [{lsResult.solution.join(', ')}]
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                    Residual Norm ||b - Ax̂||
                  </div>
                  <div className="text-xl font-mono font-bold text-green-400">
                    {lsResult.residualNorm}
                  </div>
                </div>
              </div>

              <StepsViewer steps={lsResult.steps} title="Least Squares Derivation Breakdown" defaultOpen={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
