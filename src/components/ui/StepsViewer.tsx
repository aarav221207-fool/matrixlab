import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ListOrdered, CheckCircle2 } from 'lucide-react';

interface StepsViewerProps {
  steps: (string | { title: string; rule?: string; expression?: string; description?: string })[];
  title?: string;
  defaultOpen?: boolean;
}

export const StepsViewer: React.FC<StepsViewerProps> = ({
  steps,
  title = 'Mathematical Steps & Reasoning',
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/30 overflow-hidden mt-4 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs uppercase tracking-wider">
          <ListOrdered size={15} className="text-blue-400" />
          <span>{title} ({steps.length} steps)</span>
        </div>
        <div className="text-white/50">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 border-t border-white/5 bg-black/40">
          {steps.map((step, idx) => {
            if (typeof step === 'string') {
              return (
                <div key={idx} className="flex items-start gap-3 text-xs text-white/80 font-mono">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <div className="pt-0.5 break-words leading-relaxed">{step}</div>
                </div>
              );
            }

            return (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                <div className="flex items-center justify-between text-blue-300 font-bold text-[11px] uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-blue-400" />
                    <span>{step.title || `Step ${idx + 1}`}</span>
                  </div>
                  {step.rule && (
                    <span className="text-[9px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">
                      {step.rule}
                    </span>
                  )}
                </div>
                {step.expression && (
                  <div className="font-mono text-sm text-white/95 bg-black/50 p-2 rounded-lg border border-white/5 overflow-x-auto">
                    {step.expression}
                  </div>
                )}
                {step.description && (
                  <p className="text-[11px] text-white/60 leading-normal">{step.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
