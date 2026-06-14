import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, Copy, Download, KeyRound } from 'lucide-react';

interface LocationState {
  codes?: string[];
}

export function BackupCodes() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { codes } = (state as LocationState) ?? {};
  const [copied, setCopied] = useState(false);

  if (!codes || codes.length === 0) return <Navigate to="/settings" replace />;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const download = () => {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fleetpilot-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm animate-slide-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30">
          <KeyRound size={28} />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">Save your backup codes</h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          Each code works once if you lose your authenticator. Store them somewhere safe — you
          won't see them again.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
          {codes.map((c) => (
            <span key={c} className="rounded-xl bg-slate-100 py-2 text-center font-mono text-sm dark:bg-slate-800">
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={copy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-900/5 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={download}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-900/5 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
          >
            <Download size={16} /> Download
          </button>
        </div>

        <button
          onClick={() => navigate('/settings', { replace: true })}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98]"
        >
          I've saved them
        </button>
      </div>
    </div>
  );
}
