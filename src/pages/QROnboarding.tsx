import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  Loader2,
  QrCode,
  XCircle,
} from 'lucide-react';
import { onboardVehicleByQrCode } from '../api/vehicles';
import type { Vehicle } from '../types/vehicle';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type Phase = 'idle' | 'scanning' | 'verifying' | 'success' | 'failure';

const READER_ID = 'qr-reader';

export function QROnboarding() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // scanner already stopped
      }
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  const verifyCode = async (code: string) => {
    await stopScanner();
    setPhase('verifying');
    setMessage(null);
    try {
      const result = await onboardVehicleByQrCode(code);
      if (result) {
        setVehicle(result);
        setPhase('success');
        if (navigator.vibrate) navigator.vibrate(80);
      } else {
        setVehicle(null);
        setMessage(`No vehicle matches code “${code}”.`);
        setPhase('failure');
      }
    } catch (e) {
      setVehicle(null);
      setMessage(e instanceof Error ? e.message : 'Onboarding failed');
      setPhase('failure');
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    setPhase('scanning');
    // Wait one frame so the #qr-reader element is mounted.
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => {
          if (phaseRef.current === 'scanning') void verifyCode(decodedText);
        },
        () => {
          // per-frame decode misses are expected; ignore
        },
      );
    } catch (e) {
      scannerRef.current = null;
      setCameraError(
        e instanceof Error && e.message
          ? e.message
          : 'Camera unavailable. Allow camera access or use manual entry below.',
      );
      setPhase('idle');
    }
  };

  const reset = () => {
    setPhase('idle');
    setVehicle(null);
    setMessage(null);
    setManualCode('');
  };

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="QR Onboarding" subtitle="Scan a vehicle QR code to activate it" />

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {phase === 'success' && vehicle ? (
          <div className="animate-pop rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="mx-auto flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/15">
              <CheckCircle2 size={44} />
            </div>
            <h2 className="mt-4 text-lg font-bold">Vehicle onboarded!</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {vehicle.vehicle_name} ({vehicle.plate_number}) is now active in your fleet.
            </p>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={vehicle.status} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={reset}
                className="rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-900/5 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
              >
                Scan another
              </button>
              <Link
                to={`/vehicles/${vehicle.id}`}
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-95"
              >
                View vehicle
              </Link>
            </div>
          </div>
        ) : phase === 'failure' ? (
          <div className="animate-scale-in rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15">
              <XCircle size={44} />
            </div>
            <h2 className="mt-4 text-lg font-bold">Onboarding failed</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
            <button
              onClick={reset}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-95"
            >
              Try again
            </button>
          </div>
        ) : phase === 'verifying' ? (
          <div className="animate-fade-in rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <Loader2 size={36} className="mx-auto animate-spin text-brand-500" />
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              Verifying vehicle…
            </p>
          </div>
        ) : (
          <>
            {/* Scanner card */}
            <div className="animate-slide-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
              {phase === 'scanning' ? (
                <div className="relative">
                  <div id={READER_ID} className="aspect-square w-full overflow-hidden" />
                  <button
                    onClick={async () => {
                      await stopScanner();
                      setPhase('idle');
                    }}
                    className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900/70 px-5 py-2 text-xs font-semibold text-white backdrop-blur transition-transform active:scale-95"
                  >
                    Stop scanning
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 text-brand-500 dark:from-brand-500/15 dark:to-purple-500/15">
                    <QrCode size={36} />
                  </div>
                  <h2 className="mt-4 font-bold">Scan vehicle QR code</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Point your camera at the QR sticker on the vehicle to onboard it instantly.
                  </p>
                  {cameraError && (
                    <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-left text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      <CameraOff size={14} className="mt-0.5 shrink-0" /> {cameraError}
                    </p>
                  )}
                  <button
                    onClick={() => void startScanner()}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-[0.98]"
                  >
                    <Camera size={18} /> Open camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual entry fallback */}
            <div
              className="animate-slide-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
              style={{ animationDelay: '80ms' }}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Keyboard size={16} className="text-slate-400" /> Manual entry
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                No camera? Type the onboarding code printed under the QR sticker.
              </p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) void verifyCode(manualCode);
                }}
              >
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="QR-VEHICLE-001"
                  className="min-w-0 flex-1 rounded-2xl border-0 bg-slate-100 px-4 py-3 font-mono text-sm uppercase ring-1 ring-slate-900/5 placeholder:font-sans placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:ring-white/10"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-95 disabled:opacity-50"
                >
                  Verify
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
