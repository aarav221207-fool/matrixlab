import React, { useState } from 'react';
import { calculateLaplaceTransform, LaplaceResult } from '../../math/laplaceEngine';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { CalculatorInput } from '../../components/design-system/CalculatorInput';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';

const PRESETS = [
  { label: 't³ (Power Rule)', value: 't^3' },
  { label: 'e^(4t) (Exponential)', value: 'exp(4*t)' },
  { label: 'cos(3t) (Oscillation)', value: 'cos(3*t)' },
  { label: 't²·e^(3t) (Frequency Shift)', value: 't^2*exp(3*t)' },
  { label: 'e^(-2t)·sin(4t) (Damped Wave)', value: 'exp(-2*t)*sin(4*t)' }
];

export const LaplaceMode: React.FC = () => {
  const [funcStr, setFuncStr] = useState('t^2*exp(3*t)');
  const [result, setResult] = useState<LaplaceResult | null>(() => {
    try {
      return calculateLaplaceTransform('t^2*exp(3*t)');
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleCompute = () => {
    setError(null);
    try {
      const res = calculateLaplaceTransform(funcStr);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to compute Laplace transform.');
      setResult(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Calculus & Transforms"
        title="Laplace Transform"
        description="Compute the unilateral Laplace transform F(s) = ∫₀^∞ f(t) e^(-st) dt for time-domain signals using linear properties, standard table pairs, and frequency shift theorems."
        presets={PRESETS}
        onSelectPreset={(val) => {
          setFuncStr(val);
          try {
            const res = calculateLaplaceTransform(val);
            setResult(res);
            setError(null);
          } catch {
            // keep input
          }
        }}
      />

      {/* Input section */}
      <section className="space-y-4">
        <CalculatorInput
          label="Time-Domain Expression f(t) (t ≥ 0)"
          prefix="f(t) ="
          value={funcStr}
          onChange={setFuncStr}
          onSubmit={handleCompute}
          placeholder="e.g. t^3, exp(4*t), cos(3*t), t^2*exp(3*t)"
          buttonLabel="Calculate Laplace Transform"
          error={error}
          helperText="Use standard functions like exp(at), sin(wt), cos(wt), t^n."
        />
      </section>

      {/* Dominant Result */}
      {result && (
        <>
          <ResultPanel
            title="FREQUENCY-DOMAIN TRANSFORM"
            result={`F(s) = ${result.result}`}
            subtitle={`L{ ${result.functionInput} } = ∫₀^∞ ${result.functionInput} · e^(-st) dt`}
            badge={result.rule}
            showSteps={showSteps}
            onToggleSteps={() => setShowSteps(!showSteps)}
          />

          {showSteps && (
            <StepsPanel
              title="Transform Derivation Sequence"
              steps={result.steps}
              defaultOpen={true}
            />
          )}
        </>
      )}
    </div>
  );
};
