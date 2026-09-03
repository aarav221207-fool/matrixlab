import React, { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Copy, Trash2, Dices, RefreshCw, Check, X, Files, Edit2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MatrixData = string[][];

interface MatrixEditorProps {
  matrix: MatrixData;
  onChange: (matrix: MatrixData) => void;
  title?: string;
  readonly?: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRename?: (newName: string) => void;
}

export function MatrixEditor({
  matrix,
  onChange,
  title,
  readonly = false,
  onDelete,
  onDuplicate,
  onRename,
}: MatrixEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(title?.replace('Matrix ', '') || '');
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
      
      const el = document.getElementById(`cell-${title || 'matrix'}-${newR}-${newC}`);
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

  const clear = () => {
    const newMatrix = matrix.map(row => row.map(() => ''));
    onChange(newMatrix);
  };

  const copyToClipboard = () => {
    const str = matrix.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (readonly) return;
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const pastedRows = text.trim().split('\n').map(row => row.trim().split(/[\t ]+/));
    
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

  const handleNameSave = () => {
    if (onRename && customName.trim()) {
      onRename(customName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 shadow-xl relative flex flex-col items-center w-full max-w-full overflow-hidden">
      {/* Header with Title and Touch-Friendly Action Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          {title && (
            <div className="flex items-center gap-1.5">
              {isEditingName && onRename ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="text" 
                    value={customName} 
                    onChange={e => setCustomName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); }}
                    className="bg-white/10 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-16 font-bold"
                    autoFocus
                  />
                  <button 
                    onClick={handleNameSave}
                    className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                    aria-label="Confirm name"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  {title}
                  {onRename && (
                    <button 
                      onClick={() => {
                        setCustomName(title.replace('Matrix ', ''));
                        setIsEditingName(true);
                      }}
                      className="text-white/40 hover:text-white p-1 rounded transition-colors"
                      title="Rename matrix"
                      aria-label="Rename matrix"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </h3>
              )}
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                {rows}×{cols}
              </span>
            </div>
          )}
        </div>

        {/* Quick Toolbar (Always accessible on Mobile and Desktop) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {!readonly && (
            <>
              <button 
                onClick={randomize} 
                aria-label="Randomize matrix"
                title="Randomize matrix" 
                className="p-2 sm:p-1.5 bg-white/5 hover:bg-white/15 active:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <Dices size={16} />
              </button>
              <button 
                onClick={identity} 
                aria-label="Identity matrix"
                title="Identity matrix" 
                className="p-2 sm:p-1.5 bg-white/5 hover:bg-white/15 active:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <RefreshCw size={15} />
              </button>
              <button 
                onClick={clear} 
                aria-label="Clear matrix"
                title="Clear all cells" 
                className="p-2 sm:p-1.5 bg-white/5 hover:bg-white/15 active:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <Trash2 size={15} />
              </button>
              {onDuplicate && (
                <button 
                  onClick={onDuplicate} 
                  aria-label="Duplicate matrix"
                  title="Duplicate matrix" 
                  className="p-2 sm:p-1.5 bg-white/5 hover:bg-white/15 active:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Files size={15} />
                </button>
              )}
            </>
          )}

          <button 
            onClick={copyToClipboard} 
            aria-label="Copy to clipboard"
            title={copied ? "Copied!" : "Copy matrix values"} 
            className="p-2 sm:p-1.5 bg-white/5 hover:bg-white/15 active:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={15} />}
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              aria-label="Delete matrix"
              title="Delete matrix from workspace"
              className="p-2 sm:p-1.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ml-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center w-full max-w-full">
        {/* Top Controls (Columns) */}
        {!readonly && (
          <div className="flex items-center justify-center space-x-3 mb-3">
            <button 
              onClick={removeCol} 
              disabled={cols <= 1} 
              aria-label="Decrease columns"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white disabled:opacity-20 font-bold transition-all"
            >
              -
            </button>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 px-2">
              {cols} {cols === 1 ? 'Col' : 'Cols'}
            </div>
            <button 
              onClick={addCol} 
              disabled={cols >= 50} 
              aria-label="Increase columns"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white disabled:opacity-20 font-bold transition-all"
            >
              +
            </button>
          </div>
        )}

        <div className="flex items-center justify-center w-full max-w-full">
          {/* Left Controls (Rows) */}
          {!readonly && (
            <div className="flex flex-col space-y-2 mr-2 sm:mr-3 items-center shrink-0">
              <button 
                onClick={removeRow} 
                disabled={rows <= 1} 
                aria-label="Decrease rows"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white disabled:opacity-20 font-bold transition-all"
              >
                -
              </button>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 py-1 [writing-mode:vertical-lr] rotate-180">
                {rows} {rows === 1 ? 'Row' : 'Rows'}
              </div>
              <button 
                onClick={addRow} 
                disabled={rows >= 50} 
                aria-label="Increase rows"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white disabled:opacity-20 font-bold transition-all"
              >
                +
              </button>
            </div>
          )}

          {/* Matrix Brackets & Scrollable Grid */}
          <div className="flex relative max-w-[calc(100vw-6rem)] sm:max-w-full overflow-hidden items-stretch">
            {/* Left Bracket */}
            <div className="w-2.5 sm:w-3.5 border-l-2 border-t-2 border-b-2 border-blue-400/40 rounded-l-lg shrink-0 my-1"></div>
            
            {/* Matrix Input Grid */}
            <div className="overflow-x-auto overflow-y-auto max-w-full max-h-[55vh] p-1.5 sm:p-2 scrollbar-thin">
              <div 
                className="grid gap-1.5 sm:gap-2 w-max"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {matrix.map((row, i) => (
                  row.map((cell, j) => (
                    <input
                      key={`${i}-${j}`}
                      id={`cell-${title || 'matrix'}-${i}-${j}`}
                      type="text"
                      inputMode="decimal"
                      value={cell}
                      onChange={(e) => updateCell(i, j, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i, j)}
                      onPaste={handlePaste}
                      readOnly={readonly}
                      className={cn(
                        "w-12 sm:w-16 h-10 sm:h-12 text-center bg-white/5 border border-white/10 rounded-lg focus:bg-white/15 focus:border-blue-500 outline-none text-white font-mono text-sm sm:text-base transition-all",
                        readonly && "bg-transparent border-transparent select-all focus:bg-white/10 font-medium"
                      )}
                      placeholder={readonly ? "" : "0"}
                    />
                  ))
                ))}
              </div>
            </div>

            {/* Right Bracket */}
            <div className="w-2.5 sm:w-3.5 border-r-2 border-t-2 border-b-2 border-blue-400/40 rounded-r-lg shrink-0 my-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
