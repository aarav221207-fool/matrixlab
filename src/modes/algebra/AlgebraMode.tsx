import React, { useState } from 'react';
import {
  solveQuadratic,
  solveLinearEquation,
  simplifyExpression,
  QuadraticResult,
  EquationSolution
} from '../../math/algebraEngine';
import { InteractiveGraph, GraphFunction, GraphPoint } from '../../components/graphing/InteractiveGraph';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { MathRenderer } from '../../components/design-system/MathRenderer';
import { Play, AlertCircle } from 'lucide-react';

export const AlgebraMode: React.FC = () => {
  const [subTab, setSubTab] = useState<'quadratic' | 'linear' | 'simplify'>('quadratic');

  // Quadratic state
  const [quadA, setQuadA] = useState('1');
  const [quadB, setQuadB] = useState('-5');
  const [quadC, setQuadC] = useState('6');
  const [quadResult, setQuadResult] = useState<QuadraticResult | null>(null);

  // Linear state
  const [linEq, setLinEq] = useState('3*x - 7 = 2*x + 5');
  const [linResult, setLinResult] = useState<EquationSolution | null>(null);

  // Simplify state
  const [exprToSimplify, setExprToSimplify] = useState('(x + 2)^2 - (x - 2)^2');
  const [simplifiedRes, setSimplifiedRes] = useState<{ simplified: string; steps: string[] } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleSolveQuad = () => {
    setError(null);
    try {
      const a = parseFloat(quadA);
      const b = parseFloat(quadB);
      const c = parseFloat(quadC);
      const res = solveQuadratic(a, b, c);
      setQuadResult(res);
    } catch (e: any) {
      setError(e.message);
      setQuadResult(null);
    }
  };

  const handleSolveLinear = () => {
    setError(null);
    try {
      const res = solveLinearEquation(linEq);
      setLinResult(res);
    } catch (e: any) {
      setError(e.message);
      setLinResult(null);
    }
  };

  const handleSimplify = () => {
    setError(null);
    try {
      const res = simplifyExpression(exprToSimplify);
      setSimplifiedRes(res);
    } catch (e: any) {
      setError(e.message);
      setSimplifiedRes(null);
    }
  };

  const graphFunctions: GraphFunction[] = [];
  const graphPoints: GraphPoint[] = [];

  if (quadResult) {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    graphFunctions.push({
      id: 'parabola',
      expression: `${a}*x^2 + ${b}*x + ${c}`,
      color: '#60A5FA',
      label: `y = ${a}x² + ${b}x + ${c}`
    });

    graphPoints.push({
      x: quadResult.vertex.x,
      y: quadResult.vertex.y,
      label: `Vertex (${quadResult.vertex.x}, ${quadResult.vertex.y})`,
      color: '#34D399'
    });

    if (quadResult.rootType !== 'two_complex_conjugate') {
      quadResult.roots.forEach((r, idx) => {
        graphPoints.push({ x: r.real, y: 0, label: `Root ${idx + 1} (${r.formatted})`, color: '#F87171' });
      });
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 glass-panel overflow-x-auto min-w-0 max-w-full scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'quadratic', label: 'Quadratic Equation Solver (ax² + bx + c = 0)' },
          { id: 'linear', label: 'Linear Equation Solver' },
          { id: 'simplify', label: 'Algebraic Simplification' }
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

      {/* Quadratic Subtab */}
      {subTab === 'quadratic' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
              Quadratic Coefficients: ax² + bx + c = 0
            </label>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono text-white/40 block mb-1">Coefficient a (≠ 0)</label>
                <input
                  type="number"
                  value={quadA}
                  onChange={e => setQuadA(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-white/40 block mb-1">Coefficient b</label>
                <input
                  type="number"
                  value={quadB}
                  onChange={e => setQuadB(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-white/40 block mb-1">Constant c</label>
                <input
                  type="number"
                  value={quadC}
                  onChange={e => setQuadC(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <button
              onClick={handleSolveQuad}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={14} fill="currentColor" /> Solve Quadratic with Discriminant Δ & Vertex Form
            </button>
          </div>

          {quadResult && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    Roots Classification: {quadResult.rootType.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                    Δ = {quadResult.discriminant}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      Solutions (Roots)
                    </div>
                    {quadResult.roots.map((r, i) => (
                      <div key={i} className="text-blue-300">
                        <MathRenderer
                          expression={`x_{${i + 1}} = ${r.formatted}`}
                          displayMode={false}
                          size="lg"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      Vertex & Symmetry
                    </div>
                    <div className="font-mono text-base font-bold text-green-300">
                      Vertex: ({quadResult.vertex.x}, {quadResult.vertex.y})
                    </div>
                    <div className="font-mono text-xs text-white/60">
                      Axis of Symmetry: x = {quadResult.axisOfSymmetry}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 text-purple-300 flex items-center gap-2">
                  <span className="text-xs text-white/50 uppercase tracking-wider font-mono">Factored Form:</span>
                  <MathRenderer expression={quadResult.factoredForm} displayMode={false} size="md" />
                </div>

                <StepsViewer steps={[...quadResult.stepsFormula, '', ...quadResult.stepsCompletingSquare]} title="Quadratic Formula & Completing the Square Steps" defaultOpen={true} />
              </div>

              <InteractiveGraph
                functions={graphFunctions}
                points={graphPoints}
                title="Parabola Curve with Vertex & Roots"
              />
            </div>
          )}
        </div>
      )}

      {/* Linear Subtab */}
      {subTab === 'linear' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                Linear Equation (e.g. 3*x - 7 = 2*x + 5)
              </label>
              <input
                type="text"
                value={linEq}
                onChange={e => setLinEq(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={handleSolveLinear}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={14} fill="currentColor" /> Solve Linear Equation
            </button>
          </div>

          {linResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Solution</div>
                <div className="text-green-300">
                  <MathRenderer expression={linResult.solution} displayMode={true} size="lg" />
                </div>
              </div>

              <StepsViewer steps={linResult.steps} title="Algebraic Isolation Steps" defaultOpen={true} />
            </div>
          )}
        </div>
      )}

      {/* Simplify Subtab */}
      {subTab === 'simplify' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                Algebraic Expression to Simplify
              </label>
              <input
                type="text"
                value={exprToSimplify}
                onChange={e => setExprToSimplify(e.target.value)}
                placeholder="e.g. (x + 2)^2 - (x - 2)^2"
                className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={handleSimplify}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={14} fill="currentColor" /> Simplify Polynomial Expression
            </button>
          </div>

          {simplifiedRes && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Simplified Expression</div>
                <div className="text-blue-300">
                  <MathRenderer expression={simplifiedRes.simplified} displayMode={true} size="lg" />
                </div>
              </div>

              <StepsViewer steps={simplifiedRes.steps} title="Simplification Steps" defaultOpen={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
