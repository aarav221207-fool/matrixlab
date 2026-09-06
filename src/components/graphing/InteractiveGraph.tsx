import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';
import * as math from 'mathjs';

export interface GraphFunction {
  id: string;
  expression?: string;
  evalFn?: (x: number) => number;
  color: string;
  label: string;
  width?: number;
  dash?: number[];
}

export interface GraphPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
  size?: number;
}

export interface GraphPolygon {
  points: { x: number; y: number }[];
  fillColor?: string;
  strokeColor?: string;
}

interface InteractiveGraphProps {
  functions?: GraphFunction[];
  points?: GraphPoint[];
  polygon?: GraphPolygon;
  initialXRange?: [number, number];
  initialYRange?: [number, number];
  height?: number;
  title?: string;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  functions = [],
  points = [],
  polygon,
  initialXRange = [-10, 10],
  initialYRange = [-10, 10],
  height = 360,
  title
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [xRange, setXRange] = useState<[number, number]>(initialXRange);
  const [yRange, setYRange] = useState<[number, number]>(initialYRange);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height });

  // Update canvas size on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setCanvasSize({ width: Math.floor(width), height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Coordinate transformations
  const toScreenX = useCallback((x: number) => {
    return ((x - xRange[0]) / (xRange[1] - xRange[0])) * canvasSize.width;
  }, [xRange, canvasSize.width]);

  const toScreenY = useCallback((y: number) => {
    return canvasSize.height - ((y - yRange[0]) / (yRange[1] - yRange[0])) * canvasSize.height;
  }, [yRange, canvasSize.height]);

  const toMathX = useCallback((screenX: number) => {
    return xRange[0] + (screenX / canvasSize.width) * (xRange[1] - xRange[0]);
  }, [xRange, canvasSize.width]);

  const toMathY = useCallback((screenY: number) => {
    return yRange[0] + ((canvasSize.height - screenY) / canvasSize.height) * (yRange[1] - yRange[0]);
  }, [yRange, canvasSize.height]);

  // Main draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, h } = { width: canvasSize.width, h: canvasSize.height };
    // Handle High DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Dark canvas background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, h);

    // 1. Grid lines and ticks
    const xSpan = xRange[1] - xRange[0];
    const ySpan = yRange[1] - yRange[0];

    const getNiceStep = (span: number) => {
      const rough = span / 8;
      const mag = Math.pow(10, Math.floor(Math.log10(rough)));
      const norm = rough / mag;
      if (norm < 1.5) return mag;
      if (norm < 3.5) return 2 * mag;
      if (norm < 7.5) return 5 * mag;
      return 10 * mag;
    };

    const xStep = getNiceStep(xSpan);
    const yStep = getNiceStep(ySpan);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace';

    // Vertical grid lines
    const startX = Math.ceil(xRange[0] / xStep) * xStep;
    for (let x = startX; x <= xRange[1]; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();

      if (Math.abs(x) > 1e-9) {
        ctx.fillText(cleanTick(x), sx + 4, toScreenY(0) + 14 > h - 8 ? h - 8 : toScreenY(0) + 14 < 14 ? 14 : toScreenY(0) + 14);
      }
    }

    // Horizontal grid lines
    const startY = Math.ceil(yRange[0] / yStep) * yStep;
    for (let y = startY; y <= yRange[1]; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();

      if (Math.abs(y) > 1e-9) {
        ctx.fillText(cleanTick(y), toScreenX(0) + 4 < 4 ? 4 : toScreenX(0) + 4 > width - 30 ? width - 30 : toScreenX(0) + 4, sy - 4);
      }
    }

    // 2. Primary Coordinate Axes
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)'; // soft light blue
    ctx.lineWidth = 1.5;

    // X Axis
    const originY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    const originX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.stroke();

    // Origin label
    ctx.fillText('0', originX + 4, originY + 12);

    // 3. Shaded Polygon (if present, e.g. for Linear Programming)
    if (polygon && polygon.points.length >= 3) {
      ctx.fillStyle = polygon.fillColor || 'rgba(59, 130, 246, 0.18)';
      ctx.strokeStyle = polygon.strokeColor || 'rgba(96, 165, 250, 0.6)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      const p0 = polygon.points[0];
      ctx.moveTo(toScreenX(p0.x), toScreenY(p0.y));
      for (let i = 1; i < polygon.points.length; i++) {
        const pt = polygon.points[i];
        ctx.lineTo(toScreenX(pt.x), toScreenY(pt.y));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Function Curves
    for (const fn of functions) {
      ctx.strokeStyle = fn.color || '#60A5FA';
      ctx.lineWidth = fn.width || 2;
      if (fn.dash) ctx.setLineDash(fn.dash);
      else ctx.setLineDash([]);

      ctx.beginPath();
      let isFirst = true;

      // Compile expression if string provided
      let compiled: math.EvalFunction | null = null;
      if (fn.expression) {
        try {
          compiled = math.compile(fn.expression);
        } catch {
          compiled = null;
        }
      }

      // Sample 300 points horizontally across the screen
      const sampleCount = Math.min(600, width);
      for (let px = 0; px <= sampleCount; px++) {
        const mathX = toMathX((px / sampleCount) * width);
        let mathY: number | null = null;

        if (fn.evalFn) {
          try {
            mathY = fn.evalFn(mathX);
          } catch {
            mathY = null;
          }
        } else if (compiled) {
          try {
            const res = compiled.evaluate({ x: mathX });
            if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
              mathY = res;
            }
          } catch {
            mathY = null;
          }
        }

        if (mathY !== null && isFinite(mathY) && Math.abs(mathY) < 1e5) {
          const sy = toScreenY(mathY);
          if (isFirst) {
            ctx.moveTo((px / sampleCount) * width, sy);
            isFirst = false;
          } else {
            ctx.lineTo((px / sampleCount) * width, sy);
          }
        } else {
          isFirst = true; // break path at discontinuities/asymptotes
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Discrete Points & Vertices
    for (const pt of points) {
      const sx = toScreenX(pt.x);
      const sy = toScreenY(pt.y);

      ctx.fillStyle = pt.color || '#38BDF8';
      ctx.beginPath();
      ctx.arc(sx, sy, pt.size || 5, 0, 2 * Math.PI);
      ctx.fill();

      // Outer glow ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (pt.label) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px ui-sans-serif, system-ui';
        ctx.fillText(pt.label, sx + 7, sy - 7);
      }
    }

    // 6. Crosshair on hover
    if (hoverCoord) {
      const hx = toScreenX(hoverCoord.x);
      const hy = toScreenY(hoverCoord.y);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, h);
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [canvasSize, xRange, yRange, functions, points, polygon, hoverCoord, toScreenX, toScreenY, toMathX]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse & Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    setHoverCoord({
      x: Math.round(toMathX(screenX) * 100) / 100,
      y: Math.round(toMathY(screenY) * 100) / 100
    });

    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });

      const xSpan = xRange[1] - xRange[0];
      const ySpan = yRange[1] - yRange[0];
      const mathDx = (dx / canvasSize.width) * xSpan;
      const mathDy = (dy / canvasSize.height) * ySpan;

      setXRange([xRange[0] - mathDx, xRange[1] - mathDx]);
      setYRange([yRange[0] + mathDy, yRange[1] + mathDy]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    zoom(factor);
  };

  const zoom = (factor: number) => {
    const xCenter = (xRange[0] + xRange[1]) / 2;
    const yCenter = (yRange[0] + yRange[1]) / 2;
    const halfXSpan = ((xRange[1] - xRange[0]) * factor) / 2;
    const halfYSpan = ((yRange[1] - yRange[0]) * factor) / 2;

    setXRange([xCenter - halfXSpan, xCenter + halfXSpan]);
    setYRange([yCenter - halfYSpan, yCenter + halfYSpan]);
  };

  const resetView = () => {
    setXRange(initialXRange);
    setYRange(initialYRange);
  };

  return (
    <div ref={containerRef} className="w-full relative flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5 text-xs">
        <div className="flex items-center gap-2 text-white/70 font-semibold uppercase tracking-wider text-[11px]">
          <Crosshair size={14} className="text-blue-400" />
          <span>{title || 'Interactive 2D Cartesian Graph'}</span>
        </div>

        {/* Hover coordinates badge */}
        {hoverCoord && (
          <div className="font-mono text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            x: {hoverCoord.x}, y: {hoverCoord.y}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoom(0.8)}
            title="Zoom In"
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => zoom(1.25)}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair touch-none"
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Function legend footer */}
      {functions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-white/5 border-t border-white/5 text-[11px]">
          {functions.map(fn => (
            <div key={fn.id} className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: fn.color }} />
              <span className="text-white/80 font-mono text-[10px]">{fn.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function cleanTick(val: number): string {
  return String(Math.round(val * 100) / 100);
}
