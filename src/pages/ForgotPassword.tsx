import { Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';

/**
 * Placeholder for the password-reset flow. The backend reset endpoints are
 * intentionally out of scope for this version; the UI is wired so the flow can
 * be implemented later (email a reset OTP, then set a new password).
 */
export function ForgotPassword() {
  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm animate-slide-up text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-xl shadow-brand-500/30">
          <KeyRound size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Password reset is coming soon. For now, please contact your fleet administrator to
          regain access to your account.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:text-slate-400 dark:ring-white/10">
          <Mail size={16} className="text-brand-500" />
          support@fleetpilot.app
        </div>

        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
