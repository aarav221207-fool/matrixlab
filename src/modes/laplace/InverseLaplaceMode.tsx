import React, { useState } from 'react';
import { calculateInverseLaplaceTransform, InverseLaplaceResult } from '../../math/laplaceEngine';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { CalculatorInput } from '../../components/design-system/CalculatorInput';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';

const PRESETS = [
  { label: '1/(s² + 4) (Sine)', value: '1/(s^2+4)' },
  { label: 's/(s² + 9) (Cosine)', value: 's/(s^2+9)' },
  { label: '1/(s - 3) (Exponential)', value: '1/(s-3)' },
  { label: '3/s² (Linear t)', value: '3/s^2' },
  { label: '1/s (Step)', value: '1/s' }
];

export const InverseLaplaceMode: React.FC = () => {
  const [funcStr, setFuncStr] = useState('1/(s^2+4)');
  const [result, setResult] = useState<InverseLaplaceResult | null>(() => {
    try {
      return calculateInverseLaplaceTransform('1/(s^2+4)');
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleCompute = () => {
    setError(null);
    try {
      const res = calculateInverseLaplaceTransform(funcStr);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to compute inverse Laplace transform.');
      setResult(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Calculus & Transforms"
        title="Inverse Laplace Transform"
        description="Transform complex frequency domain function F(s) into real time domain function f(t) for t ≥ 0 using standard transform pairs, partial fraction decomposition, and shift theorems."
        presets={PRESETS}
        onSelectPreset={(val) => {
          setFuncStr(val);
          try {
            const res = calculateInverseLaplaceTransform(val);
            setResult(res);
            setError(null);
          } catch {
            // keep input
          }
        }}
      />

      {/* Input Section */}
      <section className="space-y-4">
        <CalculatorInput
          label="Complex Frequency Domain Expression"
          prefix="F(s) ="
          value={funcStr}
          onChange={setFuncStr}
          onSubmit={handleCompute}
          placeholder="e.g. 1/(s^2+4), s/(s^2+9), 1/(s-3)"
          buttonLabel="Calculate Inverse Laplace"
          error={error}
          helperText="Enter a rational s-domain transfer function with variable s."
        />
      </section>

      {/* Dominant Result Display */}
      {result && (
        <>
          <ResultPanel
            title="TIME-DOMAIN INVERSION"
            result={`f(t) = ${result.resultLatex || result.resultFt}`}
            subtitle={`\\mathcal{L}^{-1}\\{ ${result.inputFs} \\} \\quad (t \\ge 0)`}
            badge={result.method}
            showSteps={showSteps}
            onToggleSteps={() => setShowSteps(!showSteps)}
          />

          {showSteps && (
            <StepsPanel
              title="Mathematical Derivation Steps"
              steps={result.steps}
              defaultOpen={true}
            />
          )}
        </>
      )}
    </div>
  );
};
