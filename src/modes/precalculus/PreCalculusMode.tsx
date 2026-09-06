import React, { useState } from 'react';
import {
  calculateArithmeticSequence,
  calculateGeometricSequence,
  binomialExpansion,
  calculateComplexNumber,
  calculateTrigonometry,
  SequenceResult,
  BinomialResult,
  ComplexNumberResult,
  TrigonometryResult
} from '../../math/precalculusEngine';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';
import { Play } from 'lucide-react';

export const PreCalculusMode: React.FC = () => {
  const [subTab, setSubTab] = useState<'sequences' | 'binomial' | 'complex' | 'trigonometry'>('sequences');

  // Sequence state
  const [seqType, setSeqType] = useState<'arithmetic' | 'geometric'>('arithmetic');
  const [a1, setA1] = useState<number>(3);
  const [diffOrRatio, setDiffOrRatio] = useState<number>(4);
  const [numTerms, setNumTerms] = useState<number>(10);
  const [seqResult, setSeqResult] = useState<SequenceResult | null>(() => {
    try {
      return calculateArithmeticSequence(3, 4, 10);
    } catch {
      return null;
    }
  });

  // Binomial state
  const [binA, setBinA] = useState('x');
  const [binB, setBinB] = useState('2');
  const [binN, setBinN] = useState<number>(4);
  const [binResult, setBinResult] = useState<BinomialResult | null>(null);

  // Complex state
  const [compReal, setCompReal] = useState<number>(1);
  const [compImag, setCompImag] = useState<number>(1.732);
  const [compPower, setCompPower] = useState<number>(3);
  const [compResult, setCompResult] = useState<ComplexNumberResult | null>(null);

  // Trigonometry state (NEW!)
  const [trigFn, setTrigFn] = useState<'sin' | 'cos' | 'tan' | 'sec' | 'csc' | 'cot'>('sin');
  const [trigAngle, setTrigAngle] = useState<number>(60);
  const [trigResult, setTrigResult] = useState<TrigonometryResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleComputeSeq = () => {
    setError(null);
    try {
      const res =
        seqType === 'arithmetic'
          ? calculateArithmeticSequence(a1, diffOrRatio, numTerms)
          : calculateGeometricSequence(a1, diffOrRatio, numTerms);
      setSeqResult(res);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleComputeBinomial = () => {
    setError(null);
    try {
      const res = binomialExpansion(binA, binB, binN);
      setBinResult(res);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleComputeComplex = () => {
    setError(null);
    try {
      const res = calculateComplexNumber(compReal, compImag, compPower);
      setCompResult(res);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleComputeTrig = () => {
    setError(null);
    try {
      const res = calculateTrigonometry(trigFn, trigAngle);
      setTrigResult(res);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Algebra & Pre-Calculus"
        title="Pre-Calculus & Trigonometry"
        description="Solve arithmetic and geometric progressions, expand polynomials via the Binomial Theorem, analyze complex numbers (Euler/polar), and evaluate trigonometric functions with exact identities."
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'sequences', label: 'Sequences & Series' },
          { id: 'binomial', label: 'Binomial Theorem' },
          { id: 'complex', label: 'Complex Numbers (z = a + bi)' },
          { id: 'trigonometry', label: 'Trigonometry & Identities' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setSubTab(t.id as any);
              setError(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              subTab === t.id
                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* 1. Sequences Tab */}
      {subTab === 'sequences' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSeqType('arithmetic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                seqType === 'arithmetic'
                  ? 'bg-blue-600/30 border-blue-500/40 text-blue-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Arithmetic (aₙ = a₁ + (n-1)d)
            </button>
            <button
              onClick={() => setSeqType('geometric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                seqType === 'geometric'
                  ? 'bg-blue-600/30 border-blue-500/40 text-blue-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Geometric (aₙ = a₁ · rⁿ⁻¹)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">First Term (a₁)</label>
              <input
                type="number"
                value={a1}
                onChange={e => setA1(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {seqType === 'arithmetic' ? 'Common Difference (d)' : 'Common Ratio (r)'}
              </label>
              <input
                type="number"
                value={diffOrRatio}
                onChange={e => setDiffOrRatio(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Term (n)</label>
              <input
                type="number"
                value={numTerms}
                onChange={e => setNumTerms(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleComputeSeq}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Calculate Progression</span>
          </button>

          {seqResult && (
            <>
              <ResultPanel
                title="SEQUENCE METRICS"
                result={`a_${seqResult.n} = ${seqResult.an}`}
                subtitle={`Sum of first ${seqResult.n} terms S_${seqResult.n} = ${seqResult.sumSn}`}
                secondaryResults={[
                  { label: `Term a_${seqResult.n}`, value: seqResult.an },
                  { label: `Sum S_${seqResult.n}`, value: seqResult.sumSn },
                  { label: 'Initial Term a₁', value: seqResult.a1 }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Sequence Derivation & Summation"
                  steps={seqResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 2. Binomial Tab */}
      {subTab === 'binomial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Term a</label>
              <input
                type="text"
                value={binA}
                onChange={e => setBinA(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Term b</label>
              <input
                type="text"
                value={binB}
                onChange={e => setBinB(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Exponent (n)</label>
              <input
                type="number"
                value={binN}
                onChange={e => setBinN(parseInt(e.target.value) || 0)}
                min="0"
                max="12"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleComputeBinomial}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Expand Binomial (a + b)ⁿ</span>
          </button>

          {binResult && (
            <>
              <ResultPanel
                title="BINOMIAL EXPANSION"
                result={`(${binResult.a} + ${binResult.b})^${binResult.n} = ${binResult.expansionString}`}
                subtitle={`Total terms = ${binResult.terms.length} computed using Pascal's combinations C(n, k)`}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Binomial Expansion Coefficients"
                  steps={binResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 3. Complex Tab */}
      {subTab === 'complex' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Real Part (Re)</label>
              <input
                type="number"
                value={compReal}
                onChange={e => setCompReal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Imaginary Part (Im)</label>
              <input
                type="number"
                value={compImag}
                onChange={e => setCompImag(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Power zⁿ (De Moivre)</label>
              <input
                type="number"
                value={compPower}
                onChange={e => setCompPower(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleComputeComplex}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Analyze Complex Number</span>
          </button>

          {compResult && (
            <>
              <ResultPanel
                title="EULER & POLAR REPRESENTATION"
                result={`z = ${compResult.eulerForm}`}
                subtitle={`Cartesian: z = ${compResult.real} + ${compResult.imag}i | Conjugate: ${compResult.conjugate}`}
                secondaryResults={[
                  { label: 'Modulus |z|', value: compResult.modulus },
                  { label: 'Argument θ', value: `${compResult.argumentDeg}°` },
                  { label: 'Polar Form', value: compResult.polarForm }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Complex Modulus & Argument Derivations"
                  steps={compResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 4. Trigonometry Tab (NEW!) */}
      {subTab === 'trigonometry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Function</label>
              <div className="grid grid-cols-6 gap-1">
                {(['sin', 'cos', 'tan', 'sec', 'csc', 'cot'] as const).map(fn => (
                  <button
                    key={fn}
                    onClick={() => setTrigFn(fn)}
                    className={`py-2 rounded-lg text-xs font-mono font-semibold uppercase border transition-colors ${
                      trigFn === fn
                        ? 'bg-blue-600/30 border-blue-500/40 text-blue-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Angle (Degrees °)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={trigAngle}
                  onChange={e => setTrigAngle(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
                />
                {[0, 30, 45, 60, 90, 180].map(deg => (
                  <button
                    key={deg}
                    onClick={() => setTrigAngle(deg)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 rounded-lg"
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleComputeTrig}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Evaluate Trigonometry</span>
          </button>

          {trigResult && (
            <>
              <ResultPanel
                title="TRIGONOMETRIC EVALUATION"
                result={`${trigResult.fn}(${trigResult.angleDeg}°) = ${trigResult.exactValue}`}
                subtitle={`Decimal approximation: ${trigResult.decimalValue} | Angle in radians: ${trigResult.angleRad} rad`}
                badge={trigResult.quadrant}
                secondaryResults={[
                  { label: 'Exact Value', value: trigResult.exactValue },
                  { label: 'Decimal', value: trigResult.decimalValue },
                  { label: 'Quadrant', value: trigResult.quadrant },
                  { label: 'Radians', value: trigResult.angleRad }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Evaluation Steps & Core Identities"
                  steps={trigResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
