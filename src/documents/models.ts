/**
 * Modèles des documents. Le formulaire produit un modèle, l'aperçu l'affiche.
 * Devis / attestation : aperçu HTML (V1). La facture utilise le nouveau module invoice/ + pdf/.
 */
import type { QuoteLine } from '../lib/documentCalc';
import { addDays, todayISO } from '../lib/documentCalc';

export interface CustomerInfo {
  prenom: string;
  nom: string;
  societe: string;
  email: string;
  adresse: string;
  pays: string;
  numeroTva: string;
}

export interface QuoteModel extends CustomerInfo {
  numeroDevis: string;
  dateDevis: string;
  validiteJours: number;
  devise: string;
  lignes: QuoteLine[];
  notes: string;
}

export interface AttestationModel {
  prenom: string;
  nom: string;
  formation: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  dateGeneration: string;
}

const emptyCustomer: CustomerInfo = { prenom: '', nom: '', societe: '', email: '', adresse: '', pays: '', numeroTva: '' };

let lineSeq = 0;
export const newLine = (): QuoteLine => ({ id: `l${++lineSeq}`, label: '', quantity: 1, unitPriceHT: 0, vatRate: 20 });

export const emptyQuote = (): QuoteModel => ({
  ...emptyCustomer,
  numeroDevis: '',
  dateDevis: todayISO(),
  validiteJours: 30,
  devise: 'EUR',
  lignes: [newLine()],
  notes: '',
});

export const emptyAttestation = (): AttestationModel => ({
  prenom: '',
  nom: '',
  formation: '',
  dateDebut: '',
  dateFin: '',
  statut: 'En cours',
  dateGeneration: todayISO(),
});

/** Exemples DÉMO — personnes et montants fictifs. */
const demoCustomer: CustomerInfo = {
  prenom: 'Alexandre',
  nom: 'Exemple',
  societe: 'Société Démo SAS',
  email: 'alexandre@exemple.com',
  adresse: '1 rue de l’Exemple, 75000 Paris',
  pays: 'France',
  numeroTva: 'FR00000000000',
};

export const demoQuote = (): QuoteModel => ({
  ...emptyQuote(),
  ...demoCustomer,
  numeroDevis: 'DEMO-D-0001',
  lignes: [
    { ...newLine(), label: 'Formation Démo — accès 12 mois', quantity: 1, unitPriceHT: 414.17 },
    { ...newLine(), label: 'Séance de coaching individuelle', quantity: 2, unitPriceHT: 90 },
  ],
  notes: 'Document de démonstration — sans valeur.',
});

export const demoAttestation = (): AttestationModel => ({
  ...emptyAttestation(),
  prenom: 'Alexandre',
  nom: 'Exemple',
  formation: 'Formation Démo',
  dateDebut: addDays(todayISO(), -60),
  dateFin: '',
  statut: 'En cours',
});
