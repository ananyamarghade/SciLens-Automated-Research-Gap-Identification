import React from 'react';
import { clsx } from 'clsx';

interface ResearchCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
}

export const ResearchCard: React.FC<ResearchCardProps> = ({
  children,
  className,
  onClick,
  hoverable = false,
  selected = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white border rounded-lg p-5 transition-all duration-200',
        selected
          ? 'border-scilens-teal shadow-elevated bg-scilens-ivory/40 ring-1 ring-scilens-teal'
          : 'border-scilens-border shadow-subtle',
        hoverable && 'hover:border-scilens-subtle hover:shadow-elevated cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
