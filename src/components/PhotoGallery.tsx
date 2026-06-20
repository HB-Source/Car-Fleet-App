import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import {
  PHOTO_CATEGORIES,
  type PhotoCategory,
  type VehiclePhoto,
} from '../types/vehicle';
import { addPhoto, removePhoto } from '../lib/vehicleMedia';
import { timeAgo } from '../utils/format';

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  main: 'Main',
  front: 'Front',
  rear: 'Rear',
  side: 'Side',
  interior: 'Interior',
  dashboard: 'Dashboard',
  damage: 'Damage',
  custom: 'Custom',
};

export function PhotoGallery({
  vehicleId,
  photos,
  onChange,
  canEdit,
}: {
  vehicleId: string;
  photos: VehiclePhoto[];
  onChange: (photos: VehiclePhoto[]) => void;
  canEdit: boolean;
}) {
  const [category, setCategory] = useState<PhotoCategory>('main');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await addPhoto(vehicleId, file, category));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Camera size={16} className="text-slate-400" /> Photos
        </h2>
        <span className="text-xs text-slate-400">{photos.length} saved</span>
      </div>

      {photos.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No photos yet. Add front, rear, interior, dashboard and damage shots to build a visual
          record.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <img src={p.dataUrl} alt={p.category} className="h-full w-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {CATEGORY_LABELS[p.category]}
              </span>
              <span className="absolute right-1 top-1 rounded-md bg-black/40 px-1 py-0.5 text-[9px] text-white/90">
                {timeAgo(p.added_at)}
              </span>
              {canEdit && (
                <button
                  onClick={() => onChange(removePhoto(vehicleId, p.id))}
                  aria-label="Remove photo"
                  className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="mt-4 space-y-2.5">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {PHOTO_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  category === c
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            Add {CATEGORY_LABELS[category]} photo
          </button>
          <p className="text-center text-[11px] text-slate-400">
            Stored on this device · cloud sync coming soon
          </p>
        </div>
      )}
    </section>
  );
}
