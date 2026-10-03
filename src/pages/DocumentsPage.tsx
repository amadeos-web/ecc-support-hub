import { useEffect, useState, type ReactNode } from 'react';
import { attestationStatuses, currencies, documentTypes, getDocumentType, vatRates } from '../data';
import { href } from '../lib/router';
import { formatMoney, lineTotalHT, totalsFromLines } from '../lib/documentCalc';
import {
  demoAttestation,
  demoQuote,
  emptyAttestation,
  emptyQuote,
  newLine,
  type AttestationModel,
  type CustomerInfo,
  type QuoteModel,
} from '../documents/models';
import { AttestationPreview, QuotePreview } from '../documents/Previews';
import { InvoiceEditor } from './InvoiceEditor';
import { PDF_ENGINE_READY } from '../documents/pdf';
import { PageHeader } from '../components/ui';

export function DocumentsPage({ typeId }: { typeId?: string }) {
  const type = getDocumentType(typeId)?.id ?? 'facture';
  const [quote, setQuote] = useState<QuoteModel>(emptyQuote);
  const [attestation, setAttestation] = useState<AttestationModel>(emptyAttestation);
  const [fullPreview, setFullPreview] = useState(false);

  useEffect(() => {
    if (!fullPreview) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullPreview(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullPreview]);

  const fillDemo = () => {
    if (type === 'devis') setQuote(demoQuote());
    if (type === 'attestation') setAttestation(demoAttestation());
  };
  const clear = () => {
    if (type === 'devis') setQuote(emptyQuote());
    if (type === 'attestation') setAttestation(emptyAttestation());
  };

  const preview = type === 'devis' ? <QuotePreview m={quote} /> : <AttestationPreview m={attestation} />;

  return (
    <div className="page">
      <PageHeader title="Générer un document" subtitle="Remplis le formulaire : l'aperçu se met à jour en direct." />

      <div className="doc-tabs">
        {documentTypes.map((d) => (
          <a key={d.id} href={href('documents', d.id)} className={`doc-tab ${d.id === type ? 'is-active' : ''}`}>
            <strong>{d.label}</strong>
            <span className="muted small">{d.description}</span>
          </a>
        ))}
      </div>

      {type === 'facture' ? (
        <InvoiceEditor />
      ) : (
        <>
      <div className="doc-actions">
        <button type="button" className="btn btn-primary" onClick={() => setFullPreview(true)}>
          Prévisualiser
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!PDF_ENGINE_READY}
          title="L'export PDF n'est pas encore connecté (V1)"
        >
          Générer le PDF {!PDF_ENGINE_READY && <span className="badge badge-todo">À connecter</span>}
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={fillDemo}>
          Remplir avec un exemple (démo)
        </button>
        <button type="button" className="btn btn-ghost" onClick={clear}>
          Vider le formulaire
        </button>
      </div>

      <div className="doc-layout">
        <div className="doc-form">
          {type === 'devis' && <QuoteForm m={quote} set={setQuote} />}
          {type === 'attestation' && <AttestationForm m={attestation} set={setAttestation} />}
        </div>
        <div className="doc-preview">{preview}</div>
      </div>

      {fullPreview && (
        <div className="modal" onClick={() => setFullPreview(false)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <div className="modal-bar">
              <span>Aperçu — {getDocumentType(type)?.label}</span>
              <button type="button" className="btn btn-ghost" onClick={() => setFullPreview(false)}>
                Fermer (Échap)
              </button>
            </div>
            {preview}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

/* ---------- Champs ---------- */

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

type Setter<T> = (fn: (prev: T) => T) => void;

function textInput<T>(m: T, set: Setter<T>, key: keyof T, type: 'text' | 'email' | 'date' = 'text', placeholder?: string) {
  return (
    <input
      className="input"
      type={type}
      value={String(m[key] ?? '')}
      placeholder={placeholder}
      onChange={(e) => set((prev) => ({ ...prev, [key]: e.target.value }))}
    />
  );
}

function numberInput<T>(m: T, set: Setter<T>, key: keyof T, step = '0.01') {
  return (
    <input
      className="input"
      type="number"
      step={step}
      min="0"
      value={Number(m[key]) || ''}
      onChange={(e) => set((prev) => ({ ...prev, [key]: e.target.valueAsNumber || 0 }))}
    />
  );
}

function CustomerFields<T extends CustomerInfo>({ m, set }: { m: T; set: Setter<T> }) {
  return (
    <fieldset className="form-section">
      <legend>Client</legend>
      <div className="form-grid">
        <Field label="Prénom">{textInput(m, set, 'prenom')}</Field>
        <Field label="Nom">{textInput(m, set, 'nom')}</Field>
        <Field label="Société (optionnel)">{textInput(m, set, 'societe')}</Field>
        <Field label="Email">{textInput(m, set, 'email', 'email')}</Field>
        <Field label="Adresse" wide>
          {textInput(m, set, 'adresse')}
        </Field>
        <Field label="Pays">{textInput(m, set, 'pays')}</Field>
        <Field label="N° TVA (optionnel)">{textInput(m, set, 'numeroTva')}</Field>
      </div>
    </fieldset>
  );
}

function CurrencySelect<T extends { devise: string }>({ m, set }: { m: T; set: Setter<T> }) {
  return (
    <select className="input" value={m.devise} onChange={(e) => set((prev) => ({ ...prev, devise: e.target.value }))}>
      {currencies.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>
  );
}

/* ---------- Formulaires ---------- */

function QuoteForm({ m, set }: { m: QuoteModel; set: Setter<QuoteModel> }) {
  const totals = totalsFromLines(m.lignes);
  const updateLine = (id: string, patch: Partial<QuoteModel['lignes'][number]>) =>
    set((p) => ({ ...p, lignes: p.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  return (
    <>
      <CustomerFields m={m} set={set} />
      <fieldset className="form-section">
        <legend>Devis</legend>
        <div className="form-grid">
          <Field label="Numéro de devis">{textInput(m, set, 'numeroDevis', 'text', 'Ex. ECC-D-2026-0001')}</Field>
          <Field label="Date du devis">{textInput(m, set, 'dateDevis', 'date')}</Field>
          <Field label="Validité (jours)">{numberInput(m, set, 'validiteJours', '1')}</Field>
          <Field label="Devise">
            <CurrencySelect m={m} set={set} />
          </Field>
        </div>
      </fieldset>
      <fieldset className="form-section">
        <legend>Lignes / prestations</legend>
        <div className="lines">
          <div className="line line-head">
            <span>Prestation</span>
            <span>Qté</span>
            <span>Prix unit. HT</span>
            <span>TVA</span>
            <span>Total HT</span>
            <span />
          </div>
          {m.lignes.map((l) => (
            <div key={l.id} className="line">
              <input className="input" value={l.label} placeholder="Désignation" onChange={(e) => updateLine(l.id, { label: e.target.value })} />
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={l.quantity || ''}
                onChange={(e) => updateLine(l.id, { quantity: e.target.valueAsNumber || 0 })}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={l.unitPriceHT || ''}
                onChange={(e) => updateLine(l.id, { unitPriceHT: e.target.valueAsNumber || 0 })}
              />
              <select className="input" value={l.vatRate} onChange={(e) => updateLine(l.id, { vatRate: Number(e.target.value) })}>
                {vatRates.map((r) => (
                  <option key={r} value={r}>
                    {r} %
                  </option>
                ))}
              </select>
              <span className="line-total">{formatMoney(lineTotalHT(l), m.devise)}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                title="Supprimer la ligne"
                disabled={m.lignes.length === 1}
                onClick={() => set((p) => ({ ...p, lignes: p.lignes.filter((x) => x.id !== l.id) }))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => set((p) => ({ ...p, lignes: [...p.lignes, newLine()] }))}>
          + Ajouter une ligne
        </button>
        <CalcSummary ht={totals.ht} tva={totals.tva} ttc={totals.ttc} currency={m.devise} />
        <Field label="Notes" wide>
          <textarea className="input" rows={2} value={m.notes} onChange={(e) => set((p) => ({ ...p, notes: e.target.value }))} />
        </Field>
      </fieldset>
    </>
  );
}

function AttestationForm({ m, set }: { m: AttestationModel; set: Setter<AttestationModel> }) {
  return (
    <fieldset className="form-section">
      <legend>Attestation de suivi</legend>
      <div className="form-grid">
        <Field label="Prénom">{textInput(m, set, 'prenom')}</Field>
        <Field label="Nom">{textInput(m, set, 'nom')}</Field>
        <Field label="Formation" wide>
          {textInput(m, set, 'formation')}
        </Field>
        <Field label="Date de début">{textInput(m, set, 'dateDebut', 'date')}</Field>
        <Field label="Date de fin (vide = en cours)">{textInput(m, set, 'dateFin', 'date')}</Field>
        <Field label="Statut / suivi">
          <select className="input" value={m.statut} onChange={(e) => set((p) => ({ ...p, statut: e.target.value }))}>
            {attestationStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Date de génération">{textInput(m, set, 'dateGeneration', 'date')}</Field>
      </div>
    </fieldset>
  );
}

function CalcSummary({ ht, tva, ttc, currency }: { ht: number; tva: number; ttc: number; currency: string }) {
  return (
    <div className="calc">
      <div>
        <span>HT</span>
        <strong>{formatMoney(ht, currency)}</strong>
      </div>
      <div>
        <span>TVA</span>
        <strong>{formatMoney(tva, currency)}</strong>
      </div>
      <div className="calc-ttc">
        <span>TTC</span>
        <strong>{formatMoney(ttc, currency)}</strong>
      </div>
    </div>
  );
}
