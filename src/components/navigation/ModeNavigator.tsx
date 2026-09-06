import React, { useState } from 'react';
import {
  Grid3X3,
  Network,
  Binary,
  TrendingUp,
  Sigma,
  Activity,
  Waves,
  CornerDownRight,
  FunctionSquare,
  Variable,
  Shapes,
  Infinity as InfinityIcon,
  GitFork,
  BarChart3,
  Maximize2,
  ChevronDown,
  Layers
} from 'lucide-react';

export type MathMode =
  | 'matrix'
  | 'systems'
  | 'linear-algebra'
  | 'calculus'
  | 'integral'
  | 'differential'
  | 'laplace'
  | 'inverse-laplace'
  | 'functions'
  | 'algebra'
  | 'geometry'
  | 'precalculus'
  | 'discrete'
  | 'probability-statistics'
  | 'linear-programming';

export interface ModeInfo {
  id: MathMode;
  name: string;
  category: 'Linear Algebra' | 'Calculus & ODEs' | 'Functions & Algebra' | 'Geometry' | 'Discrete & Optimization';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

export const MODES: ModeInfo[] = [
  // Linear Algebra
  {
    id: 'matrix',
    name: 'Matrix Calculator',
    category: 'Linear Algebra',
    icon: Grid3X3,
    description: 'Multi-matrix workspace, 29 operations, equations converter & vision scanner'
  },
  {
    id: 'systems',
    name: 'Linear Systems',
    category: 'Linear Algebra',
    icon: Network,
    description: 'Ax = B equation systems, augmented matrices, RREF and parametric solutions'
  },
  {
    id: 'linear-algebra',
    name: 'Vectors & Spaces',
    category: 'Linear Algebra',
    icon: Binary,
    description: 'Dot/cross products, Gram-Schmidt, column/null space, rank-nullity & least squares'
  },

  // Calculus & ODEs
  {
    id: 'calculus',
    name: 'Calculus & Derivatives',
    category: 'Calculus & ODEs',
    icon: TrendingUp,
    description: '1st/2nd/nth derivatives, partials, gradient, Taylor & Maclaurin expansions'
  },
  {
    id: 'integral',
    name: 'Integrals',
    category: 'Calculus & ODEs',
    icon: Sigma,
    description: 'Indefinite (+ C) and definite integrals with Simpson quadrature'
  },
  {
    id: 'differential',
    name: 'Differential Equations',
    category: 'Calculus & ODEs',
    icon: Activity,
    description: '1st order separable & linear, 2nd order constant-coefficient ODEs & IVP'
  },
  {
    id: 'laplace',
    name: 'Laplace Transform',
    category: 'Calculus & ODEs',
    icon: Waves,
    description: 'L{f(t)} transforms for powers, exponentials, sines, cosines & damping'
  },
  {
    id: 'inverse-laplace',
    name: 'Inverse Laplace',
    category: 'Calculus & ODEs',
    icon: CornerDownRight,
    description: 'L⁻¹{F(s)} inversion, partial fraction expansions & shift theorems'
  },

  // Functions & Algebra
  {
    id: 'functions',
    name: 'Function Calculator',
    category: 'Functions & Algebra',
    icon: FunctionSquare,
    description: 'Mathematical domain/range, roots, asymptotes, symmetry & composition f ∘ g'
  },
  {
    id: 'algebra',
    name: 'Algebra Calculator',
    category: 'Functions & Algebra',
    icon: Variable,
    description: 'Quadratic formula Δ, completing the square, polynomials & linear equations'
  },
  {
    id: 'precalculus',
    name: 'Pre-Calculus',
    category: 'Functions & Algebra',
    icon: InfinityIcon,
    description: 'Sequences, geometric series, binomial expansion & complex numbers'
  },

  // Geometry
  {
    id: 'geometry',
    name: 'Geometry Calculator',
    category: 'Geometry',
    icon: Shapes,
    description: '2D/3D shapes: Triangle Heron, Circle, Rectangle, Sphere, Cylinder, Cone'
  },

  // Discrete & Optimization
  {
    id: 'discrete',
    name: 'Discrete Mathematics',
    category: 'Discrete & Optimization',
    icon: GitFork,
    description: 'Binary relations with counterexamples, set algebra & propositional truth tables'
  },
  {
    id: 'probability-statistics',
    name: 'Probability & Stats',
    category: 'Discrete & Optimization',
    icon: BarChart3,
    description: 'Summary statistics, linear regression, Normal and Binomial distributions'
  },
  {
    id: 'linear-programming',
    name: 'Linear Programming',
    category: 'Discrete & Optimization',
    icon: Maximize2,
    description: '2D graphical simplex, feasible polygon corner points & optimal Z'
  }
];

interface ModeNavigatorProps {
  activeMode: MathMode;
  onSelectMode: (mode: MathMode) => void;
}

export const ModeNavigator: React.FC<ModeNavigatorProps> = ({ activeMode, onSelectMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeModeInfo = MODES.find(m => m.id === activeMode) || MODES[0];

  const categories = Array.from(new Set(MODES.map(m => m.category)));

  return (
    <div className="w-full mb-6">
      {/* Mobile Selector Dropdown */}
      <div className="md:hidden w-full relative">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-black/50 border border-white/10 rounded-2xl text-left glass-panel shadow-lg min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <activeModeInfo.icon size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-blue-400">
                {activeModeInfo.category}
              </div>
              <div className="text-sm font-bold text-white tracking-wide">
                {activeModeInfo.name}
              </div>
            </div>
          </div>
          <ChevronDown size={18} className={`text-white/50 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0B0F19] border border-white/15 rounded-2xl p-2 shadow-2xl max-h-[75vh] overflow-y-auto scrollbar-thin">
            {categories.map(cat => (
              <div key={cat} className="mb-3">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40">
                  {cat}
                </div>
                <div className="space-y-1">
                  {MODES.filter(m => m.category === cat).map(m => {
                    const Icon = m.icon;
                    const isActive = m.id === activeMode;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelectMode(m.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                          isActive
                            ? 'bg-blue-600/25 text-white border border-blue-500/40'
                            : 'hover:bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-blue-400' : 'text-white/40'} />
                        <span className="text-xs font-semibold">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Categorized Navigation Bar */}
      <div className="hidden md:flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 glass-panel shadow-inner">
            {MODES.map(m => {
              const Icon = m.icon;
              const isActive = m.id === activeMode;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMode(m.id)}
                  title={m.description}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-blue-400' : 'text-white/40'} />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Mode Banner Description */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-blue-950/20 border border-blue-500/15 text-xs text-blue-300/80">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono uppercase font-bold tracking-widest">
              {activeModeInfo.category}
            </span>
            <span className="font-semibold text-white">{activeModeInfo.name}</span>
            <span className="text-white/40">—</span>
            <span className="text-white/70">{activeModeInfo.description}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <Layers size={12} className="text-blue-400" />
            <span>Mode 1 of 15</span>
          </div>
        </div>
      </div>
    </div>
  );
};
