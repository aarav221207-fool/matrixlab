import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ListOrdered, CheckCircle2 } from 'lucide-react';
import { MathRenderer } from '../design-system/MathRenderer';

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
    <div className="w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-black/30 overflow-hidden mt-4 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs uppercase tracking-wider">
          <ListOrdered size={15} className="text-blue-400 shrink-0" />
          <span>{title} ({steps.length} steps)</span>
        </div>
        <div className="text-white/50 shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 border-t border-white/5 bg-black/40 max-w-full min-w-0">
          {steps.map((step, idx) => {
            if (typeof step === 'string') {
              const hasMath = step.includes('=') || step.includes('\\') || step.includes('^') || step.includes('->') || step.includes('→');
              return (
                <div key={idx} className="flex items-start gap-3 text-xs text-white/80 max-w-full min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="pt-0.5 break-words leading-relaxed min-w-0 flex-1 overflow-x-auto">
                    {hasMath ? (
                      <MathRenderer expression={step} displayMode={false} size="sm" />
                    ) : (
                      step
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1.5 max-w-full min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1 text-blue-300 font-bold text-[11px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                    <span className="break-words">{step.title || `Step ${idx + 1}`}</span>
                  </div>
                  {step.rule && (
                    <span className="text-[9px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded break-words">
                      {step.rule}
                    </span>
                  )}
                </div>
                {step.expression && (
                  <div className="bg-black/50 p-2 rounded-lg border border-white/5 overflow-x-auto max-w-full min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <MathRenderer expression={step.expression} displayMode={true} size="sm" />
                  </div>
                )}
                {step.description && (
                  <p className="text-[11px] text-white/60 leading-normal break-words">{step.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
