import type { AttestationModel, QuoteModel } from './models';
import { attestationTemplate as A } from '../data/otherDocsTemplate';
import { formatDate } from '../lib/documentCalc';

/** Un point bloquant : champ concerné (`key`) et message court affiché sous ce champ. */
export interface DocIssue {
  key: string;
  message: string;
}

/**
 * Devis : seul l'indispensable bloque : un client (société, OU prénom + nom) et une prestation chiffrée.
 * Numéro, adresse, email, TVA, notes restent facultatifs et ne sont imprimés que s'ils sont renseignés.
 */
export function quoteIssues(m: QuoteModel): DocIssue[] {
  const out: DocIssue[] = [];
  if (!m.societe.trim() && !(m.prenom.trim() && m.nom.trim())) out.push({ key: 'identity', message: 'Renseigne la société, ou le prénom et le nom du client.' });
  if (!m.lignes.some((l) => l.label.trim() && l.unitPriceHT > 0)) out.push({ key: 'ligne', message: 'Renseigne la désignation et le prix d’au moins une prestation.' });
  return out;
}

/** Attestation : le membre et la formation. Les dates et le statut ne bloquent pas. */
export function attestationIssues(m: AttestationModel): DocIssue[] {
  const out: DocIssue[] = [];
  if (!m.prenom.trim()) out.push({ key: 'prenom', message: 'Renseigne le prénom.' });
  if (!m.nom.trim()) out.push({ key: 'nom', message: 'Renseigne le nom.' });
  if (!m.formation.trim()) out.push({ key: 'formation', message: 'Renseigne la formation.' });
  return out;
}

/** Texte de l'attestation, partagé entre le PDF et son aperçu (les mentions vides ne sont pas imprimées). */
export function attestationParagraphs(m: AttestationModel, issuerName: string) {
  return {
    intro: `${issuerName} atteste que ${m.prenom.trim()} ${m.nom.trim()} est inscrit(e) à la formation ${m.formation.trim()}.`,
    details: [
      m.dateDebut && `${A.startLabel} : ${formatDate(m.dateDebut)}`,
      `${A.endLabel} : ${m.dateFin ? formatDate(m.dateFin) : A.endOngoing}`,
      m.statut && `${A.statusLabel} : ${m.statut}`,
    ].filter((x): x is string => Boolean(x)),
    closing: A.closing,
    madeOn: `${A.madeOn} ${formatDate(m.dateGeneration)}`,
  };
}
