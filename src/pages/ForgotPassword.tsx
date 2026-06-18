import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { isApiConfigured } from '../api/client';
import {
  forgotPassword,
  resetPassword,
  sendResetOtp,
  type ResetMethod,
} from '../api/auth';
import { OtpInput } from '../components/OtpInput';

type Stage = 'email' | 'method' | 'verify' | 'done';

const inputClass =
  'w-full rounded-2xl border-0 bg-white py-3.5 px-4 text-sm shadow-sm ring-1 ring-slate-900/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:ring-white/10';

const RESEND_SECONDS = 45;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [methods, setMethods] = useState<ResetMethod[]>([]);
  const [method, setMethod] = useState<ResetMethod>('email');

  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (!isApiConfigured) {
    return (
      <div className="flex min-h-screen flex-col justify-center px-6 pb-16">
        <div className="mx-auto w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Password reset requires the live backend (demo mode is read-only).
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const beginReset = async (chosen: ResetMethod) => {
    setMethod(chosen);
    setError(null);
    setCode('');
    setBackupCode('');
    setUseBackup(false);
    if (chosen === 'email') {
      setBusy(true);
      try {
        await sendResetOtp(email.trim());
        setSeconds(RESEND_SECONDS);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send the code');
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setStage('verify');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword(email.trim());
      setMethods(res.methods);
      // If MFA is available, let the user choose; otherwise go straight to email.
      if (res.methods.includes('mfa')) {
        setStage('method');
        setBusy(false);
      } else {
        await beginReset('email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = method === 'mfa' && useBackup ? backupCode.trim() : code;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword({ email: email.trim(), method, code: value, newPassword: password });
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await sendResetOtp(email.trim());
      setSeconds(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm animate-slide-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-xl shadow-brand-500/30">
          {stage === 'done' ? <CheckCircle2 size={28} /> : <KeyRound size={28} />}
        </div>

        {/* Step 1 — email */}
        {stage === 'email' && (
          <>
            <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">Reset password</h1>
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              Enter your account email to get started
            </p>
            <form onSubmit={handleEmailSubmit} className="mt-8 space-y-3.5">
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />} Continue
              </button>
            </form>
          </>
        )}

        {/* Step 2 — choose method */}
        {stage === 'method' && (
          <>
            <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">Verify your identity</h1>
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              Choose how you'd like to confirm it's you
            </p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => beginReset('email')}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] disabled:opacity-60 dark:bg-slate-900 dark:ring-white/10"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Mail size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Email code</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    Send a 6-digit code to {email}
                  </span>
                </span>
              </button>
              {methods.includes('mfa') && (
                <button
                  onClick={() => beginReset('mfa')}
                  disabled={busy}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] disabled:opacity-60 dark:bg-slate-900 dark:ring-white/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <ShieldCheck size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Authenticator app</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      Use your TOTP or a backup code
                    </span>
                  </span>
                </button>
              )}
            </div>
            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            )}
          </>
        )}

        {/* Step 3 — verify + new password */}
        {stage === 'verify' && (
          <>
            <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              {method === 'email'
                ? `Enter the code sent to ${email}`
                : useBackup
                  ? 'Enter a backup recovery code'
                  : 'Enter the code from your authenticator app'}
            </p>

            <form onSubmit={handleReset} className="mt-8 space-y-4">
              {method === 'mfa' && useBackup ? (
                <input
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className={`${inputClass} text-center font-mono`}
                />
              ) : (
                <OtpInput value={code} onChange={setCode} autoFocus disabled={busy} />
              )}

              {method === 'mfa' && (
                <button
                  type="button"
                  onClick={() => {
                    setUseBackup((v) => !v);
                    setError(null);
                  }}
                  className="block w-full text-center text-xs font-semibold text-brand-600 dark:text-brand-400"
                >
                  {useBackup ? 'Use authenticator app instead' : 'Use a backup code'}
                </button>
              )}

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="New password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />} Reset password
              </button>
            </form>

            {method === 'email' && (
              <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                {seconds > 0 ? (
                  <span>Resend code in {seconds}s</span>
                ) : (
                  <button onClick={resend} className="font-semibold text-brand-600 dark:text-brand-400">
                    Resend code
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 4 — done */}
        {stage === 'done' && (
          <>
            <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">Password reset</h1>
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              Your password has been updated. You can now sign in with it.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98]"
            >
              Go to sign in
            </button>
          </>
        )}

        {stage !== 'done' && (
          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
