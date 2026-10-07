import React from 'react';
import { ArrowDown, CheckCircle2, ChevronRight, BookOpen, Lightbulb, GitCommit } from 'lucide-react';
import { MatrixDisplay } from './MatrixDisplay';
import { ResponsiveMathDisplay } from './ResponsiveMathDisplay';
import { MathRenderer } from './MathRenderer';

export interface VisualMathStep {
  stepNumber?: number | string;
  title: string;
  rule?: string;
  expression?: string;
  before?: string | (string | number)[][];
  operation?: string;
  after?: string | (string | number)[][];
  transformation?: string;
  explanation?: string;
  type?: 'derivative' | 'integral' | 'matrix' | 'equation' | 'laplace' | 'functionAnalysis' | 'relation' | 'rule' | 'conclusion' | 'general' | 'formula';
}

interface MathStepProps {
  step: VisualMathStep;
  isLast?: boolean;
  className?: string;
}

/**
 * Visual connector between mathematical steps:
 * Step
 *   ↓
 * Step
 */
export const StepConnector: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center my-3 relative select-none">
    <div className="w-0.5 h-3 bg-gradient-to-b from-blue-500/40 to-slate-700" />
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-blue-400 shadow-md my-0.5">
      <ArrowDown size={14} className="animate-pulse" />
      {label && <span className="text-[11px] font-mono font-medium text-slate-300">{label}</span>}
    </div>
    <div className="w-0.5 h-3 bg-gradient-to-b from-slate-700 to-blue-500/40" />
  </div>
);

/**
 * Specialized Derivative Step Component:
 * rule → expression → transformation → explanation
 */
export const DerivativeStepDisplay: React.FC<{ step: VisualMathStep }> = ({ step }) => (
  <div className="space-y-4">
    {/* Large Hero Mathematical Expression */}
    {(step.expression || step.before) && (
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
          Expression
        </span>
        <ResponsiveMathDisplay
          expression={step.expression || (step.before as string)}
          size="lg"
          highlightResult={false}
        />
      </div>
    )}

    {/* Rule & Formula box */}
    {step.rule && (
      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
        <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
          <BookOpen size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            Mathematical Rule / Theorem
          </div>
          <div className="text-sm font-serif text-blue-100 font-medium mt-0.5 break-words">
            {step.rule.includes('\\') || step.rule.includes('=') ? (
              <MathRenderer expression={step.rule} displayMode={false} size="sm" />
            ) : (
              step.rule
            )}
          </div>
        </div>
      </div>
    )}

    {/* Transformation details */}
    {(step.transformation || (step.operation && step.after)) && (
      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 max-w-full overflow-hidden">
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
          Transformation: {step.operation || 'Apply Rule'}
        </span>
        <div className="text-base sm:text-lg font-serif font-semibold text-slate-200 text-center max-w-full min-w-0">
          <MathRenderer
            expression={step.transformation || String(step.after)}
            displayMode={false}
            size="md"
          />
        </div>
      </div>
    )}

    {/* Resulting Expression */}
    {step.after && step.transformation && (
      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 flex flex-col items-center justify-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-blue-300 mb-1">
          Resulting Term
        </span>
        <ResponsiveMathDisplay
          expression={typeof step.after === 'string' ? step.after : JSON.stringify(step.after)}
          size="lg"
          highlightResult={true}
        />
      </div>
    )}

    {/* Clear "Why" Explanation */}
    {step.explanation && (
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
        <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <Lightbulb size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider">
            Why This Step Works
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mt-0.5 break-words">
            {step.explanation}
          </p>
        </div>
      </div>
    )}
  </div>
);

/**
 * Specialized Matrix Step Component:
 * large matrix → row operation → resulting matrix
 */
