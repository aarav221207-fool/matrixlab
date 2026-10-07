import React, { useState } from 'react';
import {
  calculateCircle,
  calculateTriangleHeron,
  calculateRectangle,
  calculateSphere,
  calculateCylinder,
  calculateCone,
  calculateCuboid,
  GeometryResult
} from '../../math/geometryEngine';
import { StepsViewer } from '../../components/ui/StepsViewer';
import { MathRenderer } from '../../components/design-system/MathRenderer';
import { Play, Shapes, AlertCircle } from 'lucide-react';

type ShapeType = 'circle' | 'triangle' | 'rectangle' | 'sphere' | 'cylinder' | 'cone' | 'cuboid';

export const GeometryMode: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<ShapeType>('circle');

  // Shape params
  const [radius, setRadius] = useState<number>(5);
  const [height, setHeight] = useState<number>(10);
  const [sideA, setSideA] = useState<number>(3);
  const [sideB, setSideB] = useState<number>(4);
  const [sideC, setSideC] = useState<number>(5);
  const [length, setLength] = useState<number>(8);
  const [width, setWidth] = useState<number>(4);
  const [depth, setDepth] = useState<number>(6);

  const [result, setResult] = useState<GeometryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    try {
      let res: GeometryResult;
      switch (selectedShape) {
        case 'circle':
          res = calculateCircle(radius);
          break;
        case 'triangle':
          res = calculateTriangleHeron(sideA, sideB, sideC);
          break;
        case 'rectangle':
          res = calculateRectangle(length, width);
          break;
        case 'sphere':
          res = calculateSphere(radius);
          break;
        case 'cylinder':
          res = calculateCylinder(radius, height);
          break;
        case 'cone':
          res = calculateCone(radius, height);
          break;
        case 'cuboid':
          res = calculateCuboid(length, width, depth);
          break;
      }
      setResult(res);
    } catch (e: any) {
      setError(e.message);
      setResult(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Shape Selector Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 glass-panel overflow-x-auto scrollbar-none">
        {[
          { id: 'circle', label: 'Circle (2D)' },
          { id: 'triangle', label: 'Triangle (2D Heron)' },
          { id: 'rectangle', label: 'Rectangle (2D)' },
          { id: 'sphere', label: 'Sphere (3D)' },
          { id: 'cylinder', label: 'Cylinder (3D)' },
          { id: 'cone', label: 'Cone (3D)' },
          { id: 'cuboid', label: 'Cuboid / Box (3D)' }
        ].map(s => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedShape(s.id as any);
              setResult(null);
              setError(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap uppercase tracking-wider transition-all ${
              selectedShape === s.id
                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input section & Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white/70">
            Geometric Dimensions & Parameters
          </h3>

          <div className="space-y-3">
            {(selectedShape === 'circle' || selectedShape === 'sphere' || selectedShape === 'cylinder' || selectedShape === 'cone') && (
              <div>
                <label className="text-[11px] font-mono text-white/50 block mb-1">Radius (r)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={radius}
                  onChange={e => setRadius(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}

            {(selectedShape === 'cylinder' || selectedShape === 'cone') && (
              <div>
                <label className="text-[11px] font-mono text-white/50 block mb-1">Height (h)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={height}
                  onChange={e => setHeight(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}

            {selectedShape === 'triangle' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Side a</label>
                  <input
                    type="number"
                    value={sideA}
                    onChange={e => setSideA(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Side b</label>
                  <input
                    type="number"
                    value={sideB}
                    onChange={e => setSideB(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Side c</label>
                  <input
                    type="number"
                    value={sideC}
                    onChange={e => setSideC(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}

            {(selectedShape === 'rectangle' || selectedShape === 'cuboid') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Length (l)</label>
                  <input
                    type="number"
                    value={length}
                    onChange={e => setLength(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/50 block mb-1">Width (w)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={e => setWidth(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}

            {selectedShape === 'cuboid' && (
              <div>
                <label className="text-[11px] font-mono text-white/50 block mb-1">Depth / Height (h)</label>
                <input
                  type="number"
                  value={depth}
                  onChange={e => setDepth(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Play size={14} fill="currentColor" /> Calculate Metrics
          </button>
        </div>

        {/* Vector SVG Diagram Representation */}
        <div className="p-5 rounded-3xl bg-black/40 border border-white/10 glass-panel flex flex-col items-center justify-center min-h-[220px]">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">
            Geometric Profile Diagram
          </div>
          <svg width="180" height="150" viewBox="0 0 180 150" className="text-blue-400">
            {selectedShape === 'circle' && (
              <g>
                <circle cx="90" cy="75" r="50" fill="rgba(59, 130, 246, 0.15)" stroke="#60A5FA" strokeWidth="2" />
                <line x1="90" y1="75" x2="140" y2="75" stroke="#93C5FD" strokeDasharray="3,3" strokeWidth="1.5" />
                <circle cx="90" cy="75" r="3" fill="#93C5FD" />
                <text x="110" y="70" fill="#93C5FD" fontSize="10" fontFamily="monospace">r = {radius}</text>
              </g>
            )}
            {selectedShape === 'triangle' && (
              <g>
                <polygon points="90,25 35,120 145,120" fill="rgba(59, 130, 246, 0.15)" stroke="#60A5FA" strokeWidth="2" />
                <text x="50" y="70" fill="#93C5FD" fontSize="10" fontFamily="monospace">a</text>
                <text x="125" y="70" fill="#93C5FD" fontSize="10" fontFamily="monospace">b</text>
                <text x="85" y="135" fill="#93C5FD" fontSize="10" fontFamily="monospace">c</text>
              </g>
            )}
            {selectedShape === 'rectangle' && (
              <g>
                <rect x="35" y="45" width="110" height="65" rx="4" fill="rgba(59, 130, 246, 0.15)" stroke="#60A5FA" strokeWidth="2" />
                <text x="80" y="40" fill="#93C5FD" fontSize="10" fontFamily="monospace">l = {length}</text>
                <text x="15" y="80" fill="#93C5FD" fontSize="10" fontFamily="monospace">w = {width}</text>
              </g>
            )}
            {selectedShape === 'sphere' && (
              <g>
                <circle cx="90" cy="75" r="50" fill="rgba(59, 130, 246, 0.15)" stroke="#60A5FA" strokeWidth="2" />
                <ellipse cx="90" cy="75" rx="50" ry="18" fill="none" stroke="#93C5FD" strokeDasharray="3,3" strokeWidth="1.5" />
                <line x1="90" y1="75" x2="140" y2="75" stroke="#93C5FD" strokeWidth="1.5" />
                <text x="105" y="70" fill="#93C5FD" fontSize="10" fontFamily="monospace">r = {radius}</text>
              </g>
            )}
            {selectedShape === 'cylinder' && (
              <g>
                <rect x="50" y="40" width="80" height="70" fill="rgba(59, 130, 246, 0.15)" stroke="none" />
                <line x1="50" y1="40" x2="50" y2="110" stroke="#60A5FA" strokeWidth="2" />
                <line x1="130" y1="40" x2="130" y2="110" stroke="#60A5FA" strokeWidth="2" />
                <ellipse cx="90" cy="40" rx="40" ry="12" fill="rgba(59, 130, 246, 0.25)" stroke="#60A5FA" strokeWidth="2" />
                <ellipse cx="90" cy="110" rx="40" ry="12" fill="rgba(59, 130, 246, 0.25)" stroke="#60A5FA" strokeWidth="2" />
                <text x="135" y="80" fill="#93C5FD" fontSize="10" fontFamily="monospace">h = {height}</text>
              </g>
            )}
            {selectedShape === 'cone' && (
              <g>
                <polygon points="90,30 45,115 135,115" fill="rgba(59, 130, 246, 0.15)" stroke="#60A5FA" strokeWidth="2" />
                <ellipse cx="90" cy="115" rx="45" ry="12" fill="rgba(59, 130, 246, 0.25)" stroke="#60A5FA" strokeWidth="2" />
                <line x1="90" y1="30" x2="90" y2="115" stroke="#93C5FD" strokeDasharray="3,3" strokeWidth="1.5" />
                <text x="95" y="75" fill="#93C5FD" fontSize="10" fontFamily="monospace">h</text>
              </g>
            )}
            {selectedShape === 'cuboid' && (
              <g>
                <rect x="40" y="55" width="75" height="55" fill="rgba(59, 130, 246, 0.15)" stroke="#60A5FA" strokeWidth="2" />
                <polygon points="40,55 65,30 140,30 115,55" fill="rgba(59, 130, 246, 0.2)" stroke="#60A5FA" strokeWidth="2" />
                <polygon points="115,55 140,30 140,85 115,110" fill="rgba(59, 130, 246, 0.25)" stroke="#60A5FA" strokeWidth="2" />
              </g>
            )}
          </svg>
        </div>
      </div>

      {result && (
        <div className="p-6 rounded-3xl bg-black/40 border border-white/10 glass-panel space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider pb-3 border-b border-white/5">
            Calculation Results: {result.shape}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {result.properties.map((prop, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">{prop.label}</div>
                <div className="text-lg font-mono font-bold text-blue-300">{prop.value} <span className="text-[10px] font-normal text-white/40">{prop.unit}</span></div>
                <div className="text-[10px] text-white/50 truncate" title={prop.formula}>
                  <MathRenderer expression={prop.formula} displayMode={false} size="sm" />
                </div>
              </div>
            ))}
          </div>

          <StepsViewer steps={result.steps} title="Geometric Formulas & Step-by-Step Derivation" defaultOpen={true} />
        </div>
      )}
    </div>
  );
};
