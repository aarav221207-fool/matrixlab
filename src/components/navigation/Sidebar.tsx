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
  Infinity as InfinityIcon, 
  Shapes, 
  GitFork, 
  BarChart3, 
  Maximize2,
  Search,
  ChevronDown
} from 'lucide-react';
import { MathMode } from '../navigation/ModeNavigator';

interface SidebarProps {
  activeMode: MathMode;
  onSelectMode: (mode: MathMode) => void;
  onOpenSearch: () => void;
  className?: string;
}

interface NavCategory {
  title: string;
  items: {
    id: MathMode;
    shortName: string;
    fullName: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    title: 'LINEAR ALGEBRA',
    items: [
      { id: 'matrix', shortName: 'Matrix', fullName: 'Matrix Calculator', icon: Grid3X3 },
      { id: 'systems', shortName: 'Systems', fullName: 'Linear Systems Ax=B', icon: Network },
      { id: 'linear-algebra', shortName: 'Vectors', fullName: 'Vectors & Spaces', icon: Binary },
    ]
  },
  {
    title: 'CALCULUS',
    items: [
      { id: 'calculus', shortName: 'Derivatives', fullName: 'Calculus & Derivatives', icon: TrendingUp },
      { id: 'integral', shortName: 'Integrals', fullName: 'Indefinite & Definite Integrals', icon: Sigma },
      { id: 'differential', shortName: 'Diff Equations', fullName: 'Differential Equations (ODEs)', icon: Activity },
    ]
  },
  {
    title: 'TRANSFORMS',
    items: [
      { id: 'laplace', shortName: 'Laplace', fullName: 'Laplace Transform L{f(t)}', icon: Waves },
      { id: 'inverse-laplace', shortName: 'Inv. Laplace', fullName: 'Inverse Laplace L⁻¹{F(s)}', icon: CornerDownRight },
    ]
  },
  {
    title: 'FUNCTIONS',
    items: [
      { id: 'functions', shortName: 'Functions', fullName: 'Function Analysis & Domain', icon: FunctionSquare },
    ]
  },
  {
    title: 'ALGEBRA',
    items: [
      { id: 'algebra', shortName: 'Algebra', fullName: 'Algebra & Polynomials', icon: Variable },
      { id: 'precalculus', shortName: 'Pre-Calculus', fullName: 'Sequences, Series & Complex', icon: InfinityIcon },
    ]
  },
  {
    title: 'DISCRETE',
    items: [
      { id: 'discrete', shortName: 'Discrete', fullName: 'Relations, Sets & Logic', icon: GitFork },
    ]
  },
  {
    title: 'STATISTICS & PROBABILITY',
    items: [
      { id: 'probability-statistics', shortName: 'Statistics', fullName: 'Probability & Statistics', icon: BarChart3 },
    ]
  },
  {
    title: 'GEOMETRY & OPTIMIZATION',
    items: [
      { id: 'geometry', shortName: 'Geometry', fullName: '2D & 3D Geometry', icon: Shapes },
      { id: 'linear-programming', shortName: 'Lin. Programming', fullName: 'Linear Programming Simplex', icon: Maximize2 },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeMode,
  onSelectMode,
  onOpenSearch,
  className = ''
}) => {
  // Collapsible state for each category
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catTitle: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catTitle]: !prev[catTitle]
    }));
  };

  return (
    <aside 
      aria-label="Mathematical navigation"
      className={`w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 overflow-y-auto scrollbar-thin ${className}`}
    >
      {/* Quick Search trigger */}
      <div className="p-3 border-b border-slate-800/80">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-blue-400" />
            <span>Search tools...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Categories and Items */}
      <div className="p-2 space-y-4 flex-1">
        {NAV_CATEGORIES.map((cat) => {
          const isCollapsed = collapsedCategories[cat.title];
          const hasActiveItem = cat.items.some(i => i.id === activeMode);

          return (
            <div key={cat.title} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.title)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-left text-[11px] font-semibold text-slate-400 hover:text-slate-200 tracking-wider transition-colors"
              >
                <span>{cat.title}</span>
                <ChevronDown 
                  size={12} 
                  className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
                />
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="space-y-0.5 pt-0.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeMode;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectMode(item.id)}
                        className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600/15 text-white font-medium border border-blue-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                        }`}
                      >
                        {/* Active vertical accent bar */}
                        {isActive ? (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full" />
                        ) : (
                          /* Hover-extending subtle bar */
                          <div className="absolute left-0 top-2 bottom-2 w-0 group-hover:w-1 bg-slate-600 rounded-r-full transition-all duration-200" />
                        )}

                        <Icon 
                          size={16} 
                          className={`shrink-0 transition-colors ${
                            isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`} 
                        />

                        {/* Title and smooth extending indicator line */}
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span className="text-xs truncate">
                            {item.shortName}
                          </span>

                          {/* Subtle extending accent line on hover */}
                          <div className="w-0 group-hover:w-8 h-px bg-blue-500/40 transition-all duration-200 ease-out shrink-0 ml-2" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
