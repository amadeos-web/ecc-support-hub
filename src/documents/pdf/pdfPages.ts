/**
 * Affichage du PDF dans la page : chaque page est dessinée sur un <canvas> avec pdf.js.
 * Contrairement à un <iframe> sur une URL blob, cela ne dépend pas du lecteur PDF du navigateur,
 * bloqué dans les fenêtres isolées (aperçu Claude Code, iframes sandboxées) : icône de fichier cassée.
 * Le PDF affiché est exactement celui qui est téléchargé (même Blob).
 */
import * as pdfjs from 'pdfjs-dist';
// Worker embarqué (blob) : fonctionne aussi dans une fenêtre isolée, sans fichier séparé à charger.
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

export type { PDFDocumentProxy };

const tasks = new WeakMap<PDFDocumentProxy, { destroy: () => Promise<void> }>();

export async function loadPdf(blob: Blob): Promise<PDFDocumentProxy> {
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  tasks.set(doc, task);
  return doc;
}

/** Libère la mémoire (worker, polices) d'un document qui n'est plus affiché. */
export const disposePdf = (doc: PDFDocumentProxy) => void tasks.get(doc)?.destroy().catch(() => undefined);

/** Dessine la page `n` pour qu'elle occupe `cssWidth` pixels CSS (net sur écrans haute densité). */
export async function renderPage(doc: PDFDocumentProxy, n: number, canvas: HTMLCanvasElement, cssWidth: number): Promise<void> {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${(cssWidth / base.width) * base.height}px`;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
}
