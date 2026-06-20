import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Car, Check, Loader2, Pencil, QrCode } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { createVehicle } from '../api/vehicles';
import { useAuth } from '../context/AuthContext';
import { VEHICLE_STATUSES, STATUS_LABELS, type VehicleStatus } from '../types/vehicle';

const inputClass =
  'w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:ring-white/10';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const randomQr = () => `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export function AddVehicle() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canCreate = hasRole('admin', 'manager');

  const [mode, setMode] = useState<'choose' | 'manual'>('choose');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicle_name: '',
    plate_number: '',
    make: '',
    car_model: '',
    year: '',
    color: '',
    vin: '',
    fuel_type: '',
    transmission: '',
    vehicle_category: '',
    mileage: '',
    status: 'available' as VehicleStatus,
    ownership_status: '',
    registration_date: '',
    insurance_expiry: '',
    road_tax_expiry: '',
    mot_expiry: '',
    purchase_date: '',
    purchase_price: '',
    current_value: '',
    qr_code_id: randomQr(),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const vehicle = await createVehicle({
        vehicle_name: form.vehicle_name.trim(),
        plate_number: form.plate_number.trim(),
        qr_code_id: form.qr_code_id.trim() || randomQr(),
        status: form.status,
        mileage: Number(form.mileage) || 0,
        make: form.make.trim() || null,
        car_model: form.car_model.trim() || null,
        year: num(form.year),
        color: form.color.trim() || null,
        vin: form.vin.trim() || null,
        fuel_type: form.fuel_type.trim() || null,
        transmission: form.transmission.trim() || null,
        vehicle_category: form.vehicle_category.trim() || null,
        ownership_status: form.ownership_status.trim() || null,
        registration_date: form.registration_date || null,
        insurance_expiry: form.insurance_expiry || null,
        road_tax_expiry: form.road_tax_expiry || null,
        mot_expiry: form.mot_expiry || null,
        purchase_date: form.purchase_date || null,
        purchase_price: num(form.purchase_price),
        current_value: num(form.current_value),
      });
      navigate(`/vehicles/${vehicle.id}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create vehicle');
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'choose') {
    return (
      <div className="min-h-screen pb-28">
        <PageHeader title="Add a vehicle" subtitle="How would you like to add this car?" />
        <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
          <button
            onClick={() => navigate('/onboard')}
            className="flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] dark:bg-slate-900 dark:ring-white/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 text-white">
              <QrCode size={24} />
            </span>
            <span>
              <span className="block font-bold">Scan QR code</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">
                Instantly import a vehicle from its code
              </span>
            </span>
          </button>

          <button
            onClick={() => canCreate && setMode('manual')}
            disabled={!canCreate}
            className="flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] disabled:opacity-50 dark:bg-slate-900 dark:ring-white/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-brand-600 dark:bg-slate-800 dark:text-brand-400">
              <Pencil size={22} />
            </span>
            <span>
              <span className="block font-bold">Add manually</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">
                {canCreate ? 'Enter details step-by-step' : 'Requires admin or manager role'}
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  const steps = ['Identity', 'Specs', 'Ownership'];

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Add manually" subtitle={`Step ${step} of 3 · ${steps[step - 1]}`} />
      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* progress */}
        <div className="mb-4 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="space-y-3.5 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/40">
          {step === 1 && (
            <>
              <Field label="Vehicle name *">
                <input className={inputClass} value={form.vehicle_name} onChange={(e) => set('vehicle_name', e.target.value)} placeholder="BMW 3 Series" />
              </Field>
              <Field label="Registration / plate *">
                <input className={inputClass} value={form.plate_number} onChange={(e) => set('plate_number', e.target.value)} placeholder="AB12 CDE" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Make"><input className={inputClass} value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="BMW" /></Field>
                <Field label="Model"><input className={inputClass} value={form.car_model} onChange={(e) => set('car_model', e.target.value)} placeholder="3 Series" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year"><input className={inputClass} type="number" inputMode="numeric" value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="2021" /></Field>
                <Field label="Colour"><input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Black" /></Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="VIN / chassis number">
                <input className={inputClass} value={form.vin} onChange={(e) => set('vin', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fuel type"><input className={inputClass} value={form.fuel_type} onChange={(e) => set('fuel_type', e.target.value)} placeholder="Petrol" /></Field>
                <Field label="Transmission"><input className={inputClass} value={form.transmission} onChange={(e) => set('transmission', e.target.value)} placeholder="Automatic" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category"><input className={inputClass} value={form.vehicle_category} onChange={(e) => set('vehicle_category', e.target.value)} placeholder="Saloon / Van" /></Field>
                <Field label="Mileage (km)"><input className={inputClass} type="number" inputMode="numeric" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} placeholder="42000" /></Field>
              </div>
              <Field label="Status">
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('status', s)}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                        form.status === s
                          ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Ownership status"><input className={inputClass} value={form.ownership_status} onChange={(e) => set('ownership_status', e.target.value)} placeholder="Owned / Leased / Financed" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Purchase date"><input className={inputClass} type="date" value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} /></Field>
                <Field label="Registration date"><input className={inputClass} type="date" value={form.registration_date} onChange={(e) => set('registration_date', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Purchase price"><input className={inputClass} type="number" inputMode="numeric" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} /></Field>
                <Field label="Current value"><input className={inputClass} type="number" inputMode="numeric" value={form.current_value} onChange={(e) => set('current_value', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Insurance expiry"><input className={inputClass} type="date" value={form.insurance_expiry} onChange={(e) => set('insurance_expiry', e.target.value)} /></Field>
                <Field label="Road tax expiry"><input className={inputClass} type="date" value={form.road_tax_expiry} onChange={(e) => set('road_tax_expiry', e.target.value)} /></Field>
              </div>
              <Field label="MOT / inspection expiry"><input className={inputClass} type="date" value={form.mot_expiry} onChange={(e) => set('mot_expiry', e.target.value)} /></Field>
              <Field label="QR code identifier">
                <input className={`${inputClass} font-mono`} value={form.qr_code_id} onChange={(e) => set('qr_code_id', e.target.value)} />
              </Field>
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => (step === 1 ? setMode('choose') : setStep(step - 1))}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && (!form.vehicle_name.trim() || !form.plate_number.trim())) {
                  setError('Vehicle name and registration are required.');
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-[0.98]"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save vehicle
            </button>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Car size={13} /> You can add photos, history and location after saving.
        </p>
      </div>
    </div>
  );
}
