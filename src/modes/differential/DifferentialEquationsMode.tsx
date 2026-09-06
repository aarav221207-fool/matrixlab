import React, { useState } from 'react';
import { solveDifferentialEquation, ODESolution } from '../../math/differentialEngine';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { CalculatorInput } from '../../components/design-system/CalculatorInput';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';

const PRESETS = [
  { label: "y'' + 3y' + 2y = 0 (Real Roots)", value: "y'' + 3y' + 2y = 0" },
  { label: "y'' + 4y = 0 (Oscillator)", value: "y'' + 4y = 0" },
  { label: "dy/dx + y = x (1st Order Linear)", value: "dy/dx + y = x" },
  { label: "dy/dx = 2*x*y (Separable)", value: "dy/dx = 2*x*y" }
];

export const DifferentialEquationsMode: React.FC = () => {
  const [equationStr, setEquationStr] = useState("y'' + 3y' + 2y = 0");
  const [hasIC, setHasIC] = useState(true);
  const [y0Str, setY0Str] = useState('1');
  const [dy0Str, setDy0Str] = useState('0');

  const [result, setResult] = useState<ODESolution | null>(() => {
    try {
      return solveDifferentialEquation("y'' + 3y' + 2y = 0", { x0: 0, y0: 1, dy0: 0 });
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleSolve = () => {
    setError(null);
    try {
      const ic = hasIC
        ? {
            x0: 0,
            y0: parseFloat(y0Str) || 0,
            dy0: dy0Str.trim() ? parseFloat(dy0Str) : undefined
          }
        : undefined;

      const res = solveDifferentialEquation(equationStr, ic);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
      setResult(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Calculus"
        title="Differential Equations"
        description="Analytical solutions for 1st order separable and linear ODEs (integrating factor), and 2nd order constant-coefficient linear ODEs with initial value problem (IVP) resolution."
        presets={PRESETS}
        onSelectPreset={(val) => {
          setEquationStr(val);
          try {
            const ic = hasIC ? { x0: 0, y0: parseFloat(y0Str) || 0, dy0: dy0Str ? parseFloat(dy0Str) : undefined } : undefined;
            const res = solveDifferentialEquation(val, ic);
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
          label="Differential Equation"
          prefix="ODE:"
          value={equationStr}
          onChange={setEquationStr}
          onSubmit={handleSolve}
          placeholder="e.g. y'' + 3y' + 2y = 0 or dy/dx + y = x"
          buttonLabel="Solve Equation"
          error={error}
          secondaryInputs={
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ic-toggle"
                  checked={hasIC}
                  onChange={e => setHasIC(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ic-toggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Specify Initial Conditions (IVP)
                </label>
              </div>

              {hasIC && (
                <div className="flex flex-wrap items-center gap-4 pl-4 border-l-2 border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">y(0) =</span>
                    <input
                      type="number"
                      value={y0Str}
                      onChange={e => setY0Str(e.target.value)}
                      className="w-20 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">y&apos;(0) =</span>
                    <input
                      type="number"
                      value={dy0Str}
                      onChange={e => setDy0Str(e.target.value)}
                      placeholder="if 2nd order"
                      className="w-24 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          }
        />
      </section>

      {/* Dominant Result */}
      {result && (
        <>
          <ResultPanel
            title="SOLUTION FUNCTION"
            result={result.generalSolution}
            subtitle={result.particularSolution ? `Particular solution: ${result.particularSolution}` : 'General family of solutions'}
            badge={result.type}
            secondaryResults={
              result.particularSolution
                ? [{ label: 'Particular Solution y(x)', value: result.particularSolution }]
                : undefined
            }
            showSteps={showSteps}
            onToggleSteps={() => setShowSteps(!showSteps)}
          />

          {showSteps && (
            <StepsPanel
              title="Analytical Derivation & Integration Steps"
              steps={result.steps}
              defaultOpen={true}
            />
          )}
        </>
      )}
    </div>
  );
};