export const MatrixStepDisplay: React.FC<{ step: VisualMathStep }> = ({ step }) => {
  const isBeforeMatrix = Array.isArray(step.before);
  const isAfterMatrix = Array.isArray(step.after);

  return (
    <div className="space-y-4">
      {/* Before Matrix */}
      {isBeforeMatrix && (
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">
            Current Matrix State
          </span>
          <div className="w-full max-w-full min-w-0 overflow-x-auto flex justify-center py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            <MatrixDisplay matrix={step.before as (string | number)[][]} size="lg" />
          </div>
        </div>
      )}

      {/* Row Operation Indicator */}
      {step.operation && (
        <div className="flex flex-col items-center justify-center my-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-200 font-mono font-bold text-sm sm:text-base shadow-lg max-w-full overflow-x-auto">
            <GitCommit size={16} className="text-blue-400 shrink-0" />
            <span className="break-words">{step.operation}</span>
          </div>
        </div>
      )}

      {/* After Matrix */}
      {isAfterMatrix && (
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-blue-950/25 border-2 border-blue-500/40">
          <span className="text-[11px] font-mono uppercase tracking-widest text-blue-300 mb-2">
            Transformed Matrix
          </span>
          <div className="w-full max-w-full min-w-0 overflow-x-auto flex justify-center py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            <MatrixDisplay matrix={step.after as (string | number)[][]} size="lg" />
          </div>
        </div>
      )}

      {/* Explanation of WHY */}
      {step.explanation && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <Lightbulb size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              Operation Objective
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mt-0.5 break-words">
              {step.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * General & Versatile Math Step Component
 */
export const MathStep: React.FC<MathStepProps> = ({ step, isLast = false, className = '' }) => {
  const isMatrixStep = Array.isArray(step.before) || Array.isArray(step.after) || step.type === 'matrix';
  const isDerivativeStep = step.type === 'derivative' || Boolean(step.rule && step.expression);

  return (
    <div className={`relative group w-full max-w-full min-w-0 ${className}`}>
      {/* Step Card Container */}
      <div className={`p-4 sm:p-6 rounded-2xl transition-all duration-200 w-full max-w-full min-w-0 ${
        step.type === 'conclusion'
          ? 'bg-blue-950/30 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10'
          : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700/90 shadow-md'
      }`}>
        {/* Step Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600/20 text-blue-300 font-mono font-bold text-sm border border-blue-500/30 shrink-0">
              {typeof step.stepNumber === 'number' ? String(step.stepNumber).padStart(2, '0') : step.stepNumber}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-base sm:text-lg font-serif font-bold text-slate-100 tracking-wide break-words">
                {step.title}
              </h4>
            </div>
          </div>

          {step.rule && !isDerivativeStep && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 max-w-full">
              <ChevronRight size={13} className="text-blue-400 shrink-0" />
              <span className="break-words">{step.rule}</span>
            </span>
          )}
        </div>

        {/* Step Body */}
        <div className="pt-4">
          {isMatrixStep ? (
            <MatrixStepDisplay step={step} />
          ) : isDerivativeStep ? (
            <DerivativeStepDisplay step={step} />
          ) : (
            <div className="space-y-4">
              {/* Primary Mathematical Display */}
              {(step.expression || step.before) && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center">
                  <ResponsiveMathDisplay
                    expression={step.expression || (step.before as string)}
                    size="lg"
                    highlightResult={false}
                  />
                </div>
              )}

              {/* Transformation Indicator */}
              {(step.operation || step.transformation) && (
                <div className="flex flex-col items-center justify-center py-1">
                  {step.operation && (
                    <span className="px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-1 tracking-wide">
                      {step.operation}
                    </span>
                  )}
                  <ArrowDown size={18} className="text-blue-400" />
                </div>
              )}

              {/* After expression */}
              {step.after && (
                <div className="p-4 rounded-xl bg-blue-950/25 border border-blue-500/30 flex flex-col items-center justify-center">
                  <ResponsiveMathDisplay
                    expression={typeof step.after === 'string' ? step.after : JSON.stringify(step.after)}
                    size="lg"
                    highlightResult={true}
                  />
                </div>
              )}

              {/* Explanation of WHY */}
              {step.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <Lightbulb size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                      Explanation
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mt-0.5 break-words">
                      {step.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Visual Step Connector to next step if not last */}
      {!isLast && <StepConnector />}
    </div>
  );
};
