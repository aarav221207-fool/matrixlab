import React, { useState } from 'react';
import { 
  Calculator, 
  Search, 
  Menu, 
  Camera, 
  FileText, 
  Sliders
} from 'lucide-react';
import { MathMode, MODES } from '../navigation/ModeNavigator';
import { Sidebar } from '../navigation/Sidebar';
import { MobileNavigation } from '../navigation/MobileNavigation';
import { ToolSearch } from '../design-system/ToolSearch';
import { NeuralMesh } from '../NeuralMesh';

interface AppShellProps {
  activeMode: MathMode;
  onSelectMode: (mode: MathMode) => void;
  onOpenScanner: () => void;
  onOpenEqModal: () => void;
  precision: number;
  onPrecisionChange: (p: number) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeMode,
  onSelectMode,
  onOpenScanner,
  onOpenEqModal,
  precision,
  onPrecisionChange,
  children
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const currentModeInfo = MODES.find(m => m.id === activeMode) || MODES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden relative flex flex-col">
      {/* Background Computation Mesh */}
      <NeuralMesh />

      {/* Global Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 shrink-0">
        <div className="max-w-[1700px] mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          {/* Left: Mobile Menu button & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>

            <button 
              onClick={() => onSelectMode('matrix')}
              className="flex items-center gap-1.5 sm:gap-2.5 text-left group shrink-0"
            >
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-600/30 transition-colors shrink-0">
                <Calculator size={18} />
              </div>
              <div className="shrink-0 flex items-center">
                <span className="font-serif font-bold text-base sm:text-xl tracking-tight text-slate-100 group-hover:text-blue-300 transition-colors whitespace-nowrap">
                  MatrixLab
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-blue-400 tracking-wider uppercase">
                  Workstation
                </span>
              </div>
            </button>
          </div>

          {/* Center Search Bar trigger (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Search size={16} className="text-blue-400" />
                <span>Search tools, algorithms, transforms...</span>
              </div>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick search button for mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search tools"
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
            >
              <Search size={18} />
            </button>

            {/* EQ to Matrix Button (Desktop / Tablet) */}
            <button
              onClick={onOpenEqModal}
              aria-label="Convert equations to matrix"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all min-h-[40px]"
            >
              <FileText size={15} className="text-purple-400" />
              <span>Equations → Matrix</span>
            </button>

            {/* Vision Scanner Button */}
            <button
              onClick={onOpenScanner}
              aria-label="Open matrix scanner"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-200 text-xs font-medium border border-blue-500/30 transition-all min-h-[40px] shrink-0"
            >
              <Camera size={16} className="text-blue-400" />
              <span className="hidden sm:inline">Vision Scan</span>
            </button>

            {/* Precision Selector (Tablet / Desktop) */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Sliders size={13} className="text-slate-500" />
              <select
                value={precision}
                onChange={(e) => onPrecisionChange(Number(e.target.value))}
                aria-label="Precision"
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-sans"
              >
                {[2, 3, 4, 5, 6, 8, 10].map(p => (
                  <option key={p} value={p} className="bg-slate-900 text-slate-200">
                    {p} Decimals
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body: Desktop Sidebar + Workspace */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto min-w-0">
        {/* Slim Desktop Navigation Rail */}
        <Sidebar
          activeMode={activeMode}
          onSelectMode={onSelectMode}
          onOpenSearch={() => setSearchOpen(true)}
          className="hidden lg:flex shrink-0"
        />

        {/* Workspace Canvas */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          <div className="max-w-5xl mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      <MobileNavigation
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeMode={activeMode}
        onSelectMode={onSelectMode}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenEqModal={onOpenEqModal}
        onOpenScanner={onOpenScanner}
        precision={precision}
        onPrecisionChange={onPrecisionChange}
      />

      {/* Quick Tool Search Modal */}
      <ToolSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectMode={onSelectMode}
      />
    </div>
  );
};
