import React from 'react';

interface HeroOrbitLayerProps {
  scrollProgress?: number;
  mousePos?: { x: number; y: number };
  onSelectGap?: () => void;
}

export const HeroOrbitLayer: React.FC<HeroOrbitLayerProps> = ({
  scrollProgress = 0,
  mousePos = { x: 0, y: 0 },
}) => {
  // Pure subtle ambient back-glow behind the Earth to give cinematic depth
  // All rectangular cards and 2D floating labels have been completely removed.
  // The 3D Earth with curved WebGL typography is the sole focal centerpiece.
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
      {/* Cinematic Deep Ambient Radial Glow behind the Earth */}
      <div
        className="absolute w-[440px] sm:w-[500px] lg:w-[560px] h-[440px] sm:h-[500px] lg:h-[560px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(45, 212, 191, 0.08) 0%, rgba(13, 148, 136, 0.03) 45%, transparent 70%)',
          transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px) scale(${1 - scrollProgress * 0.1})`,
        }}
      />
    </div>
  );
};
