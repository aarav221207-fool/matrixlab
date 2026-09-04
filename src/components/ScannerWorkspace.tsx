import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, X, Plus, AlertCircle, RefreshCw, Check, Zap } from 'lucide-react';
import { scanMatrixWithGemini, MatrixScanResult } from '../lib/geminiScanner';
import anime from 'animejs';

interface ScannerWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatrix: (matrix: string[][]) => void;
}

interface ScanTask {
  id: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  result?: MatrixScanResult;
  error?: string;
  editedMatrix?: string[][];
  added?: boolean;
}

export const ScannerWorkspace: React.FC<ScannerWorkspaceProps> = ({ isOpen, onClose, onAddMatrix }) => {
  const [tasks, setTasks] = useState<ScanTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      anime({
        targets: modalRef.current,
        translateY: ['100%', 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutExpo'
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  useEffect(() => {
    const processQueue = async () => {
      const nextTask = tasks.find(t => t.status === 'queued');
      if (!nextTask) return;

      setTasks(prev => prev.map(t => 
        t.id === nextTask.id ? { ...t, status: 'processing' } : t
      ));

      try {
        const result = await scanMatrixWithGemini(nextTask.file);
        setTasks(prev => prev.map(t => 
          t.id === nextTask.id ? { 
            ...t, 
            status: 'success', 
            result, 
            editedMatrix: (result.matrix as any)?.map((row: number[]) => row.map(v => String(v))) || []
          } : t
        ));
      } catch (error: any) {
        setTasks(prev => prev.map(t => 
          t.id === nextTask.id ? { 
            ...t, 
            status: 'error', 
            error: error.message || 'Failed to scan matrix' 
          } : t
        ));
      }
    };

    processQueue();
  }, [tasks]);

  const handleClose = () => {
    if (modalRef.current) {
      anime({
        targets: modalRef.current,
        translateY: [0, '100%'],
        opacity: [1, 0],
        duration: 400,
        easing: 'easeInQuad',
        complete: onClose
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const createTasksFromFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newTasks: ScanTask[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued'
    }));

    setTasks(prev => [...prev, ...newTasks]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) createTasksFromFiles(e.target.files);
    e.target.value = '';
  };

  const removeTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) URL.revokeObjectURL(task.previewUrl);
      return prev.filter(t => t.id !== id);
    });
  };

  const retryTask = (task: ScanTask) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'queued', error: undefined } : t
    ));
  };

  const updateCell = (taskId: string, r: number, c: number, val: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId || !t.editedMatrix) return t;
      const newMatrix = t.editedMatrix.map(row => [...row]);
      newMatrix[r][c] = val.replace(/[^0-9.\-eE+]/g, '');
      return { ...t, editedMatrix: newMatrix };
    }));
  };

  const handleApply = (task: ScanTask) => {
    if (task.editedMatrix) {
      onAddMatrix(task.editedMatrix);
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, added: true } : t
      ));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 pb-0">
      <div 
        ref={modalRef}
        className="bg-slate-900 border-t border-x sm:border border-blue-500/30 w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.2)] max-h-[90vh] flex flex-col relative overflow-hidden"
      >
        {/* Animated Scanner Header */}
        <div className="bg-slate-900 border-b border-blue-500/20 p-4 sm:p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Vision Scanner</h2>
              <p className="text-xs text-blue-300/70 font-mono">NEURAL_EXTRACTION_ENGINE_V1</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors relative z-10"
            aria-label="Close Scanner"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="glass-panel flex flex-col items-center justify-center p-6 rounded-2xl hover:bg-blue-500/10 active:bg-blue-500/20 hover:border-blue-500/40 transition-all group min-h-[120px]"
            >
              <div className="bg-blue-500/20 p-3 rounded-full text-blue-400 group-hover:scale-110 group-active:scale-95 transition-transform mb-3">
                <Camera size={28} />
              </div>
              <p className="text-white font-semibold">Camera</p>
              <p className="text-xs text-white/50 mt-1">Capture math</p>
              <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileChange}
              />
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="glass-panel flex flex-col items-center justify-center p-6 rounded-2xl hover:bg-purple-500/10 active:bg-purple-500/20 hover:border-purple-500/40 transition-all group min-h-[120px]"
            >
              <div className="bg-purple-500/20 p-3 rounded-full text-purple-400 group-hover:scale-110 group-active:scale-95 transition-transform mb-3">
                <ImageIcon size={28} />
              </div>
              <p className="text-white font-semibold">Gallery</p>
              <p className="text-xs text-white/50 mt-1">Select images</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp,image/heic,image/gif" 
                multiple
                onChange={handleFileChange}
              />
            </button>
          </div>

          {/* Task Queue */}
          {tasks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-widest font-mono">
                  Processing Queue ({tasks.length})
                </h3>
                <button
                  onClick={() => setTasks([])}
                  className="text-xs text-red-400/70 hover:text-red-400 py-1 px-2 rounded transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`bg-slate-900 border rounded-xl p-4 flex flex-col relative transition-all shadow-lg ${
                      task.added ? 'border-green-500/40 bg-green-900/10' : 'border-blue-500/20 hover:border-blue-500/40'
                    }`}
                  >
                    <button 
                      onClick={() => removeTask(task.id)} 
                      className="absolute top-2 right-2 p-2 hover:bg-white/10 active:bg-white/20 rounded-full text-white/40 hover:text-red-400 transition-colors z-20"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="flex gap-4 items-start">
                      <div className="relative rounded-lg overflow-hidden shrink-0 border border-white/10 w-24 h-24 bg-black">
                        <img 
                          src={task.previewUrl} 
                          alt="Scan preview" 
                          className="w-full h-full object-cover opacity-70"
                        />
                        {task.status === 'processing' && (
                          <div className="absolute inset-0 z-10 pointer-events-none">
                            <div className="w-full h-1 bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-scan-line"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center pr-6">
                        {task.status === 'queued' ? (
                          <div className="flex flex-col gap-1 py-2">
                            <span className="text-xs font-medium text-white/60">Queued for scanning...</span>
                            <p className="text-[10px] text-white/40 font-mono">WAITING</p>
                          </div>
                        ) : task.status === 'processing' ? (
                          <div className="flex flex-col gap-2 py-2">
                            <div className="flex items-center gap-2 text-blue-400">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="text-sm font-bold tracking-tight">Extracting...</span>
                            </div>
                            <p className="text-[10px] text-blue-300/50 font-mono uppercase">Neural recognition active</p>
                          </div>
                        ) : task.status === 'error' ? (
                          <div className="text-red-400 space-y-1.5 py-1">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                              <span className="text-sm font-bold text-red-300">Scan Failed</span>
                            </div>
                            <p className="text-xs text-red-200/80 break-words leading-relaxed">{task.error}</p>
                            <button 
                              onClick={() => retryTask(task)}
                              className="mt-2 inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
                            >
                              <RefreshCw size={13} /> Retry
                            </button>
                          </div>
                        ) : task.status === 'success' && task.result ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white text-sm font-bold font-mono">
                                {task.result.rows}×{task.result.columns}
                              </h4>
                              {typeof task.result.confidence === 'number' && (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                                  task.result.confidence > 0.8 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {Math.round(task.result.confidence * 100)}% CONF
                                </span>
                              )}
                            </div>
                            
                            {/* Matrix preview editor */}
                            <div className="bg-black/50 border border-white/10 p-2 rounded-lg text-xs font-mono overflow-x-auto scrollbar-thin">
                              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${task.result.columns}, minmax(0, 1fr))` }}>
                                {task.editedMatrix?.map((row, rIdx) => 
                                  row.map((cell, cIdx) => (
                                    <input
                                      key={`${rIdx}-${cIdx}`}
                                      type="text"
                                      value={cell}
                                      onChange={(e) => updateCell(task.id, rIdx, cIdx, e.target.value)}
                                      className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-blue-300 focus:border-blue-400 focus:bg-white/10 outline-none w-full min-w-[28px] glow-focus transition-all"
                                    />
                                  ))
                                )}
                              </div>
                            </div>
                            
                            <div className="pt-1">
                              {task.added ? (
                                <div className="flex items-center justify-center gap-1.5 py-2 text-green-400 text-xs font-bold bg-green-500/10 rounded-lg border border-green-500/20 uppercase tracking-wide">
                                  <Check size={14} /> Added
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleApply(task)}
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)] uppercase tracking-wide"
                                >
                                  <Plus size={14} /> Import to Workspace
                                </button>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-white/30">
              <Zap size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium tracking-wide">SYSTEM STANDBY</p>
              <p className="text-xs font-mono mt-1 opacity-70">Capture or upload media to initialize extraction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
