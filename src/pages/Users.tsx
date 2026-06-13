import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { isApiConfigured } from '../api/client';
import { createUser, fetchUsers, updateUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import type { User, UserRole } from '../types/user';

const inputClass =
  'w-full rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:ring-white/10';

export function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'driver' as UserRole });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }
    try {
      setUsers(await fetchUsers());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await createUser(form);
      setForm({ name: '', email: '', password: '', role: 'driver' });
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, changes: Parameters<typeof updateUser>[1]) => {
    try {
      await updateUser(id, changes);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (!isApiConfigured) {
    return (
      <div className="min-h-screen pb-28">
        <PageHeader title="Team" subtitle="User management" />
        <EmptyState
          icon={UsersRound}
          title="Demo mode"
          description="User management requires a connected backend. Set VITE_API_URL to enable it."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <PageHeader
        title="Team"
        subtitle={`${users.length} registered users`}
        trailing={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-500/25 transition-transform active:scale-95"
          >
            <Plus size={14} /> Add user
          </button>
        }
      />

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="animate-scale-in space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          >
            <h2 className="text-sm font-bold">New user</h2>
            <input
              className={inputClass}
              placeholder="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Password (min. 8 characters)"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              {(['driver', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-semibold capitalize transition-all active:scale-95 ${
                    form.role === r
                      ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/25'
                      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {formError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />} Create user
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="space-y-3">
            {users.map((u, i) => (
              <div
                key={u.id}
                className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        u.role === 'admin'
                          ? 'bg-gradient-to-br from-brand-500 to-purple-500 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {u.role === 'admin' ? <ShieldCheck size={18} /> : <UserRound size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight">
                        {u.name}
                        {u.id === me?.id && (
                          <span className="ml-1.5 text-xs font-medium text-slate-400">(you)</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      u.active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400'
                    }`}
                  >
                    {u.active ? u.role : 'inactive'}
                  </span>
                </div>

                {u.id !== me?.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => patch(u.id, { role: u.role === 'admin' ? 'driver' : 'admin' })}
                      className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-900/5 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10"
                    >
                      Make {u.role === 'admin' ? 'driver' : 'admin'}
                    </button>
                    <button
                      onClick={() => patch(u.id, { active: !u.active })}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold ring-1 transition-transform active:scale-95 ${
                        u.active
                          ? 'bg-red-50 text-red-600 ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                          : 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                      }`}
                    >
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
