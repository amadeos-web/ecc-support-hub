import type { ReactNode } from 'react';
import { issuer } from '../data';
import { formatDate, formatMoney, lineTotalHT, totalsFromLines, addDays } from '../lib/documentCalc';
import type { AttestationModel, CustomerInfo, QuoteModel } from './models';
import eccLogo from '../assets/ecc-logo-noir.png';

const orBlank = (v: string | undefined, label: string) => (v && v.trim() ? v : <span className="doc-missing">[{label}]</span>);

function Paper({ children }: { children: ReactNode }) {
  return (
    <div className="paper">
      <div className="paper-watermark">APERÇU — NON VALABLE</div>
      <img className="paper-logo" src={eccLogo} alt="ECC" />
      {children}
    </div>
  );
}

function IssuerBlock() {
  return (
    <div className="doc-issuer">
      <strong>{issuer.name}</strong>
      {issuer.addressLines.map((l) => (
        <div key={l}>{l}</div>
      ))}
      {issuer.legalLines.map((l) => (
        <div key={l}>{l}</div>
      ))}
      <div>{issuer.email}</div>
    </div>
  );
}

function CustomerBlock({ c }: { c: CustomerInfo }) {
  return (
    <div className="doc-customer">
      <div className="doc-label">Client</div>
      {c.societe && <strong>{c.societe}</strong>}
      <div>
        {orBlank(c.prenom, 'Prénom')} {orBlank(c.nom, 'Nom')}
      </div>
      <div>{orBlank(c.adresse, 'Adresse')}</div>
      <div>{orBlank(c.pays, 'Pays')}</div>
      {c.email && <div>{c.email}</div>}
      {c.numeroTva && <div>TVA : {c.numeroTva}</div>}
    </div>
  );
}

function TotalsTable({ ht, tva, ttc, currency, tvaLabel }: { ht: number; tva: number; ttc: number; currency: string; tvaLabel: string }) {
  return (
    <table className="doc-totals">
      <tbody>
        <tr>
          <td>Total HT</td>
          <td>{formatMoney(ht, currency)}</td>
        </tr>
        <tr>
          <td>{tvaLabel}</td>
          <td>{formatMoney(tva, currency)}</td>
        </tr>
        <tr className="doc-total-ttc">
          <td>Total TTC</td>
          <td>{formatMoney(ttc, currency)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function QuotePreview({ m }: { m: QuoteModel }) {
  const totals = totalsFromLines(m.lignes);
  const validUntil = m.dateDevis ? formatDate(addDays(m.dateDevis, m.validiteJours || 0)) : '';
  return (
    <Paper>
      <div className="doc-top">
        <IssuerBlock />
        <div className="doc-meta">
          <h2>DEVIS</h2>
          <div>N° {orBlank(m.numeroDevis, 'N° devis')}</div>
          <div>Date : {orBlank(formatDate(m.dateDevis), 'Date')}</div>
          <div>Valable jusqu'au : {orBlank(validUntil, 'Validité')}</div>
        </div>
      </div>
      <CustomerBlock c={m} />
      <table className="doc-lines">
        <thead>
          <tr>
            <th>Prestation</th>
            <th>Qté</th>
            <th>Prix unit. HT</th>
            <th>TVA</th>
            <th>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {m.lignes.map((l) => (
            <tr key={l.id}>
              <td>{orBlank(l.label, 'Prestation')}</td>
              <td>{l.quantity}</td>
              <td>{formatMoney(l.unitPriceHT, m.devise)}</td>
              <td>{l.vatRate} %</td>
              <td>{formatMoney(lineTotalHT(l), m.devise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TotalsTable
        {...totals}
        currency={m.devise}
        tvaLabel={totals.byRate.length === 1 ? `TVA ${totals.byRate[0].rate} %` : 'TVA'}
      />
      {m.notes && <div className="doc-notes">{m.notes}</div>}
      <div className="doc-sign">Bon pour accord — date et signature du client :</div>
      <div className="doc-footer">[Conditions générales et mentions légales — à compléter]</div>
    </Paper>
  );
}

export function AttestationPreview({ m }: { m: AttestationModel }) {
  return (
    <Paper>
      <div className="doc-top">
        <IssuerBlock />
      </div>
      <h2 className="doc-title-center">ATTESTATION DE SUIVI DE FORMATION</h2>
      <div className="doc-body">
        <p>
          Je soussigné(e), {issuer.signatory}, atteste que <strong>{orBlank(m.prenom, 'Prénom')} {orBlank(m.nom, 'Nom')}</strong>{' '}
          est inscrit(e) à la formation <strong>{orBlank(m.formation, 'Formation')}</strong>.
        </p>
        <p>
          Date de début : <strong>{orBlank(formatDate(m.dateDebut), 'Date de début')}</strong>
          <br />
          Date de fin : <strong>{m.dateFin ? formatDate(m.dateFin) : 'en cours'}</strong>
          <br />
          Statut du suivi : <strong>{orBlank(m.statut, 'Statut')}</strong>
        </p>
        <p>Cette attestation est délivrée pour servir et valoir ce que de droit.</p>
      </div>
      <div className="doc-sign">
        Fait le {orBlank(formatDate(m.dateGeneration), 'Date de génération')}
        <br />
        {issuer.signatory}
      </div>
    </Paper>
  );
}
