import React, { useState, useEffect, useRef } from 'react';
import { ScientificGlobe } from './ScientificGlobe';

interface HeroGlobeContainerProps {
  scrollProgress: number; // 0 to 1
  onSelectGap?: () => void;
}

export const HeroGlobeContainer: React.FC<HeroGlobeContainerProps> = ({
  scrollProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Smooth, subtle mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] flex items-center justify-center select-none overflow-visible"
    >
      {/* 3D Typographic Knowledge Sphere with Research Gap Detection Reticle */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
        <ScientificGlobe
          scrollProgress={scrollProgress}
          mousePos={mousePos}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
