import React from 'react';
import { clsx } from 'clsx';

interface SectionLabelProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  variant?: 'teal' | 'navy' | 'muted' | 'crimson';
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  text,
  className,
  variant = 'teal',
}) => {
  const variantStyles = {
    teal: 'text-scilens-teal bg-scilens-lightteal border-scilens-borderteal',
    navy: 'text-scilens-navy bg-scilens-warmgray border-scilens-border',
    muted: 'text-scilens-muted bg-scilens-parchment border-scilens-border',
    crimson: 'text-scilens-crimson bg-scilens-lightcrimson border-red-200',
  };

  const content = children || text;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-wider uppercase border rounded-full',
        variantStyles[variant],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {content}
    </span>
  );
};
