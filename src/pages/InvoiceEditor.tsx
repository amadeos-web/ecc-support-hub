import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { freshIssuerProfile } from '../data/issuerProfile';
import { invoiceTemplate } from '../data/invoiceTemplate';
import { buildInvoice, clientFileName, emptyInvoiceForm, type InvoiceForm } from '../documents/invoice/model';
import type { IssuerProfile } from '../documents/core/issuer';
import { PdfPreview } from '../components/PdfPreview';
import { focusFirstInvalid } from '../lib/focusInvalid';
import { PdfExportStatus, usePdfExport } from '../components/PdfExport';
import { formatMoney } from '../documents/core/money';
import { buildDocumentFileName } from '../documents/core/fileName';
import { todayISO } from '../documents/core/dates';

const loadPdfRenderer = () => import('../documents/pdf/render');

/**
 * Facture SIMPLIFIÉE : l'agent ne remplit que 5 choses — numéro, destinataire, émetteur (prérempli),
 * date et montant. Tout le reste est fixé : une ligne « Formation ECC », TVA 0 %, EUR, montant TTC.
 * Les blocs destinataire / émetteur sont saisis comme ils seront imprimés (une ligne = une ligne du PDF).
 */
interface SimpleInvoice {
  number: string;
  issueDate: string;
  recipient: string;
  issuer: string;
  amount: string;
  /** Option rare : TVA. Désactivée = TVA 0 %. */
  vatOn: boolean;
  vatRate: string;
  /** Le montant saisi est TTC ou HT (seulement si TVA). */
  vatMode: 'TTC' | 'HT';
}

const defaultIssuerText = () => {
  const p = freshIssuerProfile();
  return [p.name, p.address].filter(Boolean).join('\n');
};

const emptySimple = (): SimpleInvoice => ({ number: '', issueDate: todayISO(), recipient: '', issuer: defaultIssuerText(), amount: '', vatOn: false, vatRate: '', vatMode: 'TTC' });
const RATE_PRESETS = ['5,5', '6', '10', '12', '20', '21'];

const splitBlock = (text: string) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return { first: lines[0] ?? '', rest: lines.slice(1).join('\n') };
};

/** Traduit les 5 champs vers le modèle de facture complet (inchangé, donc mêmes calculs et même PDF). */
function toModel(v: SimpleInvoice): { form: InvoiceForm; issuer: IssuerProfile } {
  const base = emptyInvoiceForm();
  const rec = splitBlock(v.recipient);
  const iss = splitBlock(v.issuer);
  const form: InvoiceForm = {
    ...base,
    number: v.number,
    issueDate: v.issueDate,
    client: { ...base.client, company: rec.first, address: rec.rest },
    lines: [{ ...base.lines[0], description: invoiceTemplate.defaultDescription, quantity: '1', unitPrice: v.amount, vatRate: v.vatOn ? v.vatRate : '0' }],
    priceMode: v.vatOn ? v.vatMode : 'TTC',
    currency: 'EUR',
    paymentConfirmed: true,
  };
  const issuer: IssuerProfile = { ...freshIssuerProfile(), name: iss.first, address: iss.rest };
  return { form, issuer };
}

/** Champ du formulaire simplifié auquel rattacher chaque erreur du modèle. */
const fieldOf = (key: string): keyof SimpleInvoice => {
  if (key === 'number') return 'number';
  if (key === 'issueDate') return 'issueDate';
  if (key.startsWith('client')) return 'recipient';
  if (key.startsWith('issuer')) return 'issuer';
  if (key.endsWith('vatRate')) return 'vatRate';
  return 'amount';
};

const FIELD_ORDER: (keyof SimpleInvoice)[] = ['number', 'issueDate', 'recipient', 'issuer', 'amount', 'vatRate'];
const MESSAGES: Record<keyof SimpleInvoice, string> = {
  number: 'Enter the invoice number.',
  issueDate: 'Enter the date.',
  recipient: 'Enter the recipient (name, then address).',
  issuer: 'Enter the issuer (name, then address).',
  amount: 'Enter the amount.',
  vatOn: '',
  vatRate: 'Enter the VAT rate.',
  vatMode: '',
};

