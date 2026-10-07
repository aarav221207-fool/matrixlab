import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Check, Copy } from 'lucide-react';
import { MathStep, VisualMathStep } from './MathStep';

interface StepsPanelProps {
  steps: (string | VisualMathStep)[];
  title?: string;
  defaultOpen?: boolean;
  className?: string;
}

export const StepsPanel: React.FC<StepsPanelProps> = ({
  steps,
  title = 'Mathematical Derivation',
  defaultOpen = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  if (!steps || steps.length === 0) return null;

  // Convert raw strings or objects into standardized VisualMathStep
  const visualSteps: VisualMathStep[] = steps.map((s, idx) => {
    if (typeof s !== 'string') {
      return {
        ...s,
        stepNumber: s.stepNumber || idx + 1
      };
    }

    const trimmed = s.trim();

    // Check if string contains standard transformation pattern e.g. "A = ... -> B = ..."
    if (trimmed.includes('->') || trimmed.includes('→')) {
      const parts = trimmed.split(/->|→/);
      return {
        stepNumber: idx + 1,
        title: `Step ${idx + 1}`,
        before: parts[0].trim(),
        after: parts[1].trim(),
        operation: 'Transformation',
        type: 'general'
      };
    }

    // Check if string is row operation e.g. "R2 <- R2 - 3R1" or "R2 -> R2 - 3R1"
    if (trimmed.match(/R\d+\s*(?:<-|←|->|→)\s*/i)) {
      return {
        stepNumber: idx + 1,
        title: 'Elementary Row Operation',
        operation: trimmed,
        explanation: 'Apply linear combination to eliminate pivot column entries and progress toward echelon form.',
        type: 'matrix'
      };
    }

    // Check for rule application: "Rule: ...", "Identity: ..."
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && colonIdx < 35) {
      const prefix = trimmed.substring(0, colonIdx).trim();
      const rest = trimmed.substring(colonIdx + 1).trim();
      return {
        stepNumber: idx + 1,
        title: prefix,
        explanation: rest,
        type: idx === steps.length - 1 ? 'conclusion' : 'general'
      };
    }

    return {
      stepNumber: idx + 1,
      title: `Step ${idx + 1}`,
      explanation: trimmed,
      type: idx === steps.length - 1 ? 'conclusion' : 'general'
    };
  });

  const handleCopySteps = () => {
    const text = visualSteps.map(s => {
      let line = `[Step ${s.stepNumber}] ${s.title}`;
      if (s.rule) line += `\n  Rule: ${s.rule}`;
      if (s.expression) line += `\n  Expression: ${s.expression}`;
      if (s.before) line += `\n  Initial: ${typeof s.before === 'string' ? s.before : JSON.stringify(s.before)}`;
      if (s.operation) line += `\n  Operation: ↓ ${s.operation}`;
      if (s.transformation) line += `\n  Transformation: ${s.transformation}`;
      if (s.after) line += `\n  Result: ${typeof s.after === 'string' ? s.after : JSON.stringify(s.after)}`;
      if (s.explanation) line += `\n  Why: ${s.explanation}`;
      return line;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={`w-full max-w-full min-w-0 mt-8 ${className}`}>
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-1 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-serif font-bold text-slate-100 break-words">
              {title}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {visualSteps.length} derivation step{visualSteps.length !== 1 ? 's' : ''} in sequence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopySteps}
            title="Copy all derivation steps"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Steps'}</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]"
          >
            <span>{isOpen ? 'Collapse' : 'Expand'}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Steps List */}
      {isOpen && (
        <div className="w-full max-w-full min-w-0 space-y-1">
          {visualSteps.map((step, idx) => (
            <MathStep 
              key={idx} 
              step={step} 
              isLast={idx === visualSteps.length - 1} 
            />
          ))}
        </div>
      )}
    </section>
  );
};
