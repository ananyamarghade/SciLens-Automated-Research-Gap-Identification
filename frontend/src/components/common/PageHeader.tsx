import React from 'react';
import { SectionLabel } from './SectionLabel';

interface PageHeaderProps {
  label?: string;
  title: string;
  italicWord?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  label,
  title,
  italicWord,
  description,
  actions,
}) => {
  return (
    <header className="mb-8 border-b border-scilens-border dark:border-scilens-darkborder pb-6 pt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {label && (
            <div className="mb-2">
              <SectionLabel variant="teal">{label}</SectionLabel>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-serif text-scilens-navy dark:text-white tracking-tight">
            {title}{' '}
            {italicWord && (
              <span className="font-serif italic font-normal text-scilens-teal dark:text-scilens-glowteal">
                {italicWord}
              </span>
            )}
          </h1>
          {description && (
            <p className="mt-2 text-xs md:text-sm text-scilens-muted dark:text-scilens-darkmuted max-w-2xl font-sans font-light leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </header>
  );
};
