import React, { useState } from 'react';
import { solveLinearSystem, LinearSystemResult } from '../../math/systemsSolver';
import { parseEquationsToMatrix } from '../../math/equationParser';
import { MatrixEditor } from '../../components/MatrixEditor';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { Play, RotateCcw, FileText, Grid, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export const LinearSystemsMode: React.FC = () => {
  const [inputMethod, setInputMethod] = useState<'equations' | 'matrix'>('equations');
  
  // Equations input state
  const [equationsText, setEquationsText] = useState<string>(
    '2x + y - z = 8\n-3x - y + 2z = -11\n-2x + y + 2z = -3'
  );

  // Matrix input state
  const [matrixDim, setMatrixDim] = useState<number>(3);
  const [matrixA, setMatrixA] = useState<string[][]>([
    ['2', '1', '-1'],
    ['-3', '-1', '2'],
    ['-2', '1', '2']
  ]);
  const [vectorB, setVectorB] = useState<string[]>(['8', '-11', '-3']);

  const [result, setResult] = useState<LinearSystemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = () => {
    setError(null);
    try {
      if (inputMethod === 'equations') {
        const parsed = parseEquationsToMatrix(equationsText);
        const res = solveLinearSystem(parsed.A, parsed.B, parsed.variables);
        setResult(res);
      } else {
        const A = matrixA.map(row => row.map(c => parseFloat(c) || 0));
        const B = vectorB.map(c => parseFloat(c) || 0);
        const res = solveLinearSystem(A, B);
        setResult(res);
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while solving the system.');
      setResult(null);
    }
  };

  const handleMatrixChange = (newMatrix: string[][]) => {
    setMatrixA(newMatrix);
    const newRows = newMatrix.length;
    // Sync Vector B length to match Matrix A rows
    setVectorB(prev => {
      if (newRows > prev.length) {
        return [...prev, ...Array(newRows - prev.length).fill('0')];
      } else if (newRows < prev.length) {
        return prev.slice(0, newRows);
      }
      return prev;
    });
  };

  const loadExample = (exType: 'unique' | 'infinite' | 'none') => {
    if (exType === 'unique') {
      setEquationsText('2x + y - z = 8\n-3x - y + 2z = -11\n-2x + y + 2z = -3');
    } else if (exType === 'infinite') {
      setEquationsText('x + 2y - z = 4\n2x + 4y - 2z = 8\n-x - 2y + z = -4');
    } else {
      setEquationsText('x + y = 2\n2x + 2y = 5');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Mode Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 glass-panel">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputMethod('equations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              inputMethod === 'equations'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText size={14} /> Equations Input
          </button>
          <button
            onClick={() => setInputMethod('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              inputMethod === 'matrix'
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid size={14} /> Matrix [A|B] Grid
          </button>
        </div>

        {/* Preset Examples */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Presets:</span>
          <button
            onClick={() => loadExample('unique')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-mono border border-white/5"
          >
            Unique
          </button>
          <button
            onClick={() => loadExample('infinite')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-mono border border-white/5"
          >
            Infinite
          </button>
          <button
            onClick={() => loadExample('none')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-mono border border-white/5"
          >
            Inconsistent
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
        {inputMethod === 'equations' ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                System of Equations (one per line, e.g. 2x + y - z = 8)
              </label>
              <span className="text-[10px] text-white/40 font-mono">Supports negatives, decimals, fractions</span>
            </div>
            <textarea
              value={equationsText}
              onChange={e => setEquationsText(e.target.value)}
              rows={4}
              placeholder="e.g.&#10;2x + y = 5&#10;x - y = 1"
              className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/60 shadow-inner"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Coefficient Matrix A and Right-Hand Vector B
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Size: {matrixA.length}×{matrixA[0]?.length || 0}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center overflow-x-auto py-2">
              <div>
                <div className="text-[10px] font-mono text-center text-blue-400 mb-2 uppercase tracking-widest">
                  Matrix A ({matrixA.length}×{matrixA[0]?.length || 0})
                </div>
                <MatrixEditor matrix={matrixA} onChange={handleMatrixChange} />
              </div>

              <div className="text-white/40 font-mono text-lg font-bold mt-4">× X =</div>

              <div>
                <div className="text-[10px] font-mono text-center text-blue-400 mb-2 uppercase tracking-widest mt-4 sm:mt-0">
                  Vector B ({matrixA.length}×1)
                </div>
                <div className="flex flex-col gap-1.5 p-2 bg-black/50 border border-white/10 rounded-2xl h-full justify-center">
                  {vectorB.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={val}
                      onChange={e => {
                        const newB = [...vectorB];
                        newB[idx] = e.target.value;
                        setVectorB(newB);
                      }}
                      className="w-16 h-10 sm:h-12 text-center font-mono text-sm sm:text-base bg-black/60 border border-white/5 rounded-lg text-white focus:outline-none focus:border-blue-500/50 glow-focus transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSolve}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20"
          >
            <Play size={15} fill="currentColor" /> Solve Linear System
          </button>
          <button
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Solution Results */}
      {result && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className={result.solutionType === 'none' ? 'text-red-400' : 'text-green-400'}
                />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Classification: {result.solutionType.toUpperCase()}
                </h3>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  result.solutionType === 'unique'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : result.solutionType === 'infinite'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {result.solutionType === 'unique'
                  ? 'Consistent (Unique)'
                  : result.solutionType === 'infinite'
                  ? 'Consistent (Underdetermined)'
                  : 'Inconsistent'}
              </span>
            </div>

            {/* Solution Summary Box */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/5">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                Solution Vector
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-blue-200">
                {result.solutionSummary}
              </div>
            </div>

            {/* Parametric Form if infinite */}
            {result.parametricForm && (
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-1">
                  Parametric Vector Representation
                </div>
                {result.parametricForm.map((p, i) => (
                  <div key={i} className="font-mono text-sm text-white/90">
                    {p}
                  </div>
                ))}
              </div>
            )}

            {/* Final RREF Matrix */}
            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">
                Reduced Row Echelon Form [RREF | Solution]
              </div>
              <MatrixEditor
                matrix={result.rrefMatrix.map(row => row.map(c => String(c)))}
                onChange={() => {}}
                readonly
              />
            </div>
          </div>

          {/* Row Reduction Steps */}
          <StepsViewer
            title="Step-by-Step Row Operations (Gaussian Elimination)"
            defaultOpen={true}
            steps={result.steps.map((s, idx) => ({
              title: s.description,
              rule: `Operation ${idx + 1}`,
              description: `Matrix state after row transform:`,
              expression: s.matrix.map(r => `[ ${r.join(', ')} ]`).join('\n')
            }))}
          />
        </div>
      )}
    </div>
  );
};
