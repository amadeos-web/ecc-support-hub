import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { freshIssuerProfile } from '../data/issuerProfile';
import { attestationTemplate as A } from '../data/attestationTemplate';
import { buildInvoice, emptyInvoiceForm, type InvoiceForm } from '../documents/invoice/model';
import type { IssuerProfile } from '../documents/core/issuer';
import { PdfPreview } from '../components/PdfPreview';
import { focusFirstInvalid } from '../lib/focusInvalid';
import { PdfExportStatus, usePdfExport } from '../components/PdfExport';
import { formatMoney, parseAmount } from '../documents/core/money';
import { buildDocumentFileName } from '../documents/core/fileName';
import { isValidISODate, todayISO } from '../documents/core/dates';
import type { InvoicePdfVariant } from '../documents/pdf/InvoicePdf';
import { VatOption, emptyVat, type VatState } from '../components/VatOption';
import { parseRate } from '../documents/core/money';

const loadPdfRenderer = () => import('../documents/pdf/render');

/**
 * Attestation de suivi de formation (modèle ECC) : même mise en page que la facture.
 * L'agent saisit : date, destinataire, « membre depuis », émetteur (prérempli), prestation (préremplie), montant.
 */
interface SimpleAttestation extends VatState {
  issueDate: string;
  recipient: string;
  memberSince: string;
  issuer: string;
  description: string;
  amount: string;
}
type Field = keyof SimpleAttestation;

const defaultIssuerText = () => {
  const p = freshIssuerProfile();
  return [p.name, p.address].filter(Boolean).join('\n');
};
const empty = (): SimpleAttestation => ({ issueDate: todayISO(), recipient: '', memberSince: '', issuer: defaultIssuerText(), description: A.defaultDescription, amount: '', ...emptyVat() });
const lines = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean);
/** « 2025-12-05 » → « 5 décembre 2025 ». */
const longDateFR = (iso: string) => (isValidISODate(iso) ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)) : '');

const ORDER: Field[] = ['issueDate', 'recipient', 'memberSince', 'issuer', 'description', 'amount', 'vatRate'];
function errorsOf(v: SimpleAttestation): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!isValidISODate(v.issueDate)) e.issueDate = 'Enter the date.';
  if (!lines(v.recipient).length) e.recipient = 'Enter the recipient (name, then email).';
  if (!isValidISODate(v.memberSince)) e.memberSince = 'Enter the date the member joined.';
  if (!lines(v.issuer).length) e.issuer = 'Enter the issuer.';
  if (!v.description.trim()) e.description = 'Enter the description.';
  const a = parseAmount(v.amount);
  if (!a.ok) e.amount = a.error;
  if (v.vatOn) {
    const r = parseRate(v.vatRate);
    if (!r.ok) e.vatRate = r.error;
  }
  return e;
}

function toModel(v: SimpleAttestation): { form: InvoiceForm; issuer: IssuerProfile } {
  const base = emptyInvoiceForm();
  const rec = lines(v.recipient);
  const iss = lines(v.issuer);
  return {
    form: {
      ...base,
      issueDate: v.issueDate,
      client: { ...base.client, company: rec[0] ?? '' },
      lines: [{ ...base.lines[0], description: v.description, quantity: '1', unitPrice: v.amount, vatRate: v.vatOn ? v.vatRate : '0' }],
      priceMode: v.vatOn ? v.vatMode : 'TTC',
      currency: 'EUR',
      paymentConfirmed: true,
    },
    issuer: { ...freshIssuerProfile(), name: iss[0] ?? '', address: iss.slice(1).join('\n') },
  };
}

