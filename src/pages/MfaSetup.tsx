import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { setupMfa, confirmMfaSetup, type MfaSetupResponse } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';

export function MfaSetup() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setupMfa()
      .then((data) => !cancelled && setSetup(data))
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : 'Setup failed'));
    return () => {
      cancelled = true;
    };
  }, []);

  const confirm = async (value: string) => {
    if (!setup) return;
    setBusy(true);
    setError(null);
    try {
      await confirmMfaSetup(value);
      await refreshUser();
      navigate('/security/backup-codes', { state: { codes: setup.backupCodes }, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 pt-safe text-white">
        <div className="mx-auto max-w-lg px-4 pb-6 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-transform active:scale-95"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Set up authenticator</h1>
              <p className="text-xs text-white/75">Add a second layer of security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {loadError ? (
          <div className="rounded-3xl bg-white p-5 text-sm text-red-600 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:text-red-400 dark:ring-white/10">
            {loadError}
          </div>
        ) : !setup ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
              <h2 className="text-sm font-bold">1. Scan the QR code</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Open Google Authenticator, Microsoft Authenticator, Authy or 1Password and scan:
              </p>
              <div className="mt-4 flex justify-center">
                <img
                  src={setup.qrCodeDataUrl}
                  alt="MFA QR code"
                  className="h-44 w-44 rounded-2xl bg-white p-2 ring-1 ring-slate-900/5"
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Can't scan? Enter this key manually:
              </p>
              <p className="mt-1 break-all text-center font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                {new URL(setup.otpauthUrl).searchParams.get('secret')}
              </p>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
              <h2 className="text-sm font-bold">2. Enter the 6-digit code</h2>
              <div className="mt-4">
                <OtpInput value={code} onChange={setCode} onComplete={confirm} disabled={busy} />
              </div>
              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}
              <button
                onClick={() => confirm(code)}
                disabled={busy || code.length < 6}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                Enable MFA
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
