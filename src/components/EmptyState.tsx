import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 text-brand-500 dark:from-brand-500/15 dark:to-purple-500/15">
        <Icon size={28} />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
