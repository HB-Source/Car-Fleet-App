import { useEffect, useState } from 'react';
import { Download, Loader2, QrCode, Share2 } from 'lucide-react';
import { fetchVehicleQr } from '../api/vehicles';
import { isApiConfigured } from '../api/client';

export function VehicleQrCard({ vehicleId, qrCodeId }: { vehicleId: string; qrCodeId: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }
    fetchVehicleQr(vehicleId)
      .then((r) => !cancelled && setDataUrl(r.qrCodeDataUrl))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load QR'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${qrCodeId}.png`;
    a.click();
  };

  const print = () => {
    if (!dataUrl) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<img src="${dataUrl}" style="width:320px;display:block;margin:40px auto" onload="window.print()" /><p style="text-align:center;font-family:sans-serif">${qrCodeId}</p>`,
    );
    w.document.close();
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vehicle QR', text: `Vehicle code: ${qrCodeId}` });
      } catch {
        /* cancelled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(qrCodeId);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="flex items-center justify-center gap-2 text-sm font-bold">
        <QrCode size={16} className="text-slate-400" /> Vehicle QR code
      </h2>

      <div className="mt-3 flex justify-center">
        {loading ? (
          <div className="flex h-44 w-44 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        ) : dataUrl ? (
          <img src={dataUrl} alt="Vehicle QR code" className="h-44 w-44 rounded-2xl bg-white p-2 ring-1 ring-slate-900/5" />
        ) : (
          <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-slate-100 px-4 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {error ?? 'QR codes are available when connected to the backend.'}
          </div>
        )}
      </div>
      <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">{qrCodeId}</p>
      <p className="mt-1 text-[11px] text-slate-400">Scan to import or open this vehicle's profile.</p>

      {dataUrl && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={download}
            className="flex flex-col items-center gap-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download size={16} /> Download
          </button>
          <button
            onClick={print}
            className="flex flex-col items-center gap-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200"
          >
            <QrCode size={16} /> Print
          </button>
          <button
            onClick={share}
            className="flex flex-col items-center gap-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200"
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      )}
    </section>
  );
}
