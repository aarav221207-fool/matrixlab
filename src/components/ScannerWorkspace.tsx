import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { MatrixData, MatrixModel } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ScanTask {
  id: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  result?: any;
  error?: string;
}

interface ScannerWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatrix: (matrix: MatrixData) => void;
}

export function ScannerWorkspace({ isOpen, onClose, onAddMatrix }: ScannerWorkspaceProps) {
  const [tasks, setTasks] = useState<ScanTask[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (task: ScanTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing', error: undefined } : t));
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(task.file);
      });

      const apiUrl = (import.meta as any).env.VITE_SCANNER_API_URL || '/api/scan';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: task.file.type
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan image');
      }

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'success', result: data } : t));
    } catch (err: any) {
      console.error(err);
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        status: 'error', 
        error: err.message || 'Matrix scanner service is unavailable. MatrixLab calculations remain fully available.' 
      } : t));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newTasks: ScanTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued'
    }));

    setTasks(prev => [...prev, ...newTasks]);
    
    // Process all new tasks
    newTasks.forEach(task => processFile(task));
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const retryTask = (task: ScanTask) => {
    processFile(task);
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleApply = (task: ScanTask) => {
    if (task.result && task.result.matrix) {
      const stringMatrix = task.result.matrix.map((row: number[]) => row.map((val: number) => val.toString()));
      onAddMatrix(stringMatrix);
      removeTask(task.id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Camera className="text-blue-400" />
              Batch Matrix Scanner
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors">
              <X />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div 
              className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                <Upload className="w-6 h-6 text-white/60 group-hover:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Select Images</h3>
              <p className="text-white/40 text-sm">Upload multiple photos to extract them into your workspace.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                multiple
                capture="environment"
                onChange={handleFileChange}
              />
            </div>

            {tasks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Scan Queue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col relative overflow-hidden">
                      <button onClick={() => removeTask(task.id)} className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                      
                      <div className="flex gap-4">
                        <img src={task.previewUrl} alt="Preview" className="w-24 h-24 rounded-lg object-cover bg-black/50 border border-white/10 shrink-0" />
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {task.status === 'queued' || task.status === 'processing' ? (
                            <div className="flex items-center gap-2 text-blue-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm font-medium">Processing...</span>
                            </div>
                          ) : task.status === 'error' ? (
                            <div className="text-red-400">
                              <div className="flex items-center gap-1 mb-1">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-sm font-medium truncate">Scan Failed</span>
                              </div>
                              <p className="text-xs opacity-80 line-clamp-2">{task.error}</p>
                              <button 
                                onClick={() => retryTask(task)}
                                className="mt-2 flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-white"
                              >
                                <RefreshCw size={12} /> Retry
                              </button>
                            </div>
                          ) : task.status === 'success' && task.result ? (
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-white text-sm font-semibold">
                                  {task.result.rows}×{task.result.columns} Matrix
                                </h4>
                                {task.result.confidence && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${task.result.confidence > 0.8 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                    {Math.round(task.result.confidence * 100)}% Conf
                                  </span>
                                )}
                              </div>
                              <div className="bg-black/30 p-2 rounded text-xs font-mono text-white/80 max-h-16 overflow-y-auto mb-2 scrollbar-thin">
                                {task.result.matrix.map((row: number[], i: number) => (
                                  <div key={i} className="flex gap-2 justify-center">
                                    {row.map((val, j) => <span key={j}>{val}</span>)}
                                  </div>
                                ))}
                              </div>
                              <button 
                                onClick={() => handleApply(task)}
                                className="w-full flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
                              >
                                <Plus size={14} /> Add to Workspace
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
