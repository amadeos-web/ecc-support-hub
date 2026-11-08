import type { Role, RoleId } from './types';

/**
 * Intervenants des procédures (escalades observées dans Freshdesk + règles ECC).
 * `contact` = nom ou canal réel, à renseigner par ECC (vide = non renseigné ; aucun nom inventé).
 */
export const roles: Role[] = [
  { id: 'sav', label: 'Support (you)', contact: '' },
  { id: 'comptabilite', label: 'Accounting', contact: '' },
  { id: 'gestion-acces', label: 'Person in charge of access', contact: '' },
  { id: 'sales-tracker', label: 'Payment check (Sales Tracker)', contact: 'Chrisha or Amine — per the FACTURATION ECC document' },
  { id: 'technique', label: 'Tech team', contact: '' },
  { id: 'finance', label: 'Finance team', contact: '' },
  { id: 'commercial', label: 'Sales contact', contact: '' },
  { id: 'communaute', label: 'Community managers', contact: '' },
];

export const getRole = (id?: RoleId) => roles.find((r) => r.id === id);