export function AttestationEditor() {
  const [v, setV] = useState<SimpleAttestation>(empty);
  const [blocked, setBlocked] = useState<{ field: Field; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const exporter = usePdfExport();
  const busy = exporter.busy;

  const { form, issuer } = useMemo(() => toModel(v), [v]);
  const build = useMemo(() => buildInvoice(form, issuer), [form, issuer]);
  const variant: InvoicePdfVariant = useMemo(() => {
    const since = longDateFR(v.memberSince);
    return {
      title: A.title,
      subtitle: A.subtitle,
      titleSize: A.titleSize,
      documentTitle: `Attestation ${lines(v.recipient)[0] ?? ''}`,
      // Bloc destinataire : tel que saisi, puis une ligne vide et « Membre ECC depuis le » + date.
      recipientLines: [...lines(v.recipient), ...(since ? [' ', A.memberSinceLabel, since] : [])],
    };
  }, [v.recipient, v.memberSince]);
  const docKey = useMemo(() => ({ d: build.draft, variant }), [build.draft, variant]);
  const fileName = buildDocumentFileName('Attestation', '', lines(v.recipient)[0] ?? '');
  const errors = errorsOf(v);

  const set = <K extends Field>(k: K, value: SimpleAttestation[K]) => {
    setV((s) => ({ ...s, [k]: value }));
    if (blocked?.field === k) setBlocked(null);
  };
  const err = (k: Field) => (blocked?.field === k ? blocked.text : undefined);
  useEffect(() => {
    if (blocked) window.setTimeout(() => focusFirstInvalid(), 30);
  }, [blocked]);

  const makeBlob = () => loadPdfRenderer().then((m) => m.renderAttestationPdfBlob(build.draft, variant));

  const onGenerate = async () => {
    const field = ORDER.find((f) => errors[f]);
    if (field) {
      setPreviewOpen(false);
      setBlocked({ field, text: errors[field]! });
      return;
    }
    setBlocked(null);
    await exporter.run(makeBlob, fileName);
  };

  const onReset = () => {
    if (!window.confirm('Clear this certificate? (issuer and service go back to the defaults)')) return;
    setV(empty());
    setBlocked(null);
    exporter.clear();
  };

  return (
    <div className="invoice">
      <div className="doc-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setPreviewOpen(true)}>
          Preview
        </button>
        <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={busy}>
          {busy ? 'Generating…' : 'Generate PDF'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Reset
        </button>
      </div>

      <PdfExportStatus result={exporter.result} onAgain={exporter.again} onClose={exporter.clear} />

      <div className="invoice-layout">
        <div className="invoice-form">
          <section className="form-card is-open">
            <div className="form-card-body simple-invoice">
              <div className="field-row">
                <F label="Date" error={err('issueDate')} half>
                  <input className="input" type="date" value={v.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
                </F>
                <F label="Member since" error={err('memberSince')} half>
                  <input className="input" type="date" value={v.memberSince} onChange={(e) => set('memberSince', e.target.value)} />
                </F>
              </div>
              <F label="Recipient" hint="Printed as typed: name on the first line, then the email." error={err('recipient')}>
                <textarea className="input" rows={3} value={v.recipient} onChange={(e) => set('recipient', e.target.value)} placeholder={'Zakaria Degnoun\nzakaria.degnoun@gmail.com'} />
              </F>
              <F label="Issuer" hint="Pre-filled with our details. Printed as typed." error={err('issuer')}>
                <textarea className="input" rows={4} value={v.issuer} onChange={(e) => set('issuer', e.target.value)} />
              </F>
              <F label="Service" hint="Pre-filled. Printed in French." error={err('description')}>
                <input className="input" value={v.description} onChange={(e) => set('description', e.target.value)} />
              </F>
              <F label="Amount (€)" error={err('amount')}>
                <input className="input" inputMode="decimal" value={v.amount} onChange={(e) => set('amount', e.target.value)} placeholder="3000" autoComplete="off" />
              </F>
              <VatOption id="att-vat" value={v} error={err('vatRate')} onChange={(p) => { setV((s) => ({ ...s, ...p })); if (blocked?.field === 'vatRate') setBlocked(null); }} />
            </div>
          </section>
        </div>

        <aside className="invoice-side">
          <div className="sum-card">
            {v.vatOn && (
              <>
                <div className="sum-row">
                  <span>Subtotal excl. VAT</span>
                  <strong>{formatMoney(build.draft.totals.totalHT, 'EUR')}</strong>
                </div>
                <div className="sum-row">
                  <span>VAT</span>
                  <strong>{formatMoney(build.draft.totals.totalTTC - build.draft.totals.totalHT, 'EUR')}</strong>
                </div>
              </>
            )}
            <div className="sum-row sum-total">
              <span>{v.vatOn ? 'TOTAL INCL. VAT' : 'TOTAL'}</span>
              <strong>{formatMoney(build.draft.totals.totalTTC, 'EUR')}</strong>
            </div>
            <button type="button" className="btn btn-primary sum-generate" onClick={onGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>
          <PdfPreview docKey={docKey} make={makeBlob} />
          <p className="muted small">File: {fileName}</p>
        </aside>
      </div>

      {previewOpen && (
        <div className="modal" onClick={() => setPreviewOpen(false)}>
          <div className="modal-inner modal-pdf" onClick={(e) => e.stopPropagation()}>
            <div className="modal-bar">
              <span>Exact PDF preview</span>
              <div className="modal-bar-actions">
                <button type="button" className="btn btn-primary btn-small" onClick={onGenerate} disabled={busy}>
                  Generate PDF
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setPreviewOpen(false)}>
                  Close (Esc)
                </button>
              </div>
            </div>
            <PdfPreview docKey={docKey} make={makeBlob} large onEscape={() => setPreviewOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, error, hint, half, children }: { label: string; error?: string; hint?: string; half?: boolean; children: ReactNode }) {
  return (
    <div className={`field ${half ? '' : 'field-wide'} ${error ? 'is-invalid' : ''}`}>
      <span className="field-label">
        {label} <span className="req">*</span>
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
