import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { freshIssuerProfile } from '../data/issuerProfile';
import { invoiceTemplate } from '../data/invoiceTemplate';
import {
  COMPANY_ID_LABELS,
  INVOICE_CURRENCIES,
  buildInvoice,
  clientFileName,
  emptyInvoiceForm,
  exampleInvoiceForm,
  newLine,
  type ClientForm,
  type InvoiceData,
  type InvoiceForm,
  type LineForm,
} from '../documents/invoice/model';
import type { IssuerProfile } from '../documents/core/issuer';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { issuerLines } from '../documents/pdf/blocks';
import eccLogoMercure from '../assets/ecc-logo-mercure.png';
import { createLocalNumberStore, formatInvoiceNumber, proposeInvoiceNumber } from '../documents/core/numbering';
import { formatMoney, formatRate } from '../documents/core/money';
import { buildDocumentFileName } from '../documents/core/fileName';
import { safeStorage } from '../documents/core/storage';
import { downloadBlob } from '../documents/pdf/download';

const DESCRIPTION_PRESETS = [invoiceTemplate.defaultDescription, 'Accompagnement', 'Autre prestation'];
const RATE_PRESETS = ['0', '6', '12', '21', '5,5', '10', '20'];

const loadPdfRenderer = () => import('../documents/pdf/render');

