import { useState } from 'react';
import { resources, type Resource } from '../data/resources';
import { deliverPdf } from '../documents/pdf/deliver';
import { PageHeader } from '../components/ui';

/** Récupère le fichier (URL d'asset ou data: URL dans la version autonome) sans dépendre de fetch. */
async function fileBlob(url: string): Promise<Blob> {
  const m = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (m) {
    const type = m[1] || 'application/pdf';
    if (m[2]) {
      const bin = atob(m[3]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type });
    }
    return new Blob([decodeURIComponent(m[3])], { type });
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

const STATUS: Record<string, string> = {
  saved: 'Downloaded ✓',
  downloaded: 'Downloaded ✓',
  declined: 'Download cancelled',
  failed: 'Download failed — try again',
};

function ResourceCard({ r }: { r: Resource }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setStatus(null);
    try {
      const d = await deliverPdf(await fileBlob(r.fileUrl), r.fileName);
      setStatus(STATUS[d.status]);
    } catch {
      setStatus(STATUS.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card resource-card">
      {r.cover && <img className="resource-cover" src={r.cover} alt="" />}
      <div className="resource-body">
        <div className="card-kicker">{r.meta}</div>
        <h3 className="card-case">{r.title}</h3>
        <p className="muted small">{r.description}</p>
        <footer className="card-foot">
          <div className="card-foot-info">{status && <span className={status.startsWith('Downloaded') ? 'ok-text' : 'warn-text'}>{status}</span>}</div>
          <button type="button" className="btn btn-primary" onClick={download} disabled={busy}>
            {busy ? 'Preparing…' : 'Download'}
          </button>
        </footer>
      </div>
    </article>
  );
}

export function ResourcesPage() {
  return (
    <div className="page">
      <PageHeader title="Resources" subtitle="Documents to share with members. They are in French." />
      <div className="resource-list">
        {resources.map((r) => (
          <ResourceCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
