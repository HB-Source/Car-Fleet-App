import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';

interface LocationState {
  email?: string;
  mode?: 'verify' | 'login';
}

const RESEND_SECONDS = 45;

export function EmailOtpVerification() {
  const { submitEmailOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { email, mode = 'login' } = (state as LocationState) ?? {};

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (!email) return <Navigate to="/login" replace />;

  const submit = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await submitEmailOtp(email, value);
      if (res.next === 'mfa') {
        navigate('/verify-mfa', { state: { mfaToken: res.mfaToken }, replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendOtp(email);
      setResent(true);
      setSeconds(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm animate-slide-up text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-xl shadow-brand-500/30">
          <MailCheck size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {mode === 'verify' ? 'Verify your email' : 'Enter your code'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          We sent a 6-digit code to <span className="font-semibold">{email}</span>
        </p>

        <div className="mt-8">
          <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={busy} />
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}
        {resent && !error && (
          <p className="mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            A new code is on its way.
          </p>
        )}

        <button
          onClick={() => submit(code)}
          disabled={busy || code.length < 6}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          Verify
        </button>

        <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          {seconds > 0 ? (
            <span>Resend code in {seconds}s</span>
          ) : (
            <button onClick={resend} className="font-semibold text-brand-600 dark:text-brand-400">
              Resend code
            </button>
          )}
        </div>

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
