import React, { useRef, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus, Minus, Copy, Trash2, Dices, RefreshCw } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MatrixData = string[][];

interface MatrixEditorProps {
  matrix: MatrixData;
  onChange: (matrix: MatrixData) => void;
  title?: string;
  readonly?: boolean;
}

export function MatrixEditor({ matrix, onChange, title, readonly = false }: MatrixEditorProps) {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  const updateCell = (r: number, c: number, val: string) => {
    if (readonly) return;
    const newMatrix = matrix.map((row, i) =>
      row.map((cell, j) => (i === r && j === c ? val : cell))
    );
    onChange(newMatrix);
  };

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (readonly) return;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      let newR = r;
      let newC = c;
      if (e.key === 'ArrowUp') newR = Math.max(0, r - 1);
      if (e.key === 'ArrowDown') newR = Math.min(rows - 1, r + 1);
      if (e.key === 'ArrowLeft') newC = Math.max(0, c - 1);
      if (e.key === 'ArrowRight') newC = Math.min(cols - 1, c + 1);
      
      const el = document.getElementById(`cell-${title}-${newR}-${newC}`);
      if (el) el.focus();
    }
  };

  const addRow = () => onChange([...matrix, Array(cols).fill('')]);
  const removeRow = () => {
    if (rows > 1) onChange(matrix.slice(0, -1));
  };
  const addCol = () => onChange(matrix.map(row => [...row, '']));
  const removeCol = () => {
    if (cols > 1) onChange(matrix.map(row => row.slice(0, -1)));
  };

  const randomize = () => {
    const newMatrix = matrix.map(row => row.map(() => Math.floor(Math.random() * 20 - 10).toString()));
    onChange(newMatrix);
  };

  const identity = () => {
    const newMatrix = matrix.map((row, i) => row.map((_, j) => (i === j ? '1' : '0')));
    onChange(newMatrix);
  };

  const zeros = () => {
    const newMatrix = matrix.map(row => row.map(() => '0'));
    onChange(newMatrix);
  };
  
  const clear = () => {
    const newMatrix = matrix.map(row => row.map(() => ''));
    onChange(newMatrix);
  };

  const copyToClipboard = () => {
    const str = matrix.map(row => row.join('\\t')).join('\\n');
    navigator.clipboard.writeText(str);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (readonly) return;
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const pastedRows = text.trim().split('\\n').map(row => row.trim().split(/[\\t ]+/));
    
    // Fit matrix to pasted content if needed
    const newRows = Math.max(rows, pastedRows.length);
    const newCols = Math.max(cols, pastedRows[0].length);
    
    const newMatrix = Array.from({ length: newRows }, (_, i) => 
      Array.from({ length: newCols }, (_, j) => {
        if (i < pastedRows.length && j < pastedRows[i].length) {
          return pastedRows[i][j];
        }
        return (i < rows && j < cols) ? matrix[i][j] : '';
      })
    );
    onChange(newMatrix);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl relative flex flex-col items-center group">
      {title && <h3 className="text-xl font-semibold mb-4 text-white/90">{title} <span className="text-xs text-white/40 ml-2">{rows}×{cols}</span></h3>}
      
      {!readonly && (
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={randomize} title="Randomize" className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <Dices size={16} />
          </button>
          <button onClick={identity} title="Identity" className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={clear} title="Clear" className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <Trash2 size={16} />
          </button>
          <button onClick={copyToClipboard} title="Copy" className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <Copy size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col items-center relative">
        {/* Top Controls (Columns) */}
        {!readonly && (
          <div className="flex space-x-2 mb-2">
            <button onClick={removeCol} disabled={cols <= 1} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 transition-all">-</button>
            <div className="w-20 text-center text-xs uppercase tracking-widest text-white/40 flex items-center justify-center">Cols</div>
            <button onClick={addCol} disabled={cols >= 50} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 transition-all">+</button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Left Controls (Rows) */}
          {!readonly && (
            <div className="flex flex-col space-y-2 mr-2 items-center">
              <button onClick={removeRow} disabled={rows <= 1} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 transition-all">-</button>
              <div className="h-20 writing-vertical-rl text-xs uppercase tracking-widest text-white/40 flex items-center justify-center rotate-180">Rows</div>
              <button onClick={addRow} disabled={rows >= 50} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 transition-all">+</button>
            </div>
          )}

          {/* Matrix Brackets */}
          <div className="flex relative">
            <div className="w-4 border-l-2 border-t-2 border-b-2 border-white/20 rounded-l-lg opacity-60"></div>
            
            <div className="grid gap-2 mx-2 p-2 max-w-full overflow-auto max-h-[60vh] scrollbar-thin" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {matrix.map((row, i) => (
                row.map((cell, j) => (
                  <input
                    key={`${i}-${j}`}
                    id={`cell-${title}-${i}-${j}`}
                    type="text"
                    value={cell}
                    onChange={(e) => updateCell(i, j, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i, j)}
                    onPaste={handlePaste}
                    readOnly={readonly}
                    className={cn(
                      "w-16 h-12 text-center bg-white/5 border border-white/10 rounded-md focus:bg-white/10 focus:border-blue-500 outline-none text-white font-mono transition-all",
                      readonly && "bg-transparent border-transparent select-all focus:bg-white/5 text-lg"
                    )}
                    placeholder={readonly ? "" : "0"}
                  />
                ))
              ))}
            </div>

            <div className="w-4 border-r-2 border-t-2 border-b-2 border-white/20 rounded-r-lg opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
