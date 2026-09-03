import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, RefreshCw, Plus, Check } from 'lucide-react';
import { MatrixData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { scanMatrixWithGemini } from '../lib/geminiScanner';

export interface ScanTask {
  id: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  result?: {
    rows: number;
    columns: number;
    matrix: number[][];
    confidence: number;
    notes?: string;
  };
  editedMatrix?: string[][];
  error?: string;
  added?: boolean;
}

interface ScannerWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatrix: (matrix: MatrixData) => void;
}

export function ScannerWorkspace({ isOpen, onClose, onAddMatrix }: ScannerWorkspaceProps) {
  const [tasks, setTasks] = useState<ScanTask[]>([]);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sequential queue worker: processes one queued task at a time
  const processNextTask = useCallback(async () => {
    if (isProcessingRef.current) return;

    // Find first queued task
    const nextTask = tasks.find(t => t.status === 'queued');
    if (!nextTask) return;

    isProcessingRef.current = true;
    setTasks(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: 'processing', error: undefined } : t));

    try {
      const res = await scanMatrixWithGemini(nextTask.file);

      if (!res.success || !res.matrix) {
        setTasks(prev => prev.map(t => t.id === nextTask.id ? {
          ...t,
          status: 'error',
          error: res.error || 'Unable to detect a valid matrix.',
        } : t));
      } else {
        const initialEdited = res.matrix.map((row: number[]) => row.map((val: number) => String(val)));
        setTasks(prev => prev.map(t => t.id === nextTask.id ? {
          ...t,
          status: 'success',
          result: {
            rows: res.rows!,
            columns: res.columns!,
            matrix: res.matrix!,
            confidence: res.confidence || 0.9,
            notes: res.notes,
          },
          editedMatrix: initialEdited,
        } : t));
      }
    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === nextTask.id ? {
        ...t,
        status: 'error',
        error: err?.message || 'Error occurred while scanning image.',
      } : t));
    } finally {
      isProcessingRef.current = false;
    }
  }, [tasks]);

  useEffect(() => {
    if (tasks.some(t => t.status === 'queued') && !isProcessingRef.current) {
      processNextTask();
    }
  }, [tasks, processNextTask]);

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

    const newTasks: ScanTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
    }));

    setTasks(prev => [...prev, ...newTasks]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (e.target) e.target.value = '';
  };

  const retryTask = (task: ScanTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'queued', error: undefined } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleApply = (task: ScanTask) => {
    const matrixToUse = task.editedMatrix || (task.result?.matrix ? task.result.matrix.map(r => r.map(c => String(c))) : null);
    if (matrixToUse) {
      onAddMatrix(matrixToUse);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, added: true } : t));
    }
  };

  const updateCell = (taskId: string, r: number, c: number, value: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId || !t.editedMatrix) return t;
      const updated = t.editedMatrix.map((row, i) =>
        row.map((cell, j) => (i === r && j === c ? value : cell))
      );
      return { ...t, editedMatrix: updated };
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
                <Camera size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Matrix Scanner</h2>
                <p className="text-xs text-white/50 hidden sm:block">Extract matrices from photos directly into your workspace</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close scanner"
              className="p-2.5 hover:bg-white/10 active:bg-white/20 rounded-full text-white/60 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
            {/* Direct Input Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Take Photo button for mobile / webcam */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 active:bg-blue-500/20 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[110px]"
              >
                <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Camera size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Take Photo</h3>
                <p className="text-white/40 text-xs mt-0.5">Capture printed or handwritten matrix</p>
                <input 
                  type="file" 
                  ref={cameraInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileChange}
                />
              </button>

              {/* Upload Images button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[110px]"
              >
                <div className="w-10 h-10 bg-white/10 text-white/70 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Upload Images</h3>
                <p className="text-white/40 text-xs mt-0.5">Select one or multiple images from device</p>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                    Scanned Queue ({tasks.length})
                  </h3>
                  <button
                    onClick={() => setTasks([])}
                    className="text-xs text-white/40 hover:text-red-400 py-1 px-2 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`bg-white/5 border rounded-xl p-4 flex flex-col relative transition-all ${
                        task.added ? 'border-green-500/40 bg-green-500/5' : 'border-white/10'
                      }`}
                    >
                      <button 
                        onClick={() => removeTask(task.id)} 
                        aria-label="Remove item"
                        className="absolute top-2 right-2 p-2 hover:bg-white/10 active:bg-white/20 rounded-full text-white/40 hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                      
                      <div className="flex gap-3 sm:gap-4 items-start">
                        <img 
                          src={task.previewUrl} 
                          alt="Matrix Preview" 
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover bg-black/50 border border-white/10 shrink-0" 
                        />
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center pr-6">
                          {task.status === 'queued' ? (
                            <div className="flex flex-col gap-1 py-2">
                              <span className="text-xs font-medium text-white/60">Queued for scanning...</span>
                              <p className="text-[11px] text-white/40">Waiting for previous scan to finish</p>
                            </div>
                          ) : task.status === 'processing' ? (
                            <div className="flex flex-col gap-2 py-2">
                              <div className="flex items-center gap-2 text-blue-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Extracting Matrix...</span>
                              </div>
                              <p className="text-xs text-white/40">Recognizing numerical matrix</p>
                            </div>
                          ) : task.status === 'error' ? (
                            <div className="text-red-400 space-y-1.5 py-1">
                              <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                <span className="text-sm font-semibold text-red-300">Scan Failed</span>
                              </div>
                              <p className="text-xs text-red-200/80 break-words leading-relaxed">{task.error}</p>
                              <button 
                                onClick={() => retryTask(task)}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 active:bg-white/25 px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
                              >
                                <RefreshCw size={13} /> Retry
                              </button>
                            </div>
                          ) : task.status === 'success' && task.result ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white text-sm font-bold">
                                  {task.result.rows}×{task.result.columns} Matrix
                                </h4>
                                {typeof task.result.confidence === 'number' && (
                                  <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                                    task.result.confidence > 0.8 
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  }`}>
                                    {Math.round(task.result.confidence * 100)}% Conf
                                  </span>
                                )}
                              </div>

                              {/* Matrix numbers preview / quick editor */}
                              <div className="bg-black/40 border border-white/5 p-2 rounded-lg text-xs font-mono text-white/90 overflow-x-auto max-h-32 scrollbar-thin">
                                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${task.result.columns}, minmax(0, 1fr))` }}>
                                  {task.editedMatrix?.map((row, rIdx) => 
                                    row.map((cell, cIdx) => (
                                      <input
                                        key={`${rIdx}-${cIdx}`}
                                        type="text"
                                        value={cell}
                                        onChange={(e) => updateCell(task.id, rIdx, cIdx, e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-white focus:border-blue-400 focus:bg-white/10 outline-none w-full min-w-[28px]"
                                      />
                                    ))
                                  )}
                                </div>
                              </div>

                              <div className="pt-1">
                                {task.added ? (
                                  <div className="flex items-center justify-center gap-1.5 py-2 text-green-400 text-xs font-semibold bg-green-500/10 rounded-lg border border-green-500/20">
                                    <Check size={15} /> Added to Workspace
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleApply(task)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] min-h-[40px]"
                                  >
                                    <Plus size={15} /> Add as New Matrix
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
              <div className="text-center py-6 text-white/40 text-xs sm:text-sm">
                No active scans. Capture or upload photos above to extract matrices directly from your browser.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
