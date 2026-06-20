import { useRef, useState } from 'react';
import { FileText, FolderLock, Loader2, Trash2, Upload } from 'lucide-react';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  type VehicleDocument,
} from '../types/vehicle';
import { addDocument, removeDocument } from '../lib/vehicleMedia';

export function DocumentVault({
  vehicleId,
  documents,
  onChange,
  canEdit,
}: {
  vehicleId: string;
  documents: VehicleDocument[];
  onChange: (docs: VehicleDocument[]) => void;
  canEdit: boolean;
}) {
  const [type, setType] = useState<DocumentType>('insurance');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await addDocument(vehicleId, file, type));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <FolderLock size={16} className="text-slate-400" /> Document vault
      </h2>

      {documents.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Store registration, insurance, inspection, invoices and repair receipts in one place.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2.5 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10"
            >
              <FileText size={18} className="shrink-0 text-brand-500" />
              <a
                href={d.dataUrl}
                target="_blank"
                rel="noreferrer"
                download={d.name}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium">{d.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {DOCUMENT_TYPE_LABELS[d.type]}
                </span>
              </a>
              {canEdit && (
                <button
                  onClick={() => onChange(removeDocument(vehicleId, d.id))}
                  aria-label="Remove document"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="mt-4 space-y-2.5">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {DOCUMENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  type === t
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {DOCUMENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload {DOCUMENT_TYPE_LABELS[type]}
          </button>
          <p className="text-center text-[11px] text-slate-400">
            Stored on this device · cloud sync coming soon
          </p>
        </div>
      )}
    </section>
  );
}
