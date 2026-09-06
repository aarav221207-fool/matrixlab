import React from 'react';
import { X, ChevronRight, Calculator, Search, FileText, Camera, Sliders } from 'lucide-react';
import { MathMode, MODES } from '../navigation/ModeNavigator';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: MathMode;
  onSelectMode: (mode: MathMode) => void;
  onOpenSearch: () => void;
  onOpenEqModal?: () => void;
  onOpenScanner?: () => void;
  precision?: number;
  onPrecisionChange?: (p: number) => void;
}

const CATEGORIES = [
  'Linear Algebra',
  'Calculus & ODEs',
  'Functions & Algebra',
  'Geometry',
  'Discrete & Optimization'
] as const;

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  activeMode,
  onSelectMode,
  onOpenSearch,
  onOpenEqModal,
  onOpenScanner,
  precision = 4,
  onPrecisionChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-80 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Calculator size={18} />
            </div>
            <span className="font-serif font-bold text-slate-100 text-lg">MatrixLab</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search button in mobile drawer */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-sm min-h-[44px]"
          >
            <Search size={16} className="text-blue-400" />
            <span>Search mathematical tools...</span>
          </button>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenEqModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEqModal();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 min-h-[40px]"
              >
                <FileText size={14} className="text-purple-400" />
                <span>Eq → Matrix</span>
              </button>
            )}

            {onOpenScanner && (
              <button
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 text-xs font-medium border border-blue-500/30 min-h-[40px]"
              >
                <Camera size={14} className="text-blue-400" />
                <span>Vision Scan</span>
              </button>
            )}
          </div>

          {/* Precision Selector */}
          {onPrecisionChange && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Sliders size={13} className="text-slate-500" />
                <span>Precision:</span>
              </div>
              <select
                value={precision}
                onChange={(e) => onPrecisionChange(Number(e.target.value))}
                aria-label="Precision"
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-sans font-medium"
              >
                {[2, 3, 4, 5, 6, 8, 10].map(p => (
                  <option key={p} value={p} className="bg-slate-900 text-slate-200">
                    {p} Decimals
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Categorized Tools List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {CATEGORIES.map(cat => {
            const items = MODES.filter(m => m.category === cat);
            return (
              <div key={cat} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 tracking-wider">
                  {cat.toUpperCase()}
                </div>
                <div className="space-y-1">
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = item.id === activeMode;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectMode(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all min-h-[44px] ${
                          isActive
                            ? 'bg-blue-600/25 text-white font-medium border border-blue-500/40 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        {isActive && <ChevronRight size={16} className="text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
