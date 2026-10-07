import React, { useState } from 'react';
import {
  computeSummaryStatistics,
  computeLinearRegression,
  computeBinomial,
  computeNormal,
  SummaryStatistics,
  BivariateStatistics,
  BinomialDistributionResult,
  NormalDistributionResult
} from '../../math/statisticsEngine';
import { InteractiveGraph, GraphFunction, GraphPoint } from '../../components/graphing/InteractiveGraph';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { MathRenderer } from '../../components/design-system/MathRenderer';
import { Play, AlertCircle } from 'lucide-react';

export const ProbabilityStatsMode: React.FC = () => {
  const [subTab, setSubTab] = useState<'summary' | 'regression' | 'distributions'>('summary');

  // Summary stats state
  const [dataStr, setDataStr] = useState('12, 15, 14, 10, 18, 20, 15, 16, 22, 19, 45');
  const [summaryResult, setSummaryResult] = useState<SummaryStatistics | null>(null);

  // Regression state
  const [pointsStr, setPointsStr] = useState('(1, 2.5), (2, 3.8), (3, 5.1), (4, 6.9), (5, 8.4), (6, 9.7)');
  const [regressionResult, setRegressionResult] = useState<BivariateStatistics | null>(null);

  // Distributions state
  const [distType, setDistType] = useState<'binomial' | 'normal'>('normal');
  const [binomN, setBinomN] = useState<number>(10);
  const [binomP, setBinomP] = useState<number>(0.5);
  const [binomK, setBinomK] = useState<number>(6);
  const [binomResult, setBinomResult] = useState<BinomialDistributionResult | null>(null);

  const [normMean, setNormMean] = useState<number>(0);
  const [normStd, setNormStd] = useState<number>(1);
  const [normX, setNormX] = useState<number>(1.96);
  const [normResult, setNormResult] = useState<NormalDistributionResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleComputeSummary = () => {
    setError(null);
    try {
      const arr = dataStr.split(/[\s,]+/).filter(Boolean).map(Number);
      const res = computeSummaryStatistics(arr);
      setSummaryResult(res);
    } catch (e: any) {
      setError(e.message);
      setSummaryResult(null);
    }
  };

  const handleComputeRegression = () => {
    setError(null);
    try {
      const matches = pointsStr.match(/\(([^,)]+),\s*([^)]+)\)/g);
      if (!matches) throw new Error('Format coordinate points as (x, y), (x, y)');
      const pts = matches.map(m => {
        const clean = m.replace(/[()]/g, '').split(',');
        return { x: parseFloat(clean[0]), y: parseFloat(clean[1]) };
      });
      const res = computeLinearRegression(pts);
      setRegressionResult(res);
    } catch (e: any) {
      setError(e.message);
      setRegressionResult(null);
    }
  };

  const handleComputeDist = () => {
    setError(null);
    try {
      if (distType === 'binomial') {
        const res = computeBinomial(binomN, binomP, binomK);
        setBinomResult(res);
      } else {
        const res = computeNormal(normMean, normStd, normX);
        setNormResult(res);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Regression graph
  const regFunctions: GraphFunction[] = [];
  const regPoints: GraphPoint[] = [];
  if (regressionResult) {
    regFunctions.push({
      id: 'reg-line',
      evalFn: (x: number) => regressionResult.slope * x + regressionResult.intercept,
      color: '#60A5FA',
      label: regressionResult.regressionEquation
    });
    for (const p of regressionResult.points) {
      regPoints.push({ x: p.x, y: p.y, color: '#34D399', size: 5 });
    }
  }

  // Normal dist graph
  const normFunctions: GraphFunction[] = [];
  const normPoints: GraphPoint[] = [];
  if (normResult) {
    normFunctions.push({
      id: 'bell-curve',
      evalFn: (x: number) => {
        const z = (x - normResult.mean) / normResult.stdDev;
        return (1 / (normResult.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
      },
      color: '#818CF8',
      label: `N(μ = ${normResult.mean}, σ = ${normResult.stdDev})`
    });
    normPoints.push({
      x: normResult.x,
      y: normResult.pdf,
      label: `x = ${normResult.x}`,
      color: '#F43F5E',
      size: 6
    });
  }

  return (
    <div className="w-full space-y-6">
      {/* Sub tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 glass-panel overflow-x-auto min-w-0 max-w-full scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'summary', label: 'Summary & Descriptive Statistics' },
          { id: 'regression', label: 'Linear Regression & Correlation' },
          { id: 'distributions', label: 'Probability Distributions (Normal & Binomial)' }
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

      {/* Summary Stats Subtab */}
      {subTab === 'summary' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                Data Sample (comma or space separated numbers)
              </label>
              <textarea
                value={dataStr}
                onChange={e => setDataStr(e.target.value)}
                rows={3}
                className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={handleComputeSummary}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={14} fill="currentColor" /> Compute Mean, Median, Variance, Quartiles & Outliers
            </button>
          </div>

          {summaryResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Descriptive Statistical Profile (n = {summaryResult.count})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Mean (x̄)</div>
                  <div className="text-xl font-mono font-bold text-blue-300">{summaryResult.mean}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Median (Q2)</div>
                  <div className="text-xl font-mono font-bold text-green-300">{summaryResult.median}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Sample Std Dev (s)</div>
                  <div className="text-xl font-mono font-bold text-purple-300">{summaryResult.sampleStdDev}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Sample Variance (s²)</div>
                  <div className="text-xl font-mono font-bold text-cyan-300">{summaryResult.sampleVariance}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Q1 (25th %)</div>
                  <div className="text-sm font-mono font-bold text-white/90">{summaryResult.q1}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Q3 (75th %)</div>
                  <div className="text-sm font-mono font-bold text-white/90">{summaryResult.q3}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">IQR (Q3 - Q1)</div>
                  <div className="text-sm font-mono font-bold text-amber-300">{summaryResult.iqr}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Range (Max - Min)</div>
                  <div className="text-sm font-mono font-bold text-white/90">{summaryResult.range}</div>
                </div>
              </div>

              {/* Outliers */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Outlier Detection (1.5 × IQR Rule)
                </div>
                <div className="text-xs font-mono">
                  {summaryResult.outliers.length > 0 ? (
                    <span className="text-red-400 font-bold">
                      Detected Outliers: {summaryResult.outliers.join(', ')}
                    </span>
                  ) : (
                    <span className="text-green-400 font-semibold">No outliers found in dataset</span>
                  )}
                </div>
              </div>

              <StepsViewer steps={summaryResult.steps} title="Statistical Formulas & Step-by-Step Breakdown" defaultOpen={true} />
            </div>
          )}
        </div>
      )}

      {/* Regression Subtab */}
      {subTab === 'regression' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                Data Points (x, y) pairs
              </label>
              <textarea
                value={pointsStr}
                onChange={e => setPointsStr(e.target.value)}
                rows={3}
                placeholder="e.g. (1, 2), (2, 4), (3, 5)"
                className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={handleComputeRegression}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={14} fill="currentColor" /> Compute Linear Regression & Trend Line
            </button>
          </div>

          {regressionResult && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                    Best-Fit Regression Line
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-200">
                    <MathRenderer expression={regressionResult.regressionEquation} displayMode={true} size="lg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Slope (m)</div>
                    <div className="text-lg font-mono font-bold text-blue-300">{regressionResult.slope}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Intercept (b)</div>
                    <div className="text-lg font-mono font-bold text-green-300">{regressionResult.intercept}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Correlation (r)</div>
                    <div className="text-lg font-mono font-bold text-purple-300">{regressionResult.r}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">R² Metric</div>
                    <div className="text-lg font-mono font-bold text-cyan-300">{regressionResult.rSquared}</div>
                  </div>
                </div>

                <StepsViewer steps={regressionResult.steps} title="Regression Derivation Breakdown" defaultOpen={true} />
              </div>

              <InteractiveGraph
                functions={regFunctions}
                points={regPoints}
                title="Bivariate Data Points & Linear Regression Trend Line"
              />
            </div>
          )}
        </div>
      )}

      {/* Distributions Subtab */}
      {subTab === 'distributions' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDistType('normal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  distType === 'normal'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                Normal Gaussian Distribution N(μ, σ)
              </button>
              <button
                onClick={() => setDistType('binomial')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  distType === 'binomial'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                Binomial Distribution B(n, p)
              </button>
            </div>

            {distType === 'normal' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Mean (μ)</label>
                  <input
                    type="number"
                    value={normMean}
                    onChange={e => setNormMean(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Std Dev (σ &gt; 0)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.5"
                    value={normStd}
                    onChange={e => setNormStd(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Target Value (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={normX}
                    onChange={e => setNormX(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Trials (n)</label>
                  <input
                    type="number"
                    min="1"
                    value={binomN}
                    onChange={e => setBinomN(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Success Prob (p)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={binomP}
                    onChange={e => setBinomP(parseFloat(e.target.value) || 0.5)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Successes (k)</label>
                  <input
                    type="number"
                    min="0"
                    value={binomK}
                    onChange={e => setBinomK(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleComputeDist}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={14} fill="currentColor" /> Compute Probabilities & Density
            </button>
          </div>

          {distType === 'normal' && normResult && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">z-Score</div>
                    <div className="text-xl font-mono font-bold text-blue-300">{normResult.zScore}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Density f(x)</div>
                    <div className="text-xl font-mono font-bold text-purple-300">{normResult.pdf}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">P(X ≤ x)</div>
                    <div className="text-xl font-mono font-bold text-green-300">{normResult.cdfLessOrEqual}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">P(X &gt; x)</div>
                    <div className="text-xl font-mono font-bold text-cyan-300">{normResult.cdfGreater}</div>
                  </div>
                </div>

                <StepsViewer steps={normResult.steps} title="Normal CDF Approximation Breakdown" defaultOpen={true} />
              </div>

              <InteractiveGraph
                functions={normFunctions}
                points={normPoints}
                initialXRange={[normResult.mean - 4 * normResult.stdDev, normResult.mean + 4 * normResult.stdDev]}
                initialYRange={[0, 1 / (normResult.stdDev * Math.sqrt(2 * Math.PI)) * 1.2]}
                title="Gaussian Bell Curve N(μ, σ)"
              />
            </div>
          )}

          {distType === 'binomial' && binomResult && (
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">P(X = k)</div>
                  <div className="text-xl font-mono font-bold text-blue-300">{binomResult.probExact}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">P(X ≤ k)</div>
                  <div className="text-xl font-mono font-bold text-green-300">{binomResult.probAtMost}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Mean μ = n·p</div>
                  <div className="text-xl font-mono font-bold text-cyan-300">{binomResult.mean}</div>
                </div>
              </div>

              <StepsViewer steps={binomResult.steps} title="Binomial Formula Steps" defaultOpen={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
