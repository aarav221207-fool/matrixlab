import React, { useRef, useEffect, useState } from 'react';
import { Copy, Plus, Trash2, X, RefreshCw, Edit2, Files, Dices, Check } from 'lucide-react';
import anime from 'animejs';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface MatrixEditorProps {
  matrix: string[][];
  onChange: (matrix: string[][]) => void;
  readonly?: boolean;
  title?: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRename?: (newName: string) => void;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({ 
  matrix, 
  onChange, 
  readonly = false, 
  title, 
  onDelete,
  onDuplicate,
  onRename
}) => {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState('');
  
  const cardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Elegant entry animation for the matrix card
    if (cardRef.current && !readonly) {
      anime({
        targets: cardRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutExpo'
      });
    }
  }, []);

  useEffect(() => {
    // Subtle staggered cell animation when matrix changes size
    if (gridRef.current) {
      const inputs = gridRef.current.querySelectorAll('input');
      anime({
        targets: inputs,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 300,
        delay: anime.stagger(15, { grid: [cols, rows], from: 'center' }),
        easing: 'easeOutQuad'
      });
    }
  }, [rows, cols]);

  const updateCell = (i: number, j: number, val: string) => {
    const newMatrix = matrix.map(r => [...r]);
    // Allow valid math input characters (including e, E, ., -, numbers)
    newMatrix[i][j] = val.replace(/[^0-9.\-eE+]/g, '');
    onChange(newMatrix);
  };

  const addRow = () => {
    if (rows >= 50) return;
    const newMatrix = [...matrix, Array(cols).fill('0')];
    onChange(newMatrix);
  };

  const removeRow = () => {
    if (rows <= 1) return;
    const newMatrix = matrix.slice(0, -1);
    onChange(newMatrix);
  };

  const addCol = () => {
    if (cols >= 50) return;
    const newMatrix = matrix.map(r => [...r, '0']);
    onChange(newMatrix);
  };

  const removeCol = () => {
    if (cols <= 1) return;
    const newMatrix = matrix.map(r => r.slice(0, -1));
    onChange(newMatrix);
  };

  const randomize = () => {
    const newMatrix = matrix.map(row => 
      row.map(() => Math.floor(Math.random() * 21 - 10).toString())
    );
    onChange(newMatrix);
    if (gridRef.current) {
      anime({
        targets: gridRef.current.querySelectorAll('input'),
        translateY: [-2, 0],
        opacity: [0.8, 1],
        duration: 250,
        delay: anime.stagger(20)
      });
    }
  };

  const identity = () => {
    const newMatrix = matrix.map((row, i) => 
      row.map((_, j) => (i === j ? '1' : '0'))
    );
    onChange(newMatrix);
    if (gridRef.current) {
      anime({
        targets: gridRef.current.querySelectorAll('input'),
        scale: [0.9, 1],
        duration: 300,
        easing: 'easeOutBack'
      });
    }
  };

  const clear = () => {
    const newMatrix = matrix.map(row => row.map(() => '0'));
    onChange(newMatrix);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    let pastedRows = text.trim().split(/[\r\n]+/).map(row => row.split(/[\t, ]+/));
    if (pastedRows.length === 0 || pastedRows[0].length === 0) return;

    let targetRows = Math.max(rows, pastedRows.length);
    let targetCols = Math.max(cols, pastedRows[0].length);
    
    // limit max size safely
    targetRows = Math.min(targetRows, 20);
    targetCols = Math.min(targetCols, 20);

    const newMatrix = Array(targetRows).fill(0).map((_, i) => 
      Array(targetCols).fill('0').map((_, j) => {
        if (i < pastedRows.length && j < pastedRows[i].length && pastedRows[i][j]) {
          const val = pastedRows[i][j].replace(/[^0-9.\-eE+]/g, '');
          return val || '0';
        }
        return (i < rows && j < cols) ? matrix[i][j] : '0';
      })
    );
    onChange(newMatrix);
  };

  const copyToClipboard = () => {
    const text = matrix.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number, j: number) => {
    if (e.key === 'ArrowRight' && j < cols - 1) {
      document.getElementById(`cell-${title || 'matrix'}-${i}-${j + 1}`)?.focus();
    } else if (e.key === 'ArrowLeft' && j > 0) {
      document.getElementById(`cell-${title || 'matrix'}-${i}-${j - 1}`)?.focus();
    } else if (e.key === 'ArrowDown' && i < rows - 1) {
      document.getElementById(`cell-${title || 'matrix'}-${i + 1}-${j}`)?.focus();
    } else if (e.key === 'ArrowUp' && i > 0) {
      document.getElementById(`cell-${title || 'matrix'}-${i - 1}-${j}`)?.focus();
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim() && onRename) {
      onRename(customName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "flex flex-col relative", 
        !readonly && "glass-panel p-4 sm:p-5 rounded-2xl w-full hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-shadow duration-500"
      )}
    >
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          {title && (
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                    onBlur={handleRenameSubmit}
                    autoFocus
                    maxLength={10}
                    className="bg-black/40 text-white font-bold text-sm border border-blue-500/50 rounded px-2 py-1 w-24 outline-none glow-focus"
                  />
                </form>
              ) : (
                <h3 className="text-sm sm:text-base font-bold text-white tracking-widest flex items-center gap-1.5 uppercase">
                  {title}
                  {onRename && (
                    <button 
                      onClick={() => {
                        setCustomName(title.replace('Matrix ', ''));
                        setIsEditingName(true);
                      }}
                      className="text-white/30 hover:text-white p-1 rounded transition-colors ml-1"
                      title="Rename matrix"
                      aria-label="Rename matrix"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </h3>
              )}
              <span className="text-[10px] sm:text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                {rows} × {cols}
              </span>
            </div>
          )}
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!readonly && (
            <>
              <button 
                onClick={randomize} 
                title="Randomize" 
                className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <Dices size={15} />
              </button>
              <button 
                onClick={identity} 
                title="Identity" 
                className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <RefreshCw size={14} />
              </button>
              <button 
                onClick={clear} 
                title="Clear" 
                className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <Trash2 size={14} />
              </button>
              {onDuplicate && (
                <button 
                  onClick={onDuplicate} 
                  title="Duplicate" 
                  className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                >
                  <Files size={14} />
                </button>
              )}
            </>
          )}
          <button 
            onClick={copyToClipboard} 
            title={copied ? "Copied!" : "Copy values"} 
            className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
          >
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={14} />}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1.5 sm:p-2 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center ml-1 min-w-[36px] min-h-[36px]"
            >
              <X size={15} />
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
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/80 disabled:opacity-20 font-bold transition-all border border-white/5"
            >
              -
            </button>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/70 px-2 w-16 text-center">
              {cols} COL{cols !== 1 && 'S'}
            </div>
            <button 
              onClick={addCol} 
              disabled={cols >= 50} 
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/80 disabled:opacity-20 font-bold transition-all border border-white/5"
            >
              +
            </button>
          </div>
        )}

        <div className="flex items-center justify-center w-full max-w-full">
          {/* Left Controls (Rows) */}
          {!readonly && (
            <div className="flex flex-col space-y-2 mr-3 items-center shrink-0">
              <button 
                onClick={removeRow} 
                disabled={rows <= 1} 
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/80 disabled:opacity-20 font-bold transition-all border border-white/5"
              >
                -
              </button>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/70 py-1 [writing-mode:vertical-lr] rotate-180 h-16 text-center flex items-center justify-center">
                {rows} ROW{rows !== 1 && 'S'}
              </div>
              <button 
                onClick={addRow} 
                disabled={rows >= 50} 
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/80 disabled:opacity-20 font-bold transition-all border border-white/5"
              >
                +
              </button>
            </div>
          )}

          {/* Matrix Brackets & Scrollable Grid */}
          <div className="flex relative max-w-[calc(100vw-6rem)] sm:max-w-full overflow-hidden items-stretch group">
            {/* Left Bracket */}
            <div className="w-2.5 sm:w-3.5 border-l-2 border-t-2 border-b-2 border-blue-400/30 group-hover:border-blue-400/60 transition-colors duration-500 rounded-l-lg shrink-0 my-1"></div>
            
            {/* Matrix Input Grid */}
            <div className="overflow-x-auto overflow-y-auto max-w-full max-h-[55vh] p-1.5 sm:p-3 scrollbar-thin">
              <div 
                ref={gridRef}
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
                        "w-12 sm:w-16 h-10 sm:h-12 text-center bg-black/40 border border-white/5 rounded-lg glow-focus text-white font-mono text-sm sm:text-base transition-all",
                        readonly && "bg-transparent border-transparent select-all focus:bg-white/5 font-medium shadow-none hover:bg-white/5"
                      )}
                      placeholder={readonly ? "" : "0"}
                    />
                  ))
                ))}
              </div>
            </div>

            {/* Right Bracket */}
            <div className="w-2.5 sm:w-3.5 border-r-2 border-t-2 border-b-2 border-blue-400/30 group-hover:border-blue-400/60 transition-colors duration-500 rounded-r-lg shrink-0 my-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
