import type { LucideIcon } from 'lucide-react';

export function ComingSoonCard({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Icon size={16} className="text-slate-400" /> {title}
        </h2>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          Coming soon
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {features.map((f) => (
          <span
            key={f}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            {f}
          </span>
        ))}
      </div>
    </section>
  );
}
