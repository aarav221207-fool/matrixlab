import React, { useState } from 'react';
import { analyzeFunction, composeFunctions, FunctionAnalysis } from '../../math/functionsEngine';
import { InteractiveGraph, GraphFunction, GraphPoint } from '../../components/graphing/InteractiveGraph';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { MathRenderer } from '../../components/design-system/MathRenderer';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

export const FunctionCalculatorMode: React.FC = () => {
  const [funcStr, setFuncStr] = useState('(x^2 - 4)/(x - 1)');
  const [secondFuncStr, setSecondFuncStr] = useState('2*x + 1');
  const [analysis, setAnalysis] = useState<FunctionAnalysis | null>(null);
  const [composition, setComposition] = useState<{ fog: string; gof: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    setError(null);
    try {
      const res = analyzeFunction(funcStr);
      setAnalysis(res);

      if (secondFuncStr.trim()) {
        const fog = composeFunctions(funcStr, secondFuncStr, 'f_circ_g');
        const gof = composeFunctions(funcStr, secondFuncStr, 'g_circ_f');
        setComposition({ fog: fog.simplified, gof: gof.simplified });
      } else {
        setComposition(null);
      }
    } catch (e: any) {
      setError(e.message);
      setAnalysis(null);
      setComposition(null);
    }
  };

  const graphFunctions: GraphFunction[] = [];
  const graphPoints: GraphPoint[] = [];

  if (analysis) {
    graphFunctions.push({
      id: 'f',
      expression: analysis.expression,
      color: '#60A5FA',
      label: `f(x) = ${analysis.expression}`
    });

    if (analysis.yIntercept !== undefined && !isNaN(Number(analysis.yIntercept))) {
      graphPoints.push({
        x: 0,
        y: Number(analysis.yIntercept),
        label: `y-int (0, ${analysis.yIntercept})`,
        color: '#34D399'
      });
    }

    for (const r of analysis.roots) {
      const numR = Number(r);
      if (!isNaN(numR)) {
        graphPoints.push({
          x: numR,
          y: 0,
          label: `root (${r}, 0)`,
          color: '#F87171'
        });
      }
    }

    for (const cp of analysis.criticalPoints) {
      graphPoints.push({
        x: cp.x,
        y: cp.y,
        label: `${cp.type} (${cp.x}, ${cp.y})`,
        color: '#FBBF24'
      });
    }
  }

  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input panel */}
      <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
              Primary Function f(x)
            </label>
            <input
              type="text"
              value={funcStr}
              onChange={e => setFuncStr(e.target.value)}
              placeholder="e.g. (x^2 - 4)/(x - 1) or sqrt(4 - x^2)"
              className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
              Secondary Function g(x) (For Composition f ∘ g)
            </label>
            <input
              type="text"
              value={secondFuncStr}
              onChange={e => setSecondFuncStr(e.target.value)}
              placeholder="e.g. 2*x + 1"
              className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Play size={14} fill="currentColor" /> Analyze Function Properties & Graph
        </button>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider pb-3 border-b border-white/5">
              Domain, Range & Analytical Features
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">
                  Domain ℝ
                </div>
                <div className="text-sm font-mono font-bold text-blue-300">{analysis.domain}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">
                  Estimated Range
                </div>
                <div className="text-sm font-mono font-bold text-purple-300">{analysis.range}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">
                  Parity / Symmetry
                </div>
                <div className="text-sm font-mono font-bold text-green-300 uppercase">
                  {analysis.symmetry}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">
                  y-Intercept (x = 0)
                </div>
                <div className="text-sm font-mono font-bold text-cyan-300">
                  {analysis.yIntercept !== null ? `(0, ${analysis.yIntercept})` : 'None / Undefined'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">
                  Real Roots (x-Intercepts)
                </div>
                <div className="text-sm font-mono font-bold text-amber-300">
                  {analysis.roots.length > 0 ? analysis.roots.join(', ') : 'None in sample range'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">
                  Asymptotes
                </div>
                <div className="text-xs font-mono font-bold text-red-300">
                  {analysis.asymptotes.vertical.length > 0 ? `VA: x = ${analysis.asymptotes.vertical.join(', ')}` : ''}
                  {analysis.asymptotes.horizontal.length > 0 ? ` HA: y = ${analysis.asymptotes.horizontal.join(', ')}` : ''}
                  {!analysis.asymptotes.vertical.length && !analysis.asymptotes.horizontal.length ? 'None identified' : ''}
                </div>
              </div>
            </div>

            {/* Function Composition */}
            {composition && (
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Function Composition
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-wrap items-center gap-2">
                    <span className="text-white/50 font-mono">(f ∘ g)(x) =</span>
                    <div className="text-blue-300">
                      <MathRenderer expression={composition.fog} displayMode={false} size="sm" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-wrap items-center gap-2">
                    <span className="text-white/50 font-mono">(g ∘ f)(x) =</span>
                    <div className="text-purple-300">
                      <MathRenderer expression={composition.gof} displayMode={false} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <StepsViewer steps={analysis.steps} title="Function Analysis Breakdown" defaultOpen={true} />
          </div>

          <InteractiveGraph
            functions={graphFunctions}
            points={graphPoints}
            title={`Interactive Graph of f(x) = ${analysis.expression}`}
          />
        </div>
      )}
    </div>
  );
};
