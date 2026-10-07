import React from 'react';

interface PresetItem {
  label: string;
  value: string;
}

interface CalculatorHeaderProps {
  category: string;
  title: string;
  description: string;
  presets?: PresetItem[];
  onSelectPreset?: (value: string) => void;
  badge?: string;
}

export const CalculatorHeader: React.FC<CalculatorHeaderProps> = ({
  category,
  title,
  description,
  presets,
  onSelectPreset,
  badge
}) => {
  return (
    <div className="w-full max-w-full min-w-0 pb-5 sm:pb-6 border-b border-slate-800/80 mb-6">
      {/* Contextual Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-blue-400 font-medium mb-2 min-w-0 max-w-full">
        <span className="truncate max-w-[140px] sm:max-w-none">{category}</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400 truncate max-w-[140px] sm:max-w-none">{title}</span>
        {badge && (
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[11px] font-semibold border border-blue-500/20 shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* Responsive Page Title with clamp sizing and natural wrapping */}
      <h1 
        className="font-serif font-bold text-slate-100 tracking-tight break-words max-w-full min-w-0"
        style={{ fontSize: 'clamp(1.5rem, 4vw + 0.4rem, 2.25rem)', lineHeight: 1.2 }}
      >
        {title}
      </h1>

      {/* Description */}
      <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed break-words">
        {description}
      </p>

      {/* Quick Presets / Examples if provided */}
      {presets && presets.length > 0 && onSelectPreset && (
        <div className="mt-4 flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Examples:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPreset(p.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 active:bg-blue-600/30 border border-slate-700/60 hover:border-blue-500/30 text-xs text-slate-300 hover:text-white transition-all min-h-[32px] max-w-full break-words text-left"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
