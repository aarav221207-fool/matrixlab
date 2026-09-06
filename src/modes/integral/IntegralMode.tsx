import React, { useState } from 'react';
import { calculateIntegral, IntegralResult } from '../../math/calculusEngine';
import { InteractiveGraph, GraphFunction, GraphPoint } from '../../components/graphing/InteractiveGraph';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { CalculatorInput } from '../../components/design-system/CalculatorInput';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';

const PRESETS = [
  { label: '3x² + 2x + 1 (Polynomial)', value: '3*x^2 + 2*x + 1' },
  { label: 'sin(x) (Trig)', value: 'sin(x)' },
  { label: 'e^(2x) (Exponential)', value: 'exp(2*x)' },
  { label: '1/x (Logarithmic)', value: '1/x' },
  { label: 'x * cos(x) (Product)', value: 'x * cos(x)' }
];

export const IntegralMode: React.FC = () => {
  const [type, setType] = useState<'indefinite' | 'definite'>('indefinite');
  const [integrandStr, setIntegrandStr] = useState('3*x^2 + 2*x + 1');
  const [lowerBoundStr, setLowerBoundStr] = useState('0');
  const [upperBoundStr, setUpperBoundStr] = useState('2');

  const [result, setResult] = useState<IntegralResult | null>(() => {
    try {
      return calculateIntegral('3*x^2 + 2*x + 1', 'x', 'indefinite');
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleCompute = () => {
    setError(null);
    try {
      const lower = type === 'definite' ? parseFloat(lowerBoundStr) : undefined;
      const upper = type === 'definite' ? parseFloat(upperBoundStr) : undefined;
      const res = calculateIntegral(integrandStr, 'x', type, lower, upper);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
      setResult(null);
    }
  };

  const graphFunctions: GraphFunction[] = [];
  const graphPoints: GraphPoint[] = [];

  if (result) {
    graphFunctions.push({
      id: 'integrand',
      expression: result.integrand,
      color: '#60A5FA',
      label: `f(x) = ${result.integrand}`
    });

    if (result.type === 'definite' && result.lowerBound !== undefined && result.upperBound !== undefined) {
      graphPoints.push({ x: result.lowerBound, y: 0, label: `a = ${result.lowerBound}`, color: '#F87171' });
      graphPoints.push({ x: result.upperBound, y: 0, label: `b = ${result.upperBound}`, color: '#34D399' });
    }
  }

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Calculus"
        title="Integral Calculus"
        description="Compute symbolic indefinite antiderivatives with arbitrary constant + C, and evaluate definite integrals with Simpson quadrature numerical cross-verification."
        presets={PRESETS}
        onSelectPreset={(val) => {
          setIntegrandStr(val);
          try {
            const lower = type === 'definite' ? parseFloat(lowerBoundStr) : undefined;
            const upper = type === 'definite' ? parseFloat(upperBoundStr) : undefined;
            const res = calculateIntegral(val, 'x', type, lower, upper);
            setResult(res);
            setError(null);
          } catch {
            // keep input
          }
        }}
      />

      {/* Integral Type Selection */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setType('indefinite')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            type === 'indefinite'
              ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Indefinite Integral (∫ f(x) dx + C)
        </button>
        <button
          onClick={() => setType('definite')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            type === 'definite'
              ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Definite Integral (∫ₐᵇ f(x) dx)
        </button>
      </div>

      {/* Input Section */}
      <section className="space-y-4">
        <CalculatorInput
          label="Integrand Function f(x)"
          prefix={type === 'definite' ? `∫_{${lowerBoundStr}}^{${upperBoundStr}}` : '∫'}
          value={integrandStr}
          onChange={setIntegrandStr}
          onSubmit={handleCompute}
          placeholder="e.g. 3*x^2 + 2*x + 1, sin(x), exp(2*x)"
          buttonLabel="Integrate"
          error={error}
          secondaryInputs={
            type === 'definite' ? (
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Lower bound a =</span>
                  <input
                    type="number"
                    value={lowerBoundStr}
                    onChange={e => setLowerBoundStr(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Upper bound b =</span>
                  <input
                    type="number"
                    value={upperBoundStr}
                    onChange={e => setUpperBoundStr(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : undefined
          }
        />
      </section>

      {/* Dominant Result */}
      {result && (
        <>
          <ResultPanel
            title="INTEGRATION RESULT"
            result={
              result.type === 'definite'
                ? `∫_{${result.lowerBound}}^{${result.upperBound}} ${result.integrand} dx = ${result.result}`
                : `∫ ${result.integrand} dx = ${result.result}`
            }
            subtitle={
              result.type === 'definite' && result.numericalValue !== undefined
                ? `Numerical quadrature approximation: ${result.numericalValue}`
                : 'Arbitrary constant of integration C ∈ ℝ'
            }
            showSteps={showSteps}
            onToggleSteps={() => setShowSteps(!showSteps)}
          />

          {showSteps && (
            <StepsPanel
              title="Antiderivative & Evaluation Steps"
              steps={result.steps}
              defaultOpen={true}
            />
          )}

          <InteractiveGraph
            functions={graphFunctions}
            points={graphPoints}
            title={`Integrand Function Curve: ${result.integrand}`}
          />
        </>
      )}
    </div>
  );
};
