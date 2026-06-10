import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-[900] border-b border-slate-200/60 bg-slate-100/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {trailing}
      </div>
    </header>
  );
}
