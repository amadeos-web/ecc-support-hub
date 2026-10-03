import type { AttestationModel, QuoteModel } from './models';
import { attestationTemplate as A } from '../data/otherDocsTemplate';
import { formatDate } from '../lib/documentCalc';

/** Un point bloquant : message + section du formulaire où le corriger. */
export interface DocIssue {
  section: string;
  message: string;
}

export function quoteIssues(m: QuoteModel): DocIssue[] {
  const out: DocIssue[] = [];
  if (!m.societe.trim() && !(m.prenom.trim() && m.nom.trim())) out.push({ section: 'Client', message: 'Renseigne la société, ou le prénom et le nom du client.' });
  if (!m.numeroDevis.trim()) out.push({ section: 'Devis', message: 'Renseigne le numéro de devis.' });
  if (!m.dateDevis) out.push({ section: 'Devis', message: 'Renseigne la date du devis.' });
  const lines = m.lignes.filter((l) => l.label.trim());
  if (lines.length === 0) out.push({ section: 'Lignes / prestations', message: 'Ajoute au moins une prestation avec sa désignation.' });
  if (lines.some((l) => !(l.unitPriceHT > 0))) out.push({ section: 'Lignes / prestations', message: 'Renseigne le prix de chaque prestation.' });
  return out;
}

export function attestationIssues(m: AttestationModel): DocIssue[] {
  const out: DocIssue[] = [];
  if (!m.prenom.trim() || !m.nom.trim()) out.push({ section: 'Membre', message: 'Renseigne le prénom et le nom du membre.' });
  if (!m.formation.trim()) out.push({ section: 'Formation', message: 'Renseigne la formation suivie.' });
  if (!m.dateDebut) out.push({ section: 'Formation', message: 'Renseigne la date de début.' });
  return out;
}

/** Texte de l'attestation, partagé entre le PDF et son aperçu. */
export function attestationParagraphs(m: AttestationModel, issuerName: string) {
  return {
    intro: `${issuerName} atteste que ${m.prenom.trim()} ${m.nom.trim()} est inscrit(e) à la formation ${m.formation.trim()}.`,
    details: [
      `${A.startLabel} : ${formatDate(m.dateDebut)}`,
      `${A.endLabel} : ${m.dateFin ? formatDate(m.dateFin) : A.endOngoing}`,
      `${A.statusLabel} : ${m.statut}`,
    ],
    closing: A.closing,
    madeOn: `${A.madeOn} ${formatDate(m.dateGeneration)}`,
  };
}