export function InvoiceEditor() {
  const [form, setForm] = useState<InvoiceForm>(emptyInvoiceForm);
  /** Émetteur de CE document : toujours Business Brothers par défaut, jamais enregistré. */
  const [issuer, setIssuer] = useState<IssuerProfile>(freshIssuerProfile);
  const [issuerUnlocked, setIssuerUnlocked] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const numberStore = useMemo(() => createLocalNumberStore(safeStorage), []);

  const build = useMemo(() => buildInvoice(form, issuer), [form, issuer]);
  const err = (key: string) => (showErrors ? build.errors[key] : undefined);
  const errorList = [...new Set(Object.values(build.errors))];
  const t = build.draft.totals;
  const cur = form.currency;
  const prefix = issuer.invoicePrefix.trim().toUpperCase() || 'ECC';
  const [reference, setReference] = useState(() => numberStore.getReference());
  const lastSeq = useMemo(() => numberStore.lastSequence(), [numberStore, reference, notice]);
  const numberAlreadyUsed = form.number.trim() !== '' && numberStore.isUsed(form.number);
  const fileName = buildDocumentFileName('Facture', form.number, clientFileName(form.client));
  const issuerErrorCount = Object.keys(build.errors).filter((k) => k.startsWith('issuer.')).length;
  const prefixIsPreset = invoiceTemplate.prefixes.includes(prefix);
  const [customPrefix, setCustomPrefix] = useState(!prefixIsPreset);

  const set = <K extends keyof InvoiceForm>(key: K, value: InvoiceForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setClient = (key: keyof ClientForm, value: string) => setForm((f) => ({ ...f, client: { ...f.client, [key]: value } }));
  const setLine = (id: string, patch: Partial<LineForm>) => setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const setIssuerField = (key: Exclude<keyof IssuerProfile, 'notApplicable'>, value: string) => setIssuer((p) => ({ ...p, [key]: value }));
  /** Retour à l'émetteur par défaut, champs verrouillés. */
  const lockIssuer = () => {
    setIssuer((p) => ({ ...freshIssuerProfile(), invoicePrefix: p.invoicePrefix }));
    setIssuerUnlocked(false);
    setConfirmUnlock(false);
  };

  const flash = (kind: 'ok' | 'error' | 'info', text: string) => setNotice({ kind, text });

  const showErrorsAndScroll = () => {
    setShowErrors(true);
    window.setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const onPreview = () => {
    setShowErrors(true);
    setPreviewOpen(true);
  };

  const onGenerate = async () => {
    if (!build.isValid) {
      flash('error', form.paymentConfirmed ? 'Le PDF n’a pas été généré : corrige les champs signalés.' : 'Le PDF n’a pas été généré : confirme d’abord la réception du règlement intégral.');
      showErrorsAndScroll();
      return;
    }
    if (numberAlreadyUsed && !window.confirm(`Le numéro ${form.number.trim()} a déjà servi à générer un PDF dans ce navigateur.\nGénérer quand même ?`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const { renderInvoicePdfBlob } = await loadPdfRenderer();
      const blob = await renderInvoicePdfBlob(build.draft);
      downloadBlob(blob, fileName);
      numberStore.markUsed(form.number);
      flash('ok', `PDF généré et téléchargé : ${fileName}`);
    } catch {
      flash('error', 'La génération du PDF a échoué. Réessaie ; si le problème persiste, vérifie le logo (PNG ou JPEG).');
    } finally {
      setBusy(false);
    }
  };

  const onReset = () => {
    if (!window.confirm('Effacer toutes les informations de cette facture ? (l’émetteur revient à Business Brothers)')) return;
    setForm(emptyInvoiceForm());
    lockIssuer();
    setShowErrors(false);
    setNotice(null);
  };

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return flash('error', 'Logo : formats acceptés PNG ou JPEG.');
    if (file.size > 800_000) return flash('error', 'Logo : 800 Ko maximum.');
    const reader = new FileReader();
    reader.onload = () => setIssuerField('logoDataUrl', String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="invoice">
      <div className="doc-actions">
        <button type="button" className="btn btn-secondary" onClick={onPreview}>
          Prévisualiser
        </button>
        <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={busy || !form.paymentConfirmed} title={form.paymentConfirmed ? undefined : 'Confirme d’abord la réception du règlement intégral'}>
          {busy ? 'Génération…' : 'Générer le PDF'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Réinitialiser
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={() => setForm(exampleInvoiceForm())}>
          Remplir un exemple
        </button>
      </div>

      {notice && (
        <div className={`notice notice-${notice.kind}`} role="status">
          {notice.text}
          <button type="button" className="notice-close" onClick={() => setNotice(null)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}

      <div className="invoice-layout">
        <div className="invoice-form">
          <div ref={summaryRef} />
          {showErrors && errorList.length > 0 && (
            <div className="error-summary" role="alert">
              <strong>{errorList.length === 1 ? '1 point à corriger' : `${errorList.length} points à corriger`} avant de générer le PDF :</strong>
              <ul>
                {errorList.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* A. Émetteur */}
          <section className="form-card is-open">
            <header className="form-card-head">
              <h3>
                <span className="step">A</span> Émetteur
              </h3>
            </header>
            {issuerErrorCount > 0 && <p className="warn-inline">Coordonnées émetteur incomplètes ({issuerErrorCount}) : la génération du PDF est bloquée.</p>}
            <div className="form-card-body">
              <div className="issuer-readonly" aria-label="Émetteur du document">
                <div className="issuer-lines">
                  {issuerLines(issuer).map((l, i) => (
                    <div key={i} className={i === 0 ? 'issuer-name' : ''}>
                      {l}
                    </div>
                  ))}
                </div>
                {issuer.logoDataUrl ? <img src={issuer.logoDataUrl} alt="Logo" className="issuer-logo is-custom" /> : <img src={eccLogoMercure} alt="Logo ECC" className="issuer-logo" />}
              </div>

              <label className="na-check issuer-unlock">
                <input
                  type="checkbox"
                  checked={issuerUnlocked || confirmUnlock}
                  onChange={(e) => {
                    if (!e.target.checked) return lockIssuer();
                    setConfirmUnlock(true);
                  }}
                />
                Modifier exceptionnellement les informations de l’émetteur
              </label>

              {confirmUnlock && !issuerUnlocked && (
                <div className="issuer-confirm" role="alertdialog" aria-label="Confirmer la modification de l’émetteur">
                  <p>Les informations de l’émetteur sont normalement fixes. Confirmer la modification pour ce document ?</p>
                  <div className="issuer-confirm-actions">
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirmUnlock(false)}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => {
                        setIssuerUnlocked(true);
                        setConfirmUnlock(false);
                      }}
                    >
                      Confirmer la modification
                    </button>
                  </div>
                </div>
              )}

              {issuerUnlocked && (
                <>
                  <p className="muted small">Modification valable pour ce document uniquement. Le prochain document reviendra à Business Brothers LIMITED.</p>
                  <div className="form-grid">
                    <F label="Raison sociale" required error={err('issuer.name')} wide>
                      <input className="input" value={issuer.name} onChange={(e) => setIssuerField('name', e.target.value)} />
                    </F>
                    <F label="Adresse" required error={err('issuer.address')} wide hint="Une ligne par ligne d’adresse.">
                      <textarea className="input" rows={3} value={issuer.address} onChange={(e) => setIssuerField('address', e.target.value)} />
                    </F>
                    <F label="Numéro d'entreprise" hint="Optionnel">
                      <input className="input" value={issuer.companyNumber} onChange={(e) => setIssuerField('companyNumber', e.target.value)} />
                    </F>
                    <F label="Numéro de TVA" hint="Optionnel">
                      <input className="input" value={issuer.vatNumber} onChange={(e) => setIssuerField('vatNumber', e.target.value)} />
                    </F>
                    <F label="Email" hint="Optionnel" error={err('issuer.email')}>
                      <input className="input" value={issuer.email} onChange={(e) => setIssuerField('email', e.target.value)} />
                    </F>
                    <F label="Nom de marque (pied de page)" hint="Vide = raison sociale.">
                      <input className="input" value={issuer.brandName} onChange={(e) => setIssuerField('brandName', e.target.value)} />
                    </F>
                    <F label="Logo de remplacement (PNG ou JPEG)" wide hint="Remplace le logo ECC pour ce document uniquement.">
                      <div className="logo-row">
                        <label className="btn btn-ghost btn-small">
                          Choisir un fichier
                          <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
                        </label>
                        {issuer.logoDataUrl && (
                          <button type="button" className="btn btn-ghost btn-small" onClick={() => setIssuerField('logoDataUrl', '')}>
                            Retirer
                          </button>
                        )}
                      </div>
                    </F>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* B. Destinataire */}
          <section className="form-card is-open">
            <header className="form-card-head">
              <h3>
                <span className="step">B</span> Destinataire
              </h3>
            </header>
            <div className="form-card-body">
              {err('client.identity') && <span className="field-error">{err('client.identity')}</span>}
              <div className="form-grid">
                <F label="Société" hint="Si le client facture au nom d’une société" wide>
                  <input className="input" value={form.client.company} onChange={(e) => setClient('company', e.target.value)} autoComplete="off" />
                </F>
                <F label="Prénom" error={err('client.firstName')}>
                  <input className="input" value={form.client.firstName} onChange={(e) => setClient('firstName', e.target.value)} autoComplete="off" />
                </F>
                <F label="Nom" error={err('client.lastName')}>
                  <input className="input" value={form.client.lastName} onChange={(e) => setClient('lastName', e.target.value)} autoComplete="off" />
                </F>
                <F label="Adresse" required error={err('client.address')} wide>
                  <input className="input" value={form.client.address} onChange={(e) => setClient('address', e.target.value)} autoComplete="off" />
                </F>
                <F label="Code postal">
                  <input className="input" value={form.client.postalCode} onChange={(e) => setClient('postalCode', e.target.value)} autoComplete="off" />
                </F>
                <F label="Ville" required error={err('client.city')}>
                  <input className="input" value={form.client.city} onChange={(e) => setClient('city', e.target.value)} autoComplete="off" />
                </F>
                <F label="Pays" required error={err('client.country')}>
                  <input className="input" value={form.client.country} onChange={(e) => setClient('country', e.target.value)} autoComplete="off" />
                </F>
                <F label="N° d'entreprise / SIRET" hint="Optionnel — libellé imprimé au choix">
                  <div className="input-with-btn">
                    <select className="input select-narrow" value={form.client.companyIdLabel} onChange={(e) => setClient('companyIdLabel', e.target.value)}>
                      {COMPANY_ID_LABELS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    <input className="input" value={form.client.companyNumber} onChange={(e) => setClient('companyNumber', e.target.value)} autoComplete="off" />
                  </div>
                </F>
                <F label="Numéro de TVA" hint="Optionnel">
                  <input className="input" value={form.client.vatNumber} onChange={(e) => setClient('vatNumber', e.target.value)} autoComplete="off" />
                </F>
              </div>
              <p className="muted small">Seuls les champs renseignés apparaissent sur la facture.</p>
            </div>
          </section>

          {/* C. Facture */}
          <section className="form-card is-open">
            <header className="form-card-head">
              <h3>
                <span className="step">C</span> Facture
              </h3>
            </header>
            <div className="form-card-body">
              <div className="form-grid">
                <F label="Préfixe des numéros" hint={`Ex. ${formatInvoiceNumber(prefix, 174)}`}>
                  <div className="input-with-btn">
                    <select
                      className="input"
                      value={customPrefix ? '__autre' : prefix}
                      onChange={(e) => {
                        if (e.target.value === '__autre') return setCustomPrefix(true);
                        setCustomPrefix(false);
                        setIssuerField('invoicePrefix', e.target.value);
                      }}
                    >
                      {invoiceTemplate.prefixes.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value="__autre">Autre…</option>
                    </select>
                    {customPrefix && (
                      <input className="input" value={issuer.invoicePrefix} onChange={(e) => setIssuerField('invoicePrefix', e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())} placeholder="Lettres" />
                    )}
                  </div>
                </F>
                <F label="Numéro de facture" required error={err('number')} wide hint={lastSeq > 0 ? `Dernier numéro connu : n° ${lastSeq} → proposition ${formatInvoiceNumber(prefix, lastSeq + 1)}` : 'Renseigne le dernier numéro émis ci-dessous pour continuer la séquence.'}>
                  <div className="input-with-btn">
                    <input className="input" value={form.number} onChange={(e) => set('number', e.target.value)} placeholder={formatInvoiceNumber(prefix, (lastSeq || 0) + 1)} />
                    <button type="button" className="btn btn-ghost" onClick={() => set('number', proposeInvoiceNumber(numberStore, prefix))}>
                      Générer une proposition
                    </button>
                  </div>
                  {numberAlreadyUsed && <span className="warn-text small">Ce numéro a déjà servi à générer un PDF dans ce navigateur.</span>}
                </F>
                <F label="Dernier numéro émis (référence)" hint="Ex. BB0173 — dernière facture faite hors de cet outil. Mémorisé dans ce navigateur.">
                  <input
                    className="input"
                    value={reference}
                    onChange={(e) => {
                      setReference(e.target.value);
                      numberStore.setReference(e.target.value);
                    }}
                    placeholder="BB0173"
                  />
                </F>
                <F label="Délivré le (date d’émission)" required error={err('issueDate')} hint="Date d’envoi au client, pas la date d’achat">
                  <input className="input" type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
                </F>
                <F label="Devise" required>
                  <select className="input" value={form.currency} onChange={(e) => set('currency', e.target.value as InvoiceForm['currency'])}>
                    {INVOICE_CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </F>
                <F label="Mention libre" hint="Optionnelle — imprimée sous le total, telle quelle" wide>
                  <input className="input" value={form.vatMention} onChange={(e) => set('vatMention', e.target.value)} placeholder="Ex. mention TVA demandée par la comptabilité" />
                </F>
                <F label="Note interne" hint="Jamais imprimée ni enregistrée" wide>
                  <input className="input" value={form.internalNote} onChange={(e) => set('internalNote', e.target.value)} />
                </F>
              </div>
            </div>
          </section>

          {/* D. Prestation */}
          <section className="form-card is-open">
            <header className="form-card-head">
              <h3>
                <span className="step">D</span> Prestation
              </h3>
            </header>
            <div className="form-card-body">
              <div className="mode-choice">
                <label className={`mode-option ${form.priceMode === 'TTC' ? 'is-active' : ''}`}>
                  <input type="radio" name="price-mode" checked={form.priceMode === 'TTC'} onChange={() => set('priceMode', 'TTC')} />
                  <span>
                    <strong>Le montant saisi est TTC</strong>
                    <span className="muted small">HT = TTC ÷ (1 + taux) · TVA = TTC − HT</span>
                  </span>
                </label>
                <label className={`mode-option ${form.priceMode === 'HT' ? 'is-active' : ''}`}>
                  <input type="radio" name="price-mode" checked={form.priceMode === 'HT'} onChange={() => set('priceMode', 'HT')} />
                  <span>
                    <strong>Le montant saisi est HT</strong>
                    <span className="muted small">TVA = HT × taux · TTC = HT + TVA</span>
                  </span>
                </label>
              </div>

              <div className="inv-lines">
                <div className="inv-line inv-line-head">
                  <span>Description</span>
                  <span>Qté</span>
                  <span>Prix unit. {form.priceMode}</span>
                  <span>TVA %</span>
                  <span />
                </div>
                {form.lines.map((l, i) => (
                  <div key={l.id} className="inv-line">
                    <div>
                      <input className={`input ${err(`lines.${i}.description`) ? 'has-error' : ''}`} list="desc-presets" value={l.description} onChange={(e) => setLine(l.id, { description: e.target.value })} placeholder="Ex. Formation ECC" />
                      <FieldError text={err(`lines.${i}.description`)} />
                    </div>
                    <div>
                      <input className={`input num ${err(`lines.${i}.quantity`) ? 'has-error' : ''}`} inputMode="decimal" value={l.quantity} onChange={(e) => setLine(l.id, { quantity: e.target.value })} />
                      <FieldError text={err(`lines.${i}.quantity`)} />
                    </div>
                    <div>
                      <input className={`input num ${err(`lines.${i}.unitPrice`) ? 'has-error' : ''}`} inputMode="decimal" value={l.unitPrice} onChange={(e) => setLine(l.id, { unitPrice: e.target.value })} placeholder="0,00" />
                      <FieldError text={err(`lines.${i}.unitPrice`)} />
                    </div>
                    <div>
                      <input className={`input num ${err(`lines.${i}.vatRate`) ? 'has-error' : ''}`} inputMode="decimal" list="rate-presets" value={l.vatRate} onChange={(e) => setLine(l.id, { vatRate: e.target.value })} placeholder="À choisir" />
                      <FieldError text={err(`lines.${i}.vatRate`)} />
                    </div>
                    <button type="button" className="btn btn-ghost btn-icon" title="Supprimer la ligne" disabled={form.lines.length === 1} onClick={() => set('lines', form.lines.filter((x) => x.id !== l.id))}>
                      ✕
                    </button>
                  </div>
                ))}
                <datalist id="desc-presets">
                  {DESCRIPTION_PRESETS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                <datalist id="rate-presets">
                  {RATE_PRESETS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
              <button type="button" className="btn btn-ghost btn-small add-line" onClick={() => set('lines', [...form.lines, newLine()])}>
                + Ajouter une ligne
              </button>
              <p className="muted small">
                Le taux de TVA est choisi par toi pour chaque ligne : il n’est jamais déduit du pays du client. En cas de doute (client professionnel, étranger, exonération), valide avec la comptabilité.
              </p>
            </div>
          </section>
          <p className="muted small disclaimer">
            Cet outil calcule et met en page la facture ; il ne vérifie pas sa conformité légale ou fiscale. Fais valider les mentions et taux par la comptabilité avant envoi.
          </p>
        </div>

        <aside className="invoice-side">
          <div className="sum-card">
            <div className="sum-row">
              <span>Sous-total HT</span>
              <strong>{formatMoney(t.totalHT, cur)}</strong>
            </div>
            {t.groups.length === 0 ? (
              <div className="sum-row">
                <span>TVA</span>
                <strong>{formatMoney(0n, cur)}</strong>
              </div>
            ) : (
              t.groups.map((g) => (
                <div key={g.rateBp} className="sum-row">
                  <span>TVA ({formatRate(g.rateBp)})</span>
                  <strong>{formatMoney(g.tva, cur)}</strong>
                </div>
              ))
            )}
            <div className="sum-row sum-total">
              <span>TOTAL TTC</span>
              <strong>{formatMoney(t.totalTTC, cur)}</strong>
            </div>
            <div className="sum-foot">
              <span className="muted small">Montants saisis en {form.priceMode}</span>
              {build.isValid ? <span className="ok-text small">Prête à générer</span> : <span className="warn-text small">{errorList.length} point(s) à compléter</span>}
            </div>
            <label className={`confirm-box ${form.paymentConfirmed ? 'is-checked' : ''} ${err('paymentConfirmed') ? 'is-invalid' : ''}`}>
              <input type="checkbox" checked={form.paymentConfirmed} onChange={(e) => set('paymentConfirmed', e.target.checked)} />
              <span>{invoiceTemplate.paymentConfirmation}</span>
            </label>
            <button type="button" className="btn btn-primary sum-generate" onClick={onGenerate} disabled={busy || !form.paymentConfirmed} title={form.paymentConfirmed ? undefined : 'Confirme d’abord la réception du règlement intégral'}>
              {busy ? 'Génération…' : 'Générer le PDF'}
            </button>
            {!form.paymentConfirmed && <span className="muted small">Une facture n’est émise qu’après règlement intégral.</span>}
          </div>
          <PdfPreview data={build.draft} />
          <p className="muted small">Fichier : {fileName}</p>
        </aside>
      </div>

      {previewOpen && (
        <div className="modal" onClick={() => setPreviewOpen(false)}>
          <div className="modal-inner modal-pdf" onClick={(e) => e.stopPropagation()}>
            <div className="modal-bar">
              <span>Aperçu exact du PDF{build.isValid ? '' : ' — brouillon incomplet'}</span>
              <div className="modal-bar-actions">
                <button type="button" className="btn btn-primary btn-small" onClick={onGenerate} disabled={busy || !form.paymentConfirmed} title={form.paymentConfirmed ? undefined : 'Confirme d’abord la réception du règlement intégral'}>
                  Générer le PDF
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setPreviewOpen(false)}>
                  Fermer (Échap)
                </button>
              </div>
            </div>
            <PdfPreview data={build.draft} large onEscape={() => setPreviewOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Champs ---------- */

function F({ label, required, error, hint, wide, children }: { label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`field ${wide ? 'field-wide' : ''} ${error ? 'is-invalid' : ''}`}>
      <span className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </span>
      {children}
      {error ? <FieldError text={error} /> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

function FieldError({ text }: { text?: string }) {
  return text ? <span className="field-error">{text}</span> : null;
}

/* ---------- Aperçu : le vrai PDF, rendu localement ---------- */

function PdfPreview({ data, large = false, onEscape }: { data: InvoiceData; large?: boolean; onEscape?: () => void }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [width, setWidth] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);

  // Rendu du PDF à chaque changement de données (légère temporisation pendant la saisie).
  useEffect(() => {
    let cancelled = false;
    setState((s) => (s === 'ready' ? 'ready' : 'loading'));
    const timer = window.setTimeout(async () => {
      try {
        const [{ renderInvoicePdfBlob }, { loadPdf, disposePdf }] = await Promise.all([loadPdfRenderer(), import('../documents/pdf/pdfPages')]);
        const pdf = await loadPdf(await renderInvoicePdfBlob(data));
        if (cancelled) return disposePdf(pdf);
        setDoc((prev) => {
          // L'ancien document n'est libéré qu'une fois le nouveau affiché.
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
  }, [data, large]);

  const docRef = useRef<PDFDocumentProxy | null>(null);
  docRef.current = doc;
  useEffect(() => () => void (docRef.current && import('../documents/pdf/pdfPages').then((m) => m.disposePdf(docRef.current!))), []);

  // Largeur disponible : les pages s'adaptent au cadre.
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
        <div className="pdf-pages" aria-label="Aperçu de la facture">
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPageCanvas key={`${doc.fingerprints[0]}-${i}`} doc={doc} page={i + 1} width={width} />
          ))}
        </div>
      )}
      {state === 'loading' && !doc && <div className="pdf-status">Préparation de l’aperçu…</div>}
      {state === 'error' && <div className="pdf-status">L’aperçu n’a pas pu être généré. Réessaie ; si le problème persiste, vérifie le logo (PNG ou JPEG).</div>}
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
