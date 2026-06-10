import { AlertTriangle, RotateCcw } from 'lucide-react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400">
        <AlertTriangle size={28} />
      </div>
      <h3 className="mt-4 font-semibold">Something went wrong</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-95"
        >
          <RotateCcw size={16} /> Try again
        </button>
      )}
    </div>
  );
}
