import type { DocumentType, PhotoCategory, VehicleDocument, VehiclePhoto } from '../types/vehicle';

/**
 * Local-only media store for vehicle photos and documents.
 *
 * Uploads are kept in the browser (as data URLs in localStorage) behind this
 * adapter interface. A cloud-backed implementation (e.g. Cloudinary) can be
 * dropped in later without changing the calling components — they only depend
 * on the functions exported here.
 */

const PHOTO_KEY = (vehicleId: string) => `fleetpilot-photos-${vehicleId}`;
const DOC_KEY = (vehicleId: string) => `fleetpilot-docs-${vehicleId}`;

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // storage full (data URLs are large) or unavailable — silently ignore
  }
}

function id(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Read a File as a compressed JPEG data URL (keeps localStorage usage sane). */
export function fileToDataUrl(file: File, maxDim = 1280, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const result = String(reader.result);
      // Only raster images are downscaled; other files (PDFs) pass through.
      if (!file.type.startsWith('image/')) {
        resolve(result);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

// --- Photos ---
export function getPhotos(vehicleId: string): VehiclePhoto[] {
  return read<VehiclePhoto>(PHOTO_KEY(vehicleId));
}

export async function addPhoto(
  vehicleId: string,
  file: File,
  category: PhotoCategory,
  caption?: string,
): Promise<VehiclePhoto[]> {
  const dataUrl = await fileToDataUrl(file);
  const photos = getPhotos(vehicleId);
  photos.unshift({ id: id(), category, dataUrl, caption, added_at: new Date().toISOString() });
  write(PHOTO_KEY(vehicleId), photos);
  return photos;
}

export function removePhoto(vehicleId: string, photoId: string): VehiclePhoto[] {
  const photos = getPhotos(vehicleId).filter((p) => p.id !== photoId);
  write(PHOTO_KEY(vehicleId), photos);
  return photos;
}

export function getMainPhoto(vehicleId: string): VehiclePhoto | undefined {
  const photos = getPhotos(vehicleId);
  return photos.find((p) => p.category === 'main') ?? photos[0];
}

// --- Documents ---
export function getDocuments(vehicleId: string): VehicleDocument[] {
  return read<VehicleDocument>(DOC_KEY(vehicleId));
}

export async function addDocument(
  vehicleId: string,
  file: File,
  type: DocumentType,
): Promise<VehicleDocument[]> {
  const dataUrl = await fileToDataUrl(file);
  const docs = getDocuments(vehicleId);
  docs.unshift({ id: id(), type, name: file.name, dataUrl, added_at: new Date().toISOString() });
  write(DOC_KEY(vehicleId), docs);
  return docs;
}

export function removeDocument(vehicleId: string, docId: string): VehicleDocument[] {
  const docs = getDocuments(vehicleId).filter((d) => d.id !== docId);
  write(DOC_KEY(vehicleId), docs);
  return docs;
}
