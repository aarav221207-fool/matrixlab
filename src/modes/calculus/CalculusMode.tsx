import React, { useState } from 'react';
import {
  calculateDerivative,
  calculatePartialDerivatives,
  calculateTaylorSeries,
  calculateLimit,
  DerivativeResult,
  TaylorSeriesResult,
  LimitResult
} from '../../math/calculusEngine';
import { InteractiveGraph, GraphFunction } from '../../components/graphing/InteractiveGraph';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { CalculatorInput } from '../../components/design-system/CalculatorInput';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';

export const CalculusMode: React.FC = () => {
  const [tab, setTab] = useState<'derivative' | 'limit' | 'partials' | 'taylor'>('derivative');

  // Derivative state
  const [functionStr, setFunctionStr] = useState('x^3 - 3*x + 1');
  const [variable, setVariable] = useState('x');
  const [order, setOrder] = useState<number>(1);
  const [evalPointStr, setEvalPointStr] = useState('2');
  const [derivResult, setDerivResult] = useState<DerivativeResult | null>(() => {
    try {
      return calculateDerivative('x^3 - 3*x + 1', 'x', 1, 2);
    } catch {
      return null;
    }
  });

  // Limit state
  const [limitExpr, setLimitExpr] = useState('sin(x)/x');
  const [limitTarget, setLimitTarget] = useState('0');
  const [limitDir, setLimitDir] = useState<'both' | 'left' | 'right'>('both');
  const [limitResult, setLimitResult] = useState<LimitResult | null>(() => {
    try {
      return calculateLimit('sin(x)/x', 'x', '0', 'both');
    } catch {
      return null;
    }
  });

  // Partials state
  const [multivarStr, setMultivarStr] = useState('x^2*y + sin(x*y)');
  const [partialResult, setPartialResult] = useState<{ fx: string; fy: string; gradient: string; steps: string[] } | null>(null);

  // Taylor state
  const [taylorStr, setTaylorStr] = useState('sin(x)');
  const [taylorPoint, setTaylorPoint] = useState<number>(0);
  const [taylorOrder, setTaylorOrder] = useState<number>(4);
  const [taylorResult, setTaylorResult] = useState<TaylorSeriesResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleComputeDerivative = () => {
    setError(null);
    try {
      const evalPoint = evalPointStr.trim() ? parseFloat(evalPointStr) : undefined;
      const res = calculateDerivative(functionStr, variable, order, evalPoint);
      setDerivResult(res);
    } catch (e: any) {
      setError(e.message);
      setDerivResult(null);
    }
  };

  const handleComputeLimit = () => {
    setError(null);
    try {
      const res = calculateLimit(limitExpr, 'x', limitTarget, limitDir);
      setLimitResult(res);
    } catch (e: any) {
      setError(e.message);
      setLimitResult(null);
    }
  };

  const handleComputePartials = () => {
    setError(null);
    try {
      const res = calculatePartialDerivatives(multivarStr);
      setPartialResult(res);
    } catch (e: any) {
      setError(e.message);
      setPartialResult(null);
    }
  };

  const handleComputeTaylor = () => {
    setError(null);
    try {
      const res = calculateTaylorSeries(taylorStr, 'x', taylorPoint, taylorOrder);
      setTaylorResult(res);
    } catch (e: any) {
      setError(e.message);
      setTaylorResult(null);
    }
  };

  // Build graphs
  const graphFunctions: GraphFunction[] = [];
  if (tab === 'derivative' && derivResult) {
    graphFunctions.push({
      id: 'original',
      expression: derivResult.expression,
      color: '#60A5FA',
      label: `f(x) = ${derivResult.expression}`
    });
    graphFunctions.push({
      id: 'derivative',
      expression: derivResult.simplified,
      color: '#34D399',
      label: `f'${order > 1 ? `^(${order})` : ''}(x) = ${derivResult.simplified}`,
      dash: [4, 4]
    });
  } else if (tab === 'limit') {
    graphFunctions.push({
      id: 'limitFunction',
      expression: limitExpr,
      color: '#60A5FA',
      label: `f(x) = ${limitExpr}`
    });
  } else if (tab === 'taylor' && taylorResult) {
    graphFunctions.push({
      id: 'original',
      expression: taylorResult.expression,
      color: '#60A5FA',
      label: `f(x) = ${taylorResult.expression}`
    });
    graphFunctions.push({
      id: 'taylor',
      expression: taylorResult.series,
      color: '#F472B6',
      label: `Taylor P${taylorResult.order}(x)`,
      dash: [3, 3]
    });
  }

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Calculus"
        title="Calculus & Analysis"
        description="Compute analytical and nth-order derivatives, two-sided and one-sided limits, multivariable gradients, and polynomial Taylor/Maclaurin series expansions."
      />

      {/* Sub tabs with clean horizontal indicator */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'derivative', label: 'Derivatives & nth Order' },
          { id: 'limit', label: 'Limits (lim x→c)' },
          { id: 'partials', label: 'Multivariable Partials & Gradient' },
          { id: 'taylor', label: 'Taylor & Maclaurin Series' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id as any);
              setError(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Derivative Tab */}
      {tab === 'derivative' && (
        <div className="space-y-6">
          <CalculatorInput
            label="Single-Variable Function f(x)"
            prefix="f(x) ="
            value={functionStr}
            onChange={setFunctionStr}
            onSubmit={handleComputeDerivative}
            placeholder="e.g. x^3 - 3*x + 1, sin(2*x), x*exp(-x)"
            buttonLabel="Differentiate"
            error={error}
            secondaryInputs={
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Order:</span>
                  {[1, 2, 3, 4].map(o => (
                    <button
                      key={o}
                      onClick={() => setOrder(o)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        order === o
                          ? 'bg-blue-600/30 border-blue-500/40 text-blue-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {o === 1 ? "1st (f')" : o === 2 ? "2nd (f'')" : `${o}th`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Evaluate at x =</span>
                  <input
                    type="text"
                    value={evalPointStr}
                    onChange={e => setEvalPointStr(e.target.value)}
                    placeholder="optional"
                    className="w-20 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            }
          />

          {derivResult && (
            <>
              <ResultPanel
                title="DERIVATIVE RESULT"
                result={`d${order > 1 ? `^${order}` : ''}/dx [ ${derivResult.expression} ] = ${derivResult.simplified}`}
                subtitle={
                  derivResult.evaluationAtPoint !== undefined
                    ? `Evaluated at x = ${evalPointStr}: value = ${derivResult.evaluationAtPoint.value}`
                    : undefined
                }
                secondaryResults={
                  derivResult.evaluationAtPoint !== undefined
                    ? [
                        { label: `f'${order > 1 ? `^(${order})` : ''}(${evalPointStr})`, value: derivResult.evaluationAtPoint.value },
                        { label: 'Derivative Order', value: order },
                        { label: 'Variable', value: variable }
                      ]
                    : undefined
                }
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Differentiation Step Derivations"
                  steps={derivResult.steps.map((st, i) => ({
                    stepNumber: i + 1,
                    title: st.title,
                    rule: st.rule,
                    expression: st.expression,
                    transformation: st.transformation,
                    explanation: st.explanation,
                    type: st.type
                  }))}
                  defaultOpen={true}
                />
              )}

              <InteractiveGraph
                functions={graphFunctions}
                title={`Function and Derivative Plot: ${derivResult.expression}`}
              />
            </>
          )}
        </div>
      )}

      {/* 2. Limit Tab (NEW!) */}
      {tab === 'limit' && (
        <div className="space-y-6">
          <CalculatorInput
            label="Expression for Limit"
            prefix="f(x) ="
            value={limitExpr}
            onChange={setLimitExpr}
            onSubmit={handleComputeLimit}
            placeholder="e.g. sin(x)/x, (x^2 - 4)/(x - 2), (1 + 1/x)^x"
            buttonLabel="Compute Limit"
            error={error}
            secondaryInputs={
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">As x approaches c =</span>
                  <input
                    type="text"
                    value={limitTarget}
                    onChange={e => setLimitTarget(e.target.value)}
                    placeholder="0, 2, Infinity"
                    className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Direction:</span>
                  {[
                    { id: 'both', label: 'Two-sided' },
                    { id: 'left', label: 'Left (c⁻)' },
                    { id: 'right', label: 'Right (c⁺)' }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setLimitDir(d.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        limitDir === d.id
                          ? 'bg-blue-600/30 border-blue-500/40 text-blue-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          {limitResult && (
            <>
              <ResultPanel
                title="LIMIT RESULT"
                result={`lim_{x → ${limitResult.target}${limitResult.direction === 'left' ? '⁻' : limitResult.direction === 'right' ? '⁺' : ''}} [ ${limitResult.expression} ] = ${limitResult.result}`}
                subtitle={`Evaluation at point c = ${limitResult.target}`}
                badge={limitResult.direction === 'both' ? 'Two-Sided Limit' : `${limitResult.direction.toUpperCase()} Limit`}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Limit Derivation Steps"
                  steps={limitResult.steps}
                  defaultOpen={true}
                />
              )}

              <InteractiveGraph
                functions={graphFunctions}
                title={`Limit Neighborhood Plot: ${limitExpr}`}
              />
            </>
          )}
        </div>
      )}

      {/* 3. Partials Tab */}
      {tab === 'partials' && (
        <div className="space-y-6">
          <CalculatorInput
            label="Multivariable Function f(x, y)"
            prefix="f(x, y) ="
            value={multivarStr}
            onChange={setMultivarStr}
            onSubmit={handleComputePartials}
            placeholder="e.g. x^2*y + sin(x*y), x*exp(x*y)"
            buttonLabel="Compute Partials"
            error={error}
          />

          {partialResult && (
            <>
              <ResultPanel
                title="PARTIAL DERIVATIVES & GRADIENT"
                result={`∇f(x, y) = ${partialResult.gradient}`}
                subtitle={`First-order multivariable partial differential rates`}
                secondaryResults={[
                  { label: '∂f/∂x', value: partialResult.fx },
                  { label: '∂f/∂y', value: partialResult.fy }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Partial Differentiation Steps"
                  steps={partialResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 4. Taylor Tab */}
      {tab === 'taylor' && (
        <div className="space-y-6">
          <CalculatorInput
            label="Function for Taylor Expansion f(x)"
            prefix="f(x) ="
            value={taylorStr}
            onChange={setTaylorStr}
            onSubmit={handleComputeTaylor}
            placeholder="e.g. sin(x), exp(x), ln(1+x)"
            buttonLabel="Expand Taylor Series"
            error={error}
            secondaryInputs={
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Expansion Center a =</span>
                  <input
                    type="number"
                    value={taylorPoint}
                    onChange={e => setTaylorPoint(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-500">{taylorPoint === 0 ? '(Maclaurin)' : ''}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Polynomial Order n =</span>
                  {[2, 3, 4, 5, 6].map(ord => (
                    <button
                      key={ord}
                      onClick={() => setTaylorOrder(ord)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        taylorOrder === ord
                          ? 'bg-blue-600/30 border-blue-500/40 text-blue-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ord}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          {taylorResult && (
            <>
              <ResultPanel
                title="TAYLOR POLYNOMIAL"
                result={`P_${taylorResult.order}(x) = ${taylorResult.series}`}
                subtitle={`Taylor polynomial approximation of ${taylorResult.expression} centered at a = ${taylorResult.point}`}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Polynomial Expansion Derivation"
                  steps={taylorResult.steps}
                  defaultOpen={true}
                />
              )}

              <InteractiveGraph
                functions={graphFunctions}
                title={`Taylor Polynomial Approximation: ${taylorResult.expression} vs P_${taylorResult.order}(x)`}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
