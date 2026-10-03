/**
 * Livraison d'un PDF généré à l'utilisateur : UN seul mécanisme pour tous les documents.
 *
 * 1. Fenêtre isolée (aperçu Claude / artifact) : le navigateur y BLOQUE tout téléchargement lancé
 *    par la page (`<a download>`, blob:, data:). Le seul chemin autorisé est la capacité
 *    « downloads » du viewer : `claude.use('downloads').save({ filename, data })` (confirmation du viewer).
 * 2. Navigateur normal : téléchargement direct via `<a download>` sur une URL de Blob.
 * 3. Dans tous les cas, l'interface garde une URL « Ouvrir le PDF » (voir PdfExport) en secours.
 */
interface DownloadsApi {
  save(req: { filename: string; data: Blob }): Promise<{ status: string }>;
}
interface ClaudeHost {
  use?: (name: string) => Promise<unknown>;
}

export type DeliveryStatus = 'saved' | 'downloaded' | 'declined' | 'failed';

export interface Delivery {
  status: DeliveryStatus;
  /** Chemin utilisé : capacité du viewer ou téléchargement navigateur. */
  via: 'viewer' | 'browser';
}

async function viewerDownloads(): Promise<DownloadsApi | null> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (!host || typeof host.use !== 'function') return null;
  try {
    const ns = await Promise.race([host.use('downloads'), new Promise<null>((r) => window.setTimeout(() => r(null), 4000))]);
    return ns && typeof (ns as DownloadsApi).save === 'function' ? (ns as DownloadsApi) : null;
  } catch {
    return null;
  }
}

/** Téléchargement navigateur classique : lien temporaire, clic, nettoyage. */
export function browserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function deliverPdf(blob: Blob, fileName: string): Promise<Delivery> {
  const viewer = await viewerDownloads();
  if (viewer) {
    try {
      await viewer.save({ filename: fileName, data: blob });
      return { status: 'saved', via: 'viewer' };
    } catch (e) {
      if ((e as { code?: string })?.code === 'declined') return { status: 'declined', via: 'viewer' };
      return { status: 'failed', via: 'viewer' };
    }
  }
  try {
    browserDownload(blob, fileName);
    return { status: 'downloaded', via: 'browser' };
  } catch {
    return { status: 'failed', via: 'browser' };
  }
}
