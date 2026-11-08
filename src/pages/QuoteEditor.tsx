import { useEffect, useState, type ReactNode } from 'react';
import { PdfPreview } from '../components/PdfPreview';
import { PdfExportStatus, usePdfExport } from '../components/PdfExport';
import { focusFirstInvalid } from '../lib/focusInvalid';
import { formatMoney } from '../documents/core/money';
import { buildDocumentFileName } from '../documents/core/fileName';
import { QUOTE_FIELD_ORDER, blockLines, emptyQuote, quoteErrors, quoteTotals, type BankDetails, type QuoteField, type SimpleQuote } from '../documents/quote/model';
import { VatOption } from '../components/VatOption';

const loadPdfRenderer = () => import('../documents/pdf/render');

/**
 * Devis simplifié (prise en charge par un organisme financeur) : date, destinataire, organisme
 * financeur, émetteur (prérempli), prestation (préremplie) et montant. Coordonnées bancaires
 * préremplies, repliées par défaut.
 */
export function QuoteEditor() {
  const [q, setQ] = useState<SimpleQuote>(emptyQuote);
  const [blocked, setBlocked] = useState<{ field: QuoteField; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const exporter = usePdfExport();
  const busy = exporter.busy;

  const errors = quoteErrors(q);
  const totals = quoteTotals(q);
  const fileName = buildDocumentFileName('Devis', '', blockLines(q.recipient)[0] ?? '');
  const set = <K extends keyof SimpleQuote>(k: K, value: SimpleQuote[K]) => {
    setQ((s) => ({ ...s, [k]: value }));
    if (blocked?.field === k) setBlocked(null);
  };
  const setBank = (k: keyof BankDetails, value: string) => setQ((s) => ({ ...s, bank: { ...s.bank, [k]: value } }));
  const err = (k: QuoteField) => (blocked?.field === k ? blocked.text : undefined);

  useEffect(() => {
    if (blocked) window.setTimeout(() => focusFirstInvalid(), 30);
  }, [blocked]);

  const makeBlob = () => loadPdfRenderer().then((m) => m.renderQuotePdfBlob(q));

  const onGenerate = async () => {
    const field = QUOTE_FIELD_ORDER.find((f) => errors[f]);
    if (field) {
      setPreviewOpen(false);
      setBlocked({ field, text: errors[field]! });
      return;
    }
    setBlocked(null);
    await exporter.run(makeBlob, fileName);
  };

  const onReset = () => {
    if (!window.confirm('Clear this quote? (issuer, service and bank details go back to the defaults)')) return;
    setQ(emptyQuote());
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
              <F label="Date" error={err('issueDate')}>
                <input className="input" type="date" value={q.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
              </F>
              <F label="Recipient" hint="Printed as typed: name on the first line, then date of birth, address, email…" error={err('recipient')}>
                <textarea className="input" rows={5} value={q.recipient} onChange={(e) => set('recipient', e.target.value)} placeholder={'Denissa Metaj\nNée le 21/04/2000\nRue Saint-Rémy 2\n4500 Huy, Belgique\ndenissa.metaj@hotmail.com'} />
              </F>
              <F label="Funding body" hint="Name on the first line, then the address." error={err('funder')}>
                <textarea className="input" rows={4} value={q.funder} onChange={(e) => set('funder', e.target.value)} placeholder={'Cainiao Liège eHub\nRue St Exupéry 32\n4460 Grâce-Hollogne\nBelgique'} />
              </F>
              <F label="Issuer" hint="Pre-filled with our details. Printed as typed." error={err('issuer')}>
                <textarea className="input" rows={2} value={q.issuer} onChange={(e) => set('issuer', e.target.value)} />
              </F>
              <F label="Service" hint="Pre-filled. Printed in French." error={err('description')}>
                <input className="input" value={q.description} onChange={(e) => set('description', e.target.value)} />
              </F>
              <F label="Amount (€)" error={err('amount')}>
                <input className="input" inputMode="decimal" value={q.amount} onChange={(e) => set('amount', e.target.value)} placeholder="3997" autoComplete="off" />
              </F>
              <VatOption id="quote-vat" value={q} error={err('vatRate')} onChange={(p) => { setQ((s) => ({ ...s, ...p })); if (blocked?.field === 'vatRate') setBlocked(null); }} />
              <details className="bank-details">
                <summary>Bank details (pre-filled)</summary>
                <div className="simple-invoice" style={{ padding: '12px 0 0' }}>
                  {(
                    [
                      ['holder', 'Account holder'],
                      ['iban', 'IBAN'],
                      ['bic', 'SWIFT / BIC'],
                      ['bank', 'Bank'],
                    ] as const
                  ).map(([k, label]) => (
                    <div key={k} className="field field-wide">
                      <span className="field-label">{label}</span>
                      <input className="input" value={q.bank[k]} onChange={(e) => setBank(k, e.target.value)} />
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </section>
        </div>

        <aside className="invoice-side">
          <div className="sum-card">
            {q.vatOn && (
              <>
                <div className="sum-row">
                  <span>Subtotal excl. VAT</span>
                  <strong>{formatMoney(totals.totalHT, 'EUR')}</strong>
                </div>
                <div className="sum-row">
                  <span>VAT</span>
                  <strong>{formatMoney(totals.totalTVA, 'EUR')}</strong>
                </div>
              </>
            )}
            <div className="sum-row sum-total">
              <span>{q.vatOn ? 'TOTAL INCL. VAT' : 'TOTAL'}</span>
              <strong>{formatMoney(totals.totalTTC, 'EUR')}</strong>
            </div>
            <button type="button" className="btn btn-primary sum-generate" onClick={onGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>
          <PdfPreview docKey={q} make={makeBlob} />
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
            <PdfPreview docKey={q} make={makeBlob} large onEscape={() => setPreviewOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={`field field-wide ${error ? 'is-invalid' : ''}`}>
      <span className="field-label">
        {label} <span className="req">*</span>
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
