import React from 'react';
import { clsx } from 'clsx';

interface SciLensLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SciLensLogo: React.FC<SciLensLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = false,
  className,
  onClick,
}) => {
  const sizeMap = {
    sm: {
      icon: 'w-6 h-6',
      title: 'text-base',
      subtitle: 'text-[8px]',
      gap: 'gap-2',
      dot: 'w-1 h-1',
    },
    md: {
      icon: 'w-8 h-8',
      title: 'text-xl',
      subtitle: 'text-[9px]',
      gap: 'gap-2.5',
      dot: 'w-1.5 h-1.5',
    },
    lg: {
      icon: 'w-10 h-10',
      title: 'text-2xl',
      subtitle: 'text-[10px]',
      gap: 'gap-3',
      dot: 'w-2 h-2',
    },
    xl: {
      icon: 'w-14 h-14',
      title: 'text-3xl',
      subtitle: 'text-xs',
      gap: 'gap-4',
      dot: 'w-2.5 h-2.5',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'inline-flex items-center select-none group',
        currentSize.gap,
        onClick && 'cursor-pointer hover:opacity-95 transition-opacity',
        className
      )}
    >
      {/* High-Visibility Scientific Lens Emblem */}
      <div className={clsx(currentSize.icon, 'relative flex-shrink-0 flex items-center justify-center')}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm filter"
        >
          <defs>
            {/* Vibrant, High-Contrast Gradients */}
            <linearGradient id="scilens-teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>

            <linearGradient id="scilens-orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>

            <radialGradient id="scilens-lens-glass" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Outer Precision Orbital Ellipse */}
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="6.5"
            transform="rotate(-28 16 16)"
            stroke="url(#scilens-orbit-grad)"
            strokeWidth="1.8"
            strokeDasharray="28 4"
            className="opacity-90"
          />

          {/* Orbital Data Nodes */}
          <circle cx="3.5" cy="22.5" r="1.75" fill="#38BDF8" className="animate-pulse" />
          <circle cx="28.5" cy="9.5" r="2.2" fill="#2DD4BF" />

          {/* Lens Handle */}
          <path
            d="M23 23L30.5 30.5"
            stroke="url(#scilens-teal-grad)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Primary Precision Lens Ring */}
          <circle
            cx="16"
            cy="16"
            r="9.5"
            stroke="url(#scilens-teal-grad)"
            strokeWidth="2.6"
            fill="url(#scilens-lens-glass)"
          />

          {/* Inner Optics Aperture Ring */}
          <circle
            cx="16"
            cy="16"
            r="6.5"
            stroke="#2DD4BF"
            strokeWidth="1"
            strokeOpacity="0.6"
            strokeDasharray="2.5 1.5"
          />

          {/* Center 4-Point Radiant Scientific Discovery Star */}
          <path
            d="M16 10.5C16 13.8 14.2 16 11 16C14.2 16 16 18.2 16 21.5C16 18.2 17.8 16 21 16C17.8 16 16 13.8 16 10.5Z"
            fill="#FFFFFF"
            className="drop-shadow-xs"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline tracking-tight font-sans">
            <span
              className={clsx(
                currentSize.title,
                'font-extrabold text-scilens-navy dark:text-white transition-colors leading-none'
              )}
            >
              Sci
            </span>
            <span
              className={clsx(
                currentSize.title,
                'font-extrabold bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 dark:from-teal-400 dark:via-cyan-300 dark:to-teal-200 bg-clip-text text-transparent leading-none'
              )}
            >
              Lens
            </span>
            <span
              className={clsx(
                currentSize.dot,
                'rounded-full bg-cyan-400 dark:bg-cyan-300 ml-0.5 inline-block animate-pulse'
              )}
            />
          </div>

          {showSubtitle && (
            <span
              className={clsx(
                currentSize.subtitle,
                'font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500 font-semibold mt-1 block'
              )}
            >
              AGENTIC RESEARCH INTELLIGENCE
            </span>
          )}
        </div>
      )}
    </div>
  );
};
