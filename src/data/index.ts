/**
 * Point d'entrée unique des données. Les composants importent UNIQUEMENT depuis ce fichier.
 */
import { supportCases } from './supportCases';
import { templates } from './templates';
import { internalMessages } from './internalMessages';
import { documentTypes } from './documentTypes';
import { roles } from './roles';

export * from './types';
export * from './categories';
export { caseGuidance } from './caseGuidance';
export type { CaseGuidance } from './caseGuidance';
export { getRole } from './roles';
export { getInternalMessage } from './internalMessages';
export { issuer, currencies, vatRates, attestationStatuses } from './documentTypes';
export type { Currency } from './documentTypes';
export { supportCases, templates, internalMessages, documentTypes, roles };

export const getCase = (id?: string) => supportCases.find((c) => c.id === id);
export const getTemplate = (id?: string) => templates.find((t) => t.id === id);
export const getDocumentType = (id?: string) => documentTypes.find((d) => d.id === id);

/** Cas dont le message au membre est ce template. */
export const casesForTemplate = (templateId: string) => supportCases.filter((c) => c.memberMessages.some((m) => m.templateId === templateId));

/** Cas remontés vers un intervenant. */
export const casesEscalatedTo = (roleId: string) => supportCases.filter((c) => c.escalation?.to === roleId || c.steps.some((s) => s.owner === roleId));