export function InvoiceEditor() {
  const [v, setV] = useState<SimpleInvoice>(emptySimple);
  const [blocked, setBlocked] = useState<{ field: keyof SimpleInvoice; text: string } | null>(null);
  const exporter = usePdfExport();
  const busy = exporter.busy;
  const [previewOpen, setPreviewOpen] = useState(false);

  const { form, issuer } = useMemo(() => toModel(v), [v]);
  const build = useMemo(() => buildInvoice(form, issuer), [form, issuer]);
  const fileName = buildDocumentFileName('Facture', form.number, clientFileName(form.client));
  const set = <K extends keyof SimpleInvoice>(k: K, value: SimpleInvoice[K]) => {
    setV((s) => ({ ...s, [k]: value }));
    if (blocked?.field === k) setBlocked(null);
  };
  const err = (k: keyof SimpleInvoice) => (blocked?.field === k ? blocked.text : undefined);

  useEffect(() => {
    if (blocked) window.setTimeout(() => focusFirstInvalid(), 30);
  }, [blocked]);

  const makeBlob = () => loadPdfRenderer().then((m) => m.renderInvoicePdfBlob(build.draft));

  const onGenerate = async () => {
    if (!build.isValid) {
      setPreviewOpen(false);
      // Premier champ manquant, dans l'ordre du formulaire, avec un message simple.
      const fields = Object.keys(build.errors).map(fieldOf);
      const field = FIELD_ORDER.find((f) => fields.includes(f))!;
      setBlocked({ field, text: field === 'amount' || field === 'number' || field === 'vatRate' ? build.errors[Object.keys(build.errors).find((k) => fieldOf(k) === field)!] : MESSAGES[field] });
      return;
    }
    setBlocked(null);
    await exporter.run(makeBlob, fileName);
  };

  const onReset = () => {
    if (!window.confirm('Clear this invoice? (the issuer goes back to Business Brothers)')) return;
    setV(emptySimple());
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
                <F label="Invoice number" error={err('number')} half>
                  <input className="input" value={v.number} onChange={(e) => set('number', e.target.value)} placeholder="e.g. ECC0174" autoComplete="off" />
                </F>
                <F label="Date" error={err('issueDate')} half>
                  <input className="input" type="date" value={v.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
                </F>
              </div>
              <F label="Recipient" hint="Printed as typed: name on the first line, then the address." error={err('recipient')}>
                <textarea className="input" rows={4} value={v.recipient} onChange={(e) => set('recipient', e.target.value)} placeholder={'Jean Dupont\n12 rue de l’Exemple\n1000 Bruxelles\nBelgique'} />
              </F>
              <F label="Issuer" hint="Pre-filled with our details. Printed as typed." error={err('issuer')}>
                <textarea className="input" rows={4} value={v.issuer} onChange={(e) => set('issuer', e.target.value)} />
              </F>
              <F label="Amount (€)" error={err('amount')}>
                <input className="input" inputMode="decimal" value={v.amount} onChange={(e) => set('amount', e.target.value)} placeholder="1997" autoComplete="off" />
              </F>

              {/* Option rare : TVA (désactivée par défaut = TVA 0 %). */}
              <label className="na-check vat-toggle">
                <input type="checkbox" checked={v.vatOn} onChange={(e) => set('vatOn', e.target.checked)} />
                Add VAT
              </label>
              {v.vatOn && (
                <div className="field-row">
                  <F label="VAT rate (%)" error={err('vatRate')} half>
                    <input className="input" inputMode="decimal" list="vat-rates" value={v.vatRate} onChange={(e) => set('vatRate', e.target.value)} placeholder="20" autoComplete="off" />
                    <datalist id="vat-rates">
                      {RATE_PRESETS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </F>
                  <div className="field">
                    <span className="field-label">The amount entered is</span>
                    <div className="seg">
                      {(['TTC', 'HT'] as const).map((m) => (
                        <button key={m} type="button" className={`btn btn-small ${v.vatMode === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('vatMode', m)}>
                          {m === 'TTC' ? 'Incl. VAT' : 'Excl. VAT'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
          <PdfPreview docKey={build.draft} make={makeBlob} />
          <p className="muted small">File: {fileName}</p>
        </aside>
      </div>

      {previewOpen && (
        <div className="modal" onClick={() => setPreviewOpen(false)}>
          <div className="modal-inner modal-pdf" onClick={(e) => e.stopPropagation()}>
            <div className="modal-bar">
              <span>Exact PDF preview{build.isValid ? '' : ' — incomplete draft'}</span>
              <div className="modal-bar-actions">
                <button type="button" className="btn btn-primary btn-small" onClick={onGenerate} disabled={busy}>
                  Generate PDF
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setPreviewOpen(false)}>
                  Close (Esc)
                </button>
              </div>
            </div>
            <PdfPreview docKey={build.draft} make={makeBlob} large onEscape={() => setPreviewOpen(false)} />
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
