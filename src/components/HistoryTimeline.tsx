import { useState } from 'react';
import {
  CalendarDays,
  History,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  EVENT_CATEGORY_LABELS,
  VEHICLE_EVENT_CATEGORIES,
  type VehicleEvent,
  type VehicleEventCategory,
} from '../types/vehicle';
import { addVehicleEvent, deleteVehicleEvent } from '../api/vehicles';

const inputClass =
  'w-full rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:ring-white/10';

function iconFor(category: VehicleEventCategory) {
  if (category === 'insurance' || category === 'claim') return ShieldCheck;
  if (category === 'inspection') return CalendarDays;
  return Wrench;
}

export function HistoryTimeline({
  vehicleId,
  events,
  onChange,
  canEdit,
  available,
}: {
  vehicleId: string;
  events: VehicleEvent[];
  onChange: (events: VehicleEvent[]) => void;
  canEdit: boolean;
  available: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: 'service' as VehicleEventCategory,
    title: '',
    notes: '',
    event_date: new Date().toISOString().slice(0, 10),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await addVehicleEvent(vehicleId, {
        category: form.category,
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        event_date: form.event_date,
      });
      onChange([created, ...events]);
      setForm({ ...form, title: '', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add record');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteVehicleEvent(vehicleId, id);
      onChange(events.filter((ev) => ev.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <History size={16} className="text-slate-400" /> Vehicle history
        </h2>
        {canEdit && available && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
          >
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {!available ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Connect the backend to keep a shared, date-stamped history of services, repairs,
          inspections and claims.
        </p>
      ) : (
        <>
          {showForm && (
            <form onSubmit={submit} className="mt-3 space-y-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as VehicleEventCategory })}
              >
                {VEHICLE_EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {EVENT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                placeholder="Title (e.g. Oil + filter change)"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                className={inputClass}
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
              <textarea
                className={`${inputClass} min-h-[60px] resize-y`}
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />} Save record
              </button>
            </form>
          )}

          {events.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No history records yet.</p>
          ) : (
            <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4 dark:border-slate-700">
              {events.map((ev) => {
                const Icon = iconFor(ev.category);
                return (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-4 ring-white dark:bg-brand-500/20 dark:text-brand-400 dark:ring-slate-900">
                      <Icon size={12} />
                    </span>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{ev.title}</p>
                        <p className="text-xs text-slate-400">
                          {EVENT_CATEGORY_LABELS[ev.category]} · {ev.event_date}
                          {ev.created_by ? ` · ${ev.created_by}` : ''}
                        </p>
                        {ev.notes && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{ev.notes}</p>
                        )}
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => remove(ev.id)}
                          aria-label="Delete record"
                          className="shrink-0 text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
