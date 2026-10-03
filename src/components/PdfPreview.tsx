import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Aperçu = le vrai PDF, dessiné page par page (pdf.js) : mêmes octets que le fichier téléchargé,
 * et aucun lecteur PDF du navigateur (bloqué dans les fenêtres isolées).
 * `docKey` change → le PDF est régénéré (légère temporisation pendant la saisie).
 */
export function PdfPreview({ docKey, make, large = false, onEscape }: { docKey: unknown; make: () => Promise<Blob>; large?: boolean; onEscape?: () => void }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [width, setWidth] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef(make);
  makeRef.current = make;

  useEffect(() => {
    let cancelled = false;
    setState((s) => (s === 'ready' ? 'ready' : 'loading'));
    const timer = window.setTimeout(async () => {
      try {
        const { loadPdf, disposePdf } = await import('../documents/pdf/pdfPages');
        const pdf = await loadPdf(await makeRef.current());
        if (cancelled) return disposePdf(pdf);
        setDoc((prev) => {
          if (prev) window.setTimeout(() => disposePdf(prev), 1000);
          return pdf;
        });
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    }, large ? 0 : 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [docKey, large]);

  const docRef = useRef<PDFDocumentProxy | null>(null);
  docRef.current = doc;
  useEffect(() => () => void (docRef.current && import('../documents/pdf/pdfPages').then((m) => m.disposePdf(docRef.current!))), []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!onEscape) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onEscape();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape]);

  return (
    <div ref={frameRef} className={`pdf-frame ${large ? 'is-large' : ''}`}>
      {doc && width > 0 && (
        <div className="pdf-pages" aria-label="Aperçu du document">
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPageCanvas key={`${doc.fingerprints[0]}-${i}`} doc={doc} page={i + 1} width={width} />
          ))}
        </div>
      )}
      {state === 'loading' && !doc && <div className="pdf-status">Préparation de l’aperçu…</div>}
      {state === 'error' && <div className="pdf-status">L’aperçu n’a pas pu être généré. Réessaie ; si le problème persiste, recharge la page.</div>}
    </div>
  );
}

function PdfPageCanvas({ doc, page, width }: { doc: PDFDocumentProxy; page: number; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    import('../documents/pdf/pdfPages').then(({ renderPage }) => {
      if (!cancelled && ref.current) renderPage(doc, page, ref.current, width).catch((e) => console.error('pdf-page', e));
    });
    return () => {
      cancelled = true;
    };
  }, [doc, page, width]);
  return <canvas ref={ref} className="pdf-page" />;
}
