import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Calculator, CornerDownLeft } from 'lucide-react';
import { MathMode, MODES, ModeInfo } from '../navigation/ModeNavigator';

interface ToolSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: MathMode) => void;
}

interface SearchItem {
  id: MathMode;
  name: string;
  category: string;
  description: string;
  keywords: string[];
}

export const SEARCH_INDEX: SearchItem[] = [
  // Linear Algebra
  {
    id: 'matrix',
    name: 'Matrix Calculator',
    category: 'Linear Algebra',
    description: 'Multi-matrix workspace, determinant, inverse, transpose, power, RREF, rank, nullity, eigenvalues, LU, QR',
    keywords: ['matrix', 'determinant', 'det', 'inverse', 'inv', 'rank', 'rref', 'eigenvalue', 'eigenvector', 'nullity', 'trace', 'transpose', 'lu', 'qr', 'scanner', 'vision']
  },
  {
    id: 'systems',
    name: 'Linear Systems (Ax = B)',
    category: 'Linear Algebra',
    description: 'Solve system of linear equations, augmented matrix, Gaussian elimination, unique and parametric infinite solutions',
    keywords: ['linear system', 'systems', 'ax=b', 'gaussian elimination', 'row reduction', 'equations', 'cramer', 'augmented']
  },
  {
    id: 'linear-algebra',
    name: 'Vectors & Vector Spaces',
    category: 'Linear Algebra',
    description: 'Dot and cross product, vector projection, Gram-Schmidt orthonormalization, column/null space, least squares regression',
    keywords: ['vector', 'dot product', 'cross product', 'projection', 'gram-schmidt', 'orthonormal', 'column space', 'null space', 'basis', 'least squares']
  },

  // Calculus
  {
    id: 'calculus',
    name: 'Calculus & Derivatives',
    category: 'Calculus',
    description: '1st, 2nd, and nth order derivatives, multivariable partial derivatives, gradient vectors, Taylor and Maclaurin series',
    keywords: ['derivative', 'diff', 'differentiation', 'calculus', 'partial derivative', 'gradient', 'taylor series', 'maclaurin', 'product rule', 'chain rule']
  },
  {
    id: 'integral',
    name: 'Integrals',
    category: 'Calculus',
    description: 'Indefinite integration with + C, definite integrals, and numerical integration via Simpson quadrature',
    keywords: ['integral', 'integrate', 'integration', 'antiderivative', 'definite integral', 'simpson rule', 'area under curve']
  },
  {
    id: 'differential',
    name: 'Differential Equations',
    category: 'Calculus',
    description: '1st order separable and linear ODEs, 2nd order constant-coefficient linear ODEs, initial value problems (IVP)',
    keywords: ['differential equations', 'ode', 'differential', 'separable', 'integrating factor', 'characteristic equation', 'ivp', 'initial value']
  },

  // Transforms
  {
    id: 'laplace',
    name: 'Laplace Transform',
    category: 'Transforms',
    description: 'Unilateral Laplace transforms L{f(t)} = F(s) for powers, exponentials, sines, cosines, and frequency shifting',
    keywords: ['laplace', 'laplace transform', 'frequency domain', 's-domain', 'transform pair', 'transfer function']
  },
  {
    id: 'inverse-laplace',
    name: 'Inverse Laplace Transform',
    category: 'Transforms',
    description: 'Inverse Laplace L⁻¹{F(s)} = f(t) using partial fractions, first shifting theorem, and standard tables',
    keywords: ['inverse laplace', 'partial fractions', 'heaviside', 'time domain', 'shift theorem', 'bromwich']
  },

  // Functions
  {
    id: 'functions',
    name: 'Function Analysis',
    category: 'Functions',
    description: 'Mathematical domain and range, roots, vertical and horizontal asymptotes, parity/symmetry, and function composition',
    keywords: ['function', 'domain', 'range', 'asymptote', 'roots', 'zeros', 'composition', 'f(g(x))', 'symmetry', 'even', 'odd']
  },

  // Algebra & Pre-Calculus
  {
    id: 'algebra',
    name: 'Algebra & Polynomials',
    category: 'Algebra',
    description: 'Quadratic formula discriminant Δ, completing the square, polynomial division, factoring, and linear equation solver',
    keywords: ['algebra', 'quadratic', 'discriminant', 'completing square', 'polynomial', 'factoring', 'roots', 'linear equation']
  },
  {
    id: 'precalculus',
    name: 'Pre-Calculus & Complex Numbers',
    category: 'Algebra',
    description: 'Arithmetic and geometric sequences, infinite series convergence, Binomial Theorem expansion, complex numbers in polar/Euler form',
    keywords: ['precalculus', 'sequence', 'series', 'geometric series', 'binomial', 'binomial theorem', 'complex', 'polar', 'euler', 'de moivre']
  },

  // Discrete
  {
    id: 'discrete',
    name: 'Discrete Mathematics',
    category: 'Discrete',
    description: 'Binary relations with counterexamples, set union/intersection/cartesian product, and propositional truth tables',
    keywords: ['discrete', 'relation', 'reflexive', 'symmetric', 'transitive', 'equivalence', 'set', 'truth table', 'logic', 'boolean', 'tautology']
  },

  // Statistics & Probability
  {
    id: 'probability-statistics',
    name: 'Probability & Statistics',
    category: 'Statistics & Probability',
    description: 'Summary statistics (mean, median, variance, std dev, IQR), Pearson linear regression (r, r²), Normal and Binomial distributions',
    keywords: ['statistics', 'probability', 'mean', 'median', 'variance', 'standard deviation', 'regression', 'normal distribution', 'binomial distribution', 'bayes', 'z-score']
  },

  // Geometry & Optimization
  {
    id: 'geometry',
    name: '2D & 3D Geometry',
    category: 'Geometry',
    description: 'Triangles (Heron formula), circles, rectangles, spheres, cylinders, and cones with surface areas and volumes',
    keywords: ['geometry', 'triangle', 'circle', 'sphere', 'cylinder', 'cone', 'heron', 'volume', 'surface area', 'perimeter']
  },
  {
    id: 'linear-programming',
    name: 'Linear Programming',
    category: 'Optimization',
    description: '2D graphical simplex solver, constraint boundary lines, feasible region polygon corner points, optimal objective Z',
    keywords: ['linear programming', 'optimization', 'simplex', 'feasible region', 'constraints', 'maximize', 'minimize', 'objective function']
  }
];

export const ToolSearch: React.FC<ToolSearchProps> = ({ isOpen, onClose, onSelectMode }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectMode(MODES[0].id); // or open search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = SEARCH_INDEX.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelectMode(filteredItems[selectedIndex].id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search mathematical tools (e.g., rank, laplace, derivative, simplex)..."
            className="w-full bg-transparent text-slate-100 text-base placeholder:text-slate-500 outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No mathematical tools found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-600 mt-1">Try searching &quot;matrix&quot;, &quot;laplace&quot;, or &quot;derivative&quot;</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectMode(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/40'
                      : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-100">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-medium text-blue-300/80 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center text-slate-400 shrink-0">
                    {isSelected ? (
                      <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                        <span>Open</span>
                        <CornerDownLeft size={14} />
                      </div>
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>{filteredItems.length} calculators indexed</span>
        </div>
      </div>
    </div>
  );
};
