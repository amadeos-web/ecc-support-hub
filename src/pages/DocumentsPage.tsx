import { documentTypes, getDocumentType } from '../data';
import { href } from '../lib/router';
import { InvoiceEditor } from './InvoiceEditor';
import { QuoteEditor } from './QuoteEditor';
import { AttestationEditor } from './AttestationEditor';
import { PageHeader } from '../components/ui';

/** « Generate a document » : trois formulaires simplifiés (facture, devis, attestation), même mise en page ECC. */
export function DocumentsPage({ typeId }: { typeId?: string }) {
  const type = getDocumentType(typeId)?.id ?? 'facture';
  return (
    <div className="page">
      <PageHeader title="Generate a document" subtitle="Fill in the form: the preview updates live. Documents are printed in French." />
      <div className="doc-tabs">
        {documentTypes.map((d) => (
          <a key={d.id} href={href('documents', d.id)} className={`doc-tab ${d.id === type ? 'is-active' : ''}`}>
            <strong>{d.label}</strong>
            <span className="muted small">{d.description}</span>
          </a>
        ))}
      </div>
      {type === 'facture' ? <InvoiceEditor /> : type === 'devis' ? <QuoteEditor /> : <AttestationEditor />}
    </div>
  );
}
