import React from 'react';
import { formatNumber } from '../../utils/formatting';

interface MatrixDisplayProps {
  matrix: (string | number)[][];
  label?: string;
  augmentedCol?: number; // index of vertical divider line if augmented matrix [A | B]
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  highlightRow?: number;
}

export const MatrixDisplay: React.FC<MatrixDisplayProps> = ({
  matrix,
  label,
  augmentedCol,
  className = '',
  size = 'md',
  highlightRow
}) => {
  if (!matrix || matrix.length === 0 || !matrix[0]) {
    return <span className="text-slate-500 italic text-sm">Empty matrix</span>;
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  const paddingClass = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2.5 text-base sm:text-lg' : 'px-3 py-1.5 text-sm sm:text-base';
  const bracketBorderWidth = size === 'lg' ? 'border-2' : 'border-[1.5px]';

  return (
    <div className={`inline-flex items-center gap-3 max-w-full overflow-hidden ${className}`}>
      {label && (
        <span className="font-serif text-lg sm:text-xl text-slate-300 font-semibold select-none">
          {label} =
        </span>
      )}

      {/* Outer Bracket Container */}
      <div className="relative inline-flex items-stretch group max-w-full">
        {/* Left Mathematical Bracket [ */}
        <div className={`w-2 sm:w-2.5 ${bracketBorderWidth} border-r-0 border-blue-400/70 rounded-l-md shrink-0 my-0.5`} />

        {/* Matrix Contents Scrollable Grid */}
        <div className="overflow-x-auto overflow-y-auto max-w-[calc(100vw-5rem)] max-h-72 p-1 scrollbar-thin">
          <table className="border-collapse select-all">
            <tbody>
              {matrix.map((row, rIdx) => {
                const isHighlighted = highlightRow === rIdx;
                return (
                  <tr 
                    key={rIdx} 
                    className={`transition-colors ${isHighlighted ? 'bg-blue-500/20' : ''}`}
                  >
                    {row.map((cell, cIdx) => {
                      const isDivider = augmentedCol !== undefined && cIdx === augmentedCol;
                      return (
                        <td
                          key={cIdx}
                          className={`font-mono text-center text-slate-100 font-medium ${paddingClass} ${
                            isDivider ? 'border-l border-dashed border-blue-400/50' : ''
                          }`}
                        >
                          {cell !== undefined && cell !== null && cell !== '' 
                            ? (typeof cell === 'number' ? formatNumber(cell) : String(cell)) 
                            : '0'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Mathematical Bracket ] */}
        <div className={`w-2 sm:w-2.5 ${bracketBorderWidth} border-l-0 border-blue-400/70 rounded-r-md shrink-0 my-0.5`} />
      </div>

      <div className="text-[11px] font-sans text-slate-500 select-none self-end pb-1 font-medium">
        {rows}×{cols}
      </div>
    </div>
  );
};
