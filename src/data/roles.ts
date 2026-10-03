import type { Role, RoleId } from './types';

/**
 * Intervenants des procédures (escalades observées dans Freshdesk + règles ECC).
 * `contact` = nom ou canal réel, à renseigner par ECC (vide = non renseigné ; aucun nom inventé).
 */
export const roles: Role[] = [
  { id: 'sav', label: 'SAV (toi)', contact: '' },
  { id: 'comptabilite', label: 'Comptabilité', contact: '' },
  { id: 'gestion-acces', label: 'Personne compétente pour les accès', contact: '' },
  { id: 'sales-tracker', label: 'Vérification des paiements (Sales Tracker)', contact: 'Chrisha ou Amine — d’après le document FACTURATION ECC' },
  { id: 'technique', label: 'Équipe technique', contact: '' },
  { id: 'finance', label: 'Équipe finance', contact: '' },
  { id: 'commercial', label: 'Contact commercial', contact: '' },
  { id: 'communaute', label: 'Responsables de la communauté', contact: '' },
];

export const getRole = (id?: RoleId) => roles.find((r) => r.id === id);
