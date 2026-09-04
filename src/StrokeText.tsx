import React, { useEffect, useRef, useState, useId } from 'react';
import anime from 'animejs';

export interface StrokeTextProps {
  text: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number; // seconds
  fillDelay?: number; // seconds
  stagger?: number;
  ease?: string;
  trigger?: 'mount' | 'scroll' | 'hover';
  fillMode?: 'wipe' | 'fade' | 'none';
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  className?: string;
  id?: string;
}

export const StrokeText: React.FC<StrokeTextProps> = ({
  text,
  strokeColor = '#A78BFA',
  fillColor = '#F8FAFC',
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = 'power2.out',
  trigger = 'mount',
  fillMode = 'wipe',
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -4,
  className = '',
  id,
}) => {
  const uniqueId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wipeRectRef = useRef<SVGRectElement>(null);
  const strokeCharsRef = useRef<(SVGTextElement | null)[]>([]);
  const fillCharsRef = useRef<(SVGTextElement | null)[]>([]);
  const hasAnimatedRef = useRef(false);

  // Responsive font size calculation:
  // Mobile: 42–64px | Tablet: 64–90px | Desktop: 80–128px
  const [effectiveSize, setEffectiveSize] = useState<number>(() => {
    if (typeof window === 'undefined') return fontSize;
    const w = window.innerWidth;
    if (w < 640) {
      return Math.round(42 + Math.min(Math.max((w - 320) / 320, 0), 1) * 22); // 42 - 64px
    }
    if (w < 1024) {
      return Math.round(64 + Math.min(Math.max((w - 640) / 384, 0), 1) * 26); // 64 - 90px
    }
    return Math.round(80 + Math.min(Math.max((w - 1024) / 416, 0), 1) * 48); // 80 - 128px
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setEffectiveSize(Math.round(42 + Math.min(Math.max((w - 320) / 320, 0), 1) * 22));
      } else if (w < 1024) {
        setEffectiveSize(Math.round(64 + Math.min(Math.max((w - 640) / 384, 0), 1) * 26));
      } else {
        setEffectiveSize(Math.round(80 + Math.min(Math.max((w - 1024) / 416, 0), 1) * 48));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scale tracking proportionally
  const effectiveTracking = (letterSpacing * effectiveSize) / 128;

  // Coordinate math for SVG
  const charWidth = effectiveSize * 0.62;
  const totalEstimatedWidth = Math.max(text.length * charWidth + Math.abs(effectiveTracking) * text.length + 30, 260);
  const viewBoxHeight = effectiveSize * 1.35;
  const baselineY = effectiveSize * 1.05;
  const centerX = totalEstimatedWidth / 2;

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Immediate full render with zero delay for reduced-motion accessibility
      if (wipeRectRef.current) {
        wipeRectRef.current.setAttribute('width', '100%');
      }
      fillCharsRef.current.forEach(el => {
        if (el) el.style.opacity = '1';
      });
      strokeCharsRef.current.forEach(el => {
        if (el) {
          el.style.strokeDashoffset = '0';
          el.style.opacity = '0.4';
        }
      });
      return;
    }

    const animeEase = ease === 'power2.out' ? 'easeOutQuad' : 'easeOutExpo';

    // Setup dash offset
    strokeCharsRef.current.forEach(charEl => {
      if (charEl) {
        const len = 400;
        charEl.style.strokeDasharray = `${len}`;
        charEl.style.strokeDashoffset = `${len}`;
        charEl.style.opacity = '1';
      }
    });

    const timeline = anime.timeline({
      easing: animeEase,
      complete: () => {
        if (wipeRectRef.current) {
          wipeRectRef.current.setAttribute('width', '100%');
        }
        validStrokeChars.forEach(el => {
          if (el) {
            el.style.strokeDashoffset = '0';
            el.style.strokeDasharray = 'none';
          }
        });
      }
    });

    // Animate stroke draw per character
    const validStrokeChars = strokeCharsRef.current.filter(Boolean);
    if (validStrokeChars.length > 0) {
      timeline.add({
        targets: validStrokeChars,
        strokeDashoffset: [400, 0],
        duration: drawDuration * 1000,
        delay: anime.stagger(stagger * 1000),
        easing: animeEase,
      });
    }

    // Reveal fill (wipe or fade)
    if (fillMode === 'wipe' && wipeRectRef.current) {
      timeline.add({
        targets: wipeRectRef.current,
        width: ['0%', '100%'],
        duration: (drawDuration * 0.8) * 1000,
        easing: 'easeInOutQuad',
      }, `-=${Math.max(0, (drawDuration - fillDelay) * 1000)}`);
    } else if (fillMode === 'fade') {
      const validFillChars = fillCharsRef.current.filter(Boolean);
      if (validFillChars.length > 0) {
        timeline.add({
          targets: validFillChars,
          opacity: [0, 1],
          duration: 500,
          delay: anime.stagger(stagger * 1000),
          easing: 'easeOutQuad',
        }, `-=${Math.max(0, (drawDuration - fillDelay) * 1000)}`);
      }
    }
  }, [drawDuration, fillDelay, stagger, ease, fillMode]);

  const clipId = `wipe-clip-${id || uniqueId}`;
  const characters = text.split('');

  return (
    <div 
      ref={containerRef}
      id={id}
      className={`stroke-text-container relative w-full flex items-center justify-center overflow-visible select-none ${className}`}
      style={{
        maxWidth: '100%',
        touchAction: 'manipulation',
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${totalEstimatedWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto max-w-full drop-shadow-[0_0_40px_rgba(167,139,250,0.3)]"
        style={{
          maxHeight: `${effectiveSize * 1.3}px`,
          minHeight: '42px',
          overflow: 'visible',
        }}
        role="img"
        aria-label={text}
      >
        <title>{text}</title>
        <defs>
          <clipPath id={clipId}>
            <rect
              ref={wipeRectRef}
              x="0"
              y="0"
              width={fillMode === 'wipe' ? '0%' : '100%'}
              height="100%"
            />
          </clipPath>
        </defs>

        {/* Filled Text (Wiped or Faded in) */}
        <g clipPath={fillMode === 'wipe' ? `url(#${clipId})` : undefined}>
          <text
            x={centerX}
            y={baselineY}
            textAnchor="middle"
            fill={fillColor}
            fontSize={effectiveSize}
            fontWeight={fontWeight}
            letterSpacing={effectiveTracking}
            className="font-sans tracking-tight"
            style={{
              opacity: fillMode === 'fade' ? 0 : 1,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {characters.map((char, index) => (
              <tspan
                key={`fill-${index}`}
                ref={el => (fillCharsRef.current[index] = el as any)}
              >
                {char}
              </tspan>
            ))}
          </text>
        </g>

        {/* Foreground Stroke Outline */}
        <text
          x={centerX}
          y={baselineY}
          textAnchor="middle"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fontSize={effectiveSize}
          fontWeight={fontWeight}
          letterSpacing={effectiveTracking}
          className="font-sans pointer-events-none"
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {characters.map((char, index) => (
            <tspan
              key={`stroke-${index}`}
              ref={el => (strokeCharsRef.current[index] = el as any)}
            >
              {char}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  );
};

export default StrokeText;
