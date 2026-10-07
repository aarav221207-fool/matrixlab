import React, { useMemo } from 'react';
import katex from 'katex';
import { expressionToLatex, isLatex } from '../../lib/latex';

export interface MathRendererProps {
  /**
   * Raw LaTeX string (e.g. "\\frac{1}{s^2}")
   */
  latex?: string;
  /**
   * Math expression (e.g. "1/s^2" or "t^2*exp(3*t)"). If `latex` prop is omitted,
   * this will be automatically converted to LaTeX via `expressionToLatex`.
   */
  expression?: string | number;
  /**
   * Whether to render in block display mode (displayMode: true) or inline (false).
   * Defaults to false when used inline, true when used in block math displays.
   */
  displayMode?: boolean;
  /**
   * Typographic scale
   */
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /**
   * Additional Tailwind classes for container
   */
  className?: string;
  /**
   * Whether to allow horizontal scrolling on small screens if equation exceeds container width
   */
  allowScroll?: boolean;
  /**
   * Fallback to display if KaTeX fails
   */
  errorFallback?: React.ReactNode;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  expression,
  displayMode = true,
  size = 'md',
  className = '',
  allowScroll = true,
  errorFallback
}) => {
  // Determine target LaTeX string
  const texString = useMemo(() => {
    if (latex !== undefined && latex !== null) {
      return String(latex).trim();
    }
    if (expression !== undefined && expression !== null) {
      const raw = String(expression).trim();
      return isLatex(raw) ? raw : expressionToLatex(expression);
    }
    return '';
  }, [latex, expression]);

  // Render KaTeX HTML
  const { renderedHtml, hasError } = useMemo(() => {
    if (!texString) {
      return { renderedHtml: '', hasError: false };
    }
    try {
      const html = katex.renderToString(texString, {
        throwOnError: false,
        displayMode,
        strict: false,
        trust: false, // Prevents \url or raw HTML execution for safety
        output: 'htmlAndMathml'
      });
      return { renderedHtml: html, hasError: false };
    } catch (err) {
      console.warn('KaTeX rendering error for expression:', texString, err);
      return { renderedHtml: '', hasError: true };
    }
  }, [texString, displayMode]);

  if (hasError && errorFallback) {
    return <>{errorFallback}</>;
  }

  // Size styling for KaTeX typography
  let sizeClass = '';
  switch (size) {
    case 'hero':
      sizeClass = 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
      break;
    case 'lg':
      sizeClass = 'text-lg sm:text-xl md:text-2xl';
      break;
    case 'md':
      sizeClass = 'text-base sm:text-lg';
      break;
    case 'sm':
    default:
      sizeClass = 'text-sm sm:text-base';
      break;
  }

  // If empty
  if (!renderedHtml) {
    return (
      <span className={`font-mono text-slate-400 ${sizeClass} ${className}`}>
        {texString || '—'}
      </span>
    );
  }

  return (
    <div
      className={`math-renderer-container max-w-full min-w-0 ${
        allowScroll ? 'overflow-x-auto scrollbar-thin' : 'overflow-hidden'
      } ${displayMode ? 'my-1 py-1' : 'inline-block align-middle'} ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <span
        className={`katex-root inline-block text-slate-100 select-all ${sizeClass}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};
