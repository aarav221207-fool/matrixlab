import React, { useState } from 'react';
import {
  solve2DLinearProgramming,
  LPConstraint,
  LinearProgrammingResult
} from '../../math/linearProgrammingEngine';
import { InteractiveGraph, GraphFunction, GraphPoint, GraphPolygon } from '../../components/graphing/InteractiveGraph';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { Play, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LinearProgrammingMode: React.FC = () => {
  const [objective, setObjective] = useState<'maximize' | 'minimize'>('maximize');
  const [c1, setC1] = useState<number>(3);
  const [c2, setC2] = useState<number>(2);
  const [enforceNonNeg, setEnforceNonNeg] = useState<boolean>(true);

  const [constraints, setConstraints] = useState<LPConstraint[]>([
    { id: '1', a: 2, b: 1, sign: '<=', c: 18, label: '2x + y ≤ 18' },
    { id: '2', a: 2, b: 3, sign: '<=', c: 42, label: '2x + 3y ≤ 42' },
    { id: '3', a: 3, b: 1, sign: '<=', c: 24, label: '3x + y ≤ 24' }
  ]);

  const [result, setResult] = useState<LinearProgrammingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddConstraint = () => {
    const id = Date.now().toString();
    setConstraints([...constraints, { id, a: 1, b: 1, sign: '<=', c: 10 }]);
  };

  const handleRemoveConstraint = (id: string) => {
    setConstraints(constraints.filter(c => c.id !== id));
  };

  const handleUpdateConstraint = (id: string, updates: Partial<LPConstraint>) => {
    setConstraints(constraints.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleSolve = () => {
    setError(null);
    try {
      const res = solve2DLinearProgramming(c1, c2, objective, constraints, enforceNonNeg);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
      setResult(null);
    }
  };

  // Build graph elements
  const graphFunctions: GraphFunction[] = [];
  const graphPoints: GraphPoint[] = [];
  let graphPolygon: GraphPolygon | undefined;

  if (result) {
    // Constraint boundary lines
    const colors = ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA'];
    result.constraints.forEach((c, idx) => {
      if (Math.abs(c.b) > 1e-6) {
        graphFunctions.push({
          id: `c_${c.id}`,
          evalFn: (x: number) => (c.c - c.a * x) / c.b,
          color: colors[idx % colors.length],
          label: `${c.a}x + ${c.b}y = ${c.c}`,
          dash: [2, 2],
          width: 1.5
        });
      }
    });

    // Feasible corner points
    result.feasibleVertices.forEach(v => {
      graphPoints.push({
        x: v.x,
        y: v.y,
        label: `(${v.x}, ${v.y}) Z=${v.zValue}`,
        color: v.isOptimal ? '#E11D48' : '#38BDF8',
        size: v.isOptimal ? 8 : 5
      });
    });

    // Feasible polygon
    if (result.polygonPoints.length >= 3) {
      graphPolygon = {
        points: result.polygonPoints,
        fillColor: 'rgba(59, 130, 246, 0.22)',
        strokeColor: 'rgba(96, 165, 250, 0.8)'
      };
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
      <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-5">
        {/* Objective Function */}
        <div>
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
            Objective Function
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl bg-black/60 border border-white/10 p-1">
              <button
                onClick={() => setObjective('maximize')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  objective === 'maximize'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Maximize Z =
              </button>
              <button
                onClick={() => setObjective('minimize')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  objective === 'minimize'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Minimize Z =
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={c1}
                onChange={e => setC1(parseFloat(e.target.value) || 0)}
                className="w-16 p-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-center text-sm"
              />
              <span className="font-mono text-white/70">x +</span>
              <input
                type="number"
                value={c2}
                onChange={e => setC2(parseFloat(e.target.value) || 0)}
                className="w-16 p-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-center text-sm"
              />
              <span className="font-mono text-white/70">y</span>
            </div>
          </div>
        </div>

        {/* Constraints List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Linear Constraints
            </label>
            <button
              onClick={handleAddConstraint}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
            >
              <Plus size={14} /> Add Constraint
            </button>
          </div>

          <div className="space-y-2">
            {constraints.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/50 border border-white/5"
              >
                <span className="text-[10px] font-mono text-white/40 w-5 text-center">#{idx + 1}</span>
                <input
                  type="number"
                  value={c.a}
                  onChange={e => handleUpdateConstraint(c.id, { a: parseFloat(e.target.value) || 0 })}
                  className="w-16 p-2 rounded-xl bg-black/70 border border-white/10 text-white font-mono text-center text-xs"
                />
                <span className="text-xs font-mono text-white/60">x +</span>
                <input
                  type="number"
                  value={c.b}
                  onChange={e => handleUpdateConstraint(c.id, { b: parseFloat(e.target.value) || 0 })}
                  className="w-16 p-2 rounded-xl bg-black/70 border border-white/10 text-white font-mono text-center text-xs"
                />
                <span className="text-xs font-mono text-white/60">y</span>

                <select
                  value={c.sign}
                  onChange={e => handleUpdateConstraint(c.id, { sign: e.target.value as any })}
                  className="p-2 rounded-xl bg-black/70 border border-white/10 text-white font-mono text-xs"
                >
                  <option value="<=">≤</option>
                  <option value=">=">≥</option>
                  <option value="=">=</option>
                </select>

                <input
                  type="number"
                  value={c.c}
                  onChange={e => handleUpdateConstraint(c.id, { c: parseFloat(e.target.value) || 0 })}
                  className="w-16 p-2 rounded-xl bg-black/70 border border-white/10 text-white font-mono text-center text-xs"
                />

                <button
                  onClick={() => handleRemoveConstraint(c.id)}
                  className="p-2 text-white/40 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Non-negativity Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-white/80 cursor-pointer">
            <input
              type="checkbox"
              checked={enforceNonNeg}
              onChange={e => setEnforceNonNeg(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-black/50 border-white/20"
            />
            <span>Enforce Non-Negativity Constraints (x ≥ 0, y ≥ 0)</span>
          </label>
        </div>

        <button
          onClick={handleSolve}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Play size={14} fill="currentColor" /> Solve via Graphical Simplex & Feasible Polygon
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-400" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Status: {result.status.toUpperCase()}
                </h3>
              </div>
              {result.optimalValue !== undefined && (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-mono text-xs font-bold">
                  Optimal Z* = {result.optimalValue}
                </span>
              )}
            </div>

            {result.optimalVertex && (
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Optimal Corner Point (x*, y*)
                </div>
                <div className="font-mono text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-green-300">
                  x* = {result.optimalVertex.x}, y* = {result.optimalVertex.y} ⇒ {result.objective.toUpperCase()} Z = {result.optimalValue}
                </div>
              </div>
            )}

            {/* Corner Points Table */}
            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">
                Evaluated Corner Points (Extreme Vertices)
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/10 text-white/80 border-b border-white/10 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Vertex (x, y)</th>
                      <th className="p-3">Objective Value Z</th>
                      <th className="p-3 text-right">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.feasibleVertices.map((v, i) => (
                      <tr
                        key={i}
                        className={v.isOptimal ? 'bg-green-500/10 font-bold' : 'hover:bg-white/5'}
                      >
                        <td className="p-3 text-white/90">({v.x}, {v.y})</td>
                        <td className="p-3 text-blue-300">{v.zValue}</td>
                        <td className="p-3 text-right">
                          {v.isOptimal ? (
                            <span className="text-green-400">★ OPTIMAL</span>
                          ) : (
                            <span className="text-white/40">Feasible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <StepsViewer steps={result.steps} title="Linear Programming Simplex Steps" defaultOpen={true} />
          </div>

          <InteractiveGraph
            functions={graphFunctions}
            points={graphPoints}
            polygon={graphPolygon}
            initialXRange={[-2, 20]}
            initialYRange={[-2, 20]}
            title="Feasible Region Convex Polygon & Constraint Boundary Lines"
          />
        </div>
      )}
    </div>
  );
};
