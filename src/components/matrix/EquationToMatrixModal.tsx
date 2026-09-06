import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { parseEquationsToMatrix } from '../../math/equationParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (matrixA: string[][], matrixB: string[][], augmented: string[][]) => void;
}

export const EquationToMatrixModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [equationsText, setEquationsText] = useState(
    '2x + 3y - z = 7\nx - y + 4z = 3\n3x + 2y + 0z = 5'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    setError(null);
    try {
      const parsed = parseEquationsToMatrix(equationsText);
      const matrixA: string[][] = parsed.A.map(row => row.map(v => v.toString()));
      const matrixB: string[][] = parsed.B.map(v => [v.toString()]);
      const augmented: string[][] = parsed.augmented.map(row => row.map(v => v.toString()));

      onImport(matrixA, matrixB, augmented);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to parse equations');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" />
            <h3 className="font-bold text-white text-base">Equation to Matrix Parser</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed">
          Paste any system of linear equations (one equation per line). The parser will automatically extract the variable coefficients and constants into Matrix A and Matrix B.
        </p>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-[11px] font-mono text-white/50 uppercase tracking-widest block mb-1">
            System of Equations
          </label>
          <textarea
            value={equationsText}
            onChange={e => setEquationsText(e.target.value)}
            rows={5}
            className="w-full p-3 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
            placeholder="2x + y = 5&#10;x - 3y = 2"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20"
          >
            Import Matrices
          </button>
        </div>
      </div>
    </div>
  );
};
