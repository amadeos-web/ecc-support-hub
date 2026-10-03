import { useCallback, useEffect, useRef, useState } from 'react';
import { deliverPdf, type Delivery } from '../documents/pdf/deliver';

/** Génération + livraison d'un PDF, commune à tous les documents. */
export function usePdfExport() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ fileName: string; blob: Blob; url: string; delivery: Delivery | null; error?: string } | null>(null);
  const urlRef = useRef<string | null>(null);

  const release = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };
  useEffect(() => release, []);

  const run = useCallback(async (make: () => Promise<Blob>, fileName: string) => {
    setBusy(true);
    setResult(null);
    try {
      const blob = await make();
      release();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const delivery = await deliverPdf(blob, fileName);
      setResult({ fileName, blob, url, delivery });
      return delivery;
    } catch {
      setResult({ fileName, blob: new Blob(), url: '', delivery: null, error: 'La génération du PDF a échoué. Réessaie ; si le problème persiste, recharge la page.' });
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const again = useCallback(async () => {
    if (!result?.blob.size) return;
    const delivery = await deliverPdf(result.blob, result.fileName);
    setResult((r) => (r ? { ...r, delivery } : r));
  }, [result]);

  const clear = useCallback(() => {
    release();
    setResult(null);
  }, []);

  return { busy, result, run, again, clear };
}

type Result = ReturnType<typeof usePdfExport>['result'];

/** Retour après « Générer le PDF » : ce qui s'est passé, et les secours (ouvrir / télécharger à nouveau). */
export function PdfExportStatus({ result, onAgain, onClose }: { result: Result; onAgain: () => void; onClose: () => void }) {
  if (!result) return null;
  const d = result.delivery;
  const message = result.error
    ? result.error
    : d?.status === 'saved'
      ? `PDF prêt : ${result.fileName}`
      : d?.status === 'downloaded'
        ? `PDF généré et téléchargé : ${result.fileName}`
        : d?.status === 'declined'
          ? `Téléchargement annulé. Le PDF « ${result.fileName} » reste disponible ci-dessous.`
          : `Le téléchargement automatique n’a pas abouti. Le PDF « ${result.fileName} » reste disponible ci-dessous.`;
  const ok = !result.error && (d?.status === 'saved' || d?.status === 'downloaded');
  return (
    <div className={`notice ${ok ? 'notice-ok' : 'notice-error'}`} role="status">
      <span>{message}</span>
      {!result.error && (
        <span className="notice-actions">
          <button type="button" className="rm-link" onClick={onAgain}>
            Télécharger à nouveau
          </button>
          <a className="rm-link" href={result.url} target="_blank" rel="noopener noreferrer">
            Ouvrir le PDF
          </a>
        </span>
      )}
      <button type="button" className="notice-close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>
    </div>
  );
}
