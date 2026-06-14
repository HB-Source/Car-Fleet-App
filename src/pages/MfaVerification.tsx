import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';

interface LocationState {
  mfaToken?: string;
}

export function MfaVerification() {
  const { submitMfa } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { mfaToken } = (state as LocationState) ?? {};

  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!mfaToken) return <Navigate to="/login" replace />;

  const submit = async (value: string) => {
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await submitMfa(mfaToken, value);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm animate-slide-up text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-xl shadow-brand-500/30">
          <ShieldCheck size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Two-factor authentication</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {useBackup
            ? 'Enter one of your backup recovery codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>

        <div className="mt-8">
          {useBackup ? (
            <input
              autoFocus
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="xxxx-xxxx"
              className="w-full rounded-2xl border-0 bg-white py-3.5 px-4 text-center font-mono text-sm shadow-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:ring-white/10"
            />
          ) : (
            <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={busy} />
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={() => submit(useBackup ? backupCode.trim() : code)}
          disabled={busy || (useBackup ? backupCode.trim().length < 4 : code.length < 6)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          Verify
        </button>

        <button
          onClick={() => {
            setUseBackup((v) => !v);
            setError(null);
          }}
          className="mt-5 block w-full text-sm font-semibold text-brand-600 dark:text-brand-400"
        >
          {useBackup ? 'Use authenticator app instead' : 'Use a backup code'}
        </button>

        <Link
          to="/login"
          className="mt-4 inline-block text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
