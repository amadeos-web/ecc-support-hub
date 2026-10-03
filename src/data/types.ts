/**
 * Modèle de données du Support Hub.
 *
 * Toutes les données métier respectent ces types. L'analyse de l'historique Freshdesk
 * alimentera directement ces structures : les composants n'ont pas à changer.
 */

/**
 * Origine d'une donnée.
 * - "template-sav-ecc" : document officiel « TEMPLATE SAV ECC » ;
 * - "instruction-ecc"  : règle donnée explicitement par l'équipe ECC ;
 * - "freshdesk"        : déduit de l'historique Freshdesk ;
 * - "demo"             : placeholder fictif (badge « Démo »), jamais mélangé aux cas réels.
 */
export type DataSource = 'template-sav-ecc' | 'instruction-ecc' | 'freshdesk' | 'manuel' | 'demo';

/**
 * Grandes catégories (cartes de la page « Traiter une demande »).
 * PROVISOIRES : la liste définitive sera fixée par l'analyse Freshdesk.
 */
export type CategoryId =
  | 'acces-connexion'
  | 'paiement-statut'
  | 'formation-whop'
  | 'communaute-circle'
  | 'factures-documents'
  | 'compte-membre'
  | 'technique'
  | 'autre';

export interface Category {
  id: CategoryId;
  label: string;
  /** Libellé court du filtre compact de « Traiter une demande ». */
  filterLabel: string;
  icon: string;
  hint: string;
}

/** Qui traite le cas. */
export type Handling = 'sav' | 'escalade' | 'ne-pas-traiter';

/** Statut principal affiché : À VALIDER prime sur le mode de traitement. */
export type CaseStatus = 'sav-direct' | 'a-remonter' | 'a-valider' | 'ne-pas-traiter';

/** Personnes / services intervenant dans les procédures. */
export type RoleId = 'sav' | 'comptabilite' | 'gestion-acces' | 'sales-tracker' | 'technique' | 'finance' | 'commercial' | 'communaute';

export interface Role {
  id: RoleId;
  label: string;
  /** Nom / canal de contact réel — à renseigner par ECC (vide = non renseigné). */
  contact: string;
}

/**
 * Statut de validation d'un cas :
 * - "valide"    : procédure documentée par ECC (document officiel ou instruction explicite) ;
 * - "a-valider" : observée ou incomplète, doit être confirmée humainement avant usage officiel ;
 * - "demo"      : exemple fictif pour construire l'interface.
 */
export type ValidationStatus = 'valide' | 'a-valider' | 'demo';

export interface ProcedureStep {
  text: string;
  /** Responsable de l'étape. */
  owner: RoleId;
}

/** Moment où un message au membre s'utilise. */
export type MessageMoment = 'reponse' | 'pendant' | 'resolution';

export interface MemberMessageRef {
  templateId: string;
  moment: MessageMoment;
  /** Précision affichée à l'agent (ex. « à confirmer »). */
  note?: string;
}

/** Fiche opérationnelle d'un cas SAV. */
export interface SupportCase {
  id: string;
  /** Intitulé du cas (pour les cas du Template SAV ECC : texte exact de la colonne CASE). */
  title: string;
  /** Titre court affiché dans les listes et en tête de fiche. */
  shortTitle: string;
  category: CategoryId;
  /** ① Ce que le membre demande (une phrase). */
  problem: string;
  /** Formulations réellement observées (Freshdesk), sans donnée personnelle. */
  observedRequests: string[];
  /** Nombre de tickets Freshdesk rattachés (undefined = non mesuré). */
  frequency?: number;
  /** Date ISO de la dernière observation dans Freshdesk. */
  lastObserved?: string;
  /** Informations à demander / collecter auprès du membre. */
  infoToCollect: string[];
  /** ② Vérifications avant d'agir. */
  checks: string[];
  /** ③ Process numéroté, une action par étape, avec son responsable. */
  steps: ProcedureStep[];
  /** Actions que le SAV ne doit pas faire lui-même. */
  doNot: string[];
  /** ④ Qui doit intervenir (undefined = non déterminé, à valider). */
  handling?: Handling;
  escalation?: {
    to: RoleId;
    why: string;
    infoToTransmit: string[];
    expectedReturn: string;
  };
  /** Messages internes (ids de internalMessages.ts). */
  internalMessageIds: string[];
  /** Messages au membre (ids de templates.ts). */
  memberMessages: MemberMessageRef[];
  resolution?: string;
  closingCriteria?: string;
  /** Colonne « ACTION REQUISE » du Template SAV ECC (vide si non renseignée). */
  actionRequired: string;
  validation: ValidationStatus;
  /** Ce qui doit être confirmé humainement / contradictions détectées. */
  toValidate: string[];
  contradictions: string[];
  /** Pratiques observées dans l'historique mais OBSOLÈTES (jamais présentées comme procédure). */
  obsoletePractices: string[];
  relatedCaseIds: string[];
  internalNotes: string[];
  keywords: string[];
  /** Traçabilité : tickets Freshdesk et documents ayant servi à établir le cas. */
  sources: { freshdeskTickets: number[]; documents: string[] };
  source: DataSource;
}

/** Variables utilisables dans les messages : {{prenom}}, {{nom}}… */
export type TemplateVariable = 'prenom' | 'nom' | 'email' | 'formation' | 'montant' | 'date' | 'numero_facture' | 'lien_invoice';

/** Message au membre. */
export interface MessageTemplate {
  id: string;
  /** Intitulé du cas auquel répond le message. */
  title: string;
  category: CategoryId;
  /** Texte exact de la source (seuls les artefacts d'extraction PDF sont corrigés). */
  sourceMessage: string;
  /** Message prêt à personnaliser, avec variables {{...}}. */
  message: string;
  variables: TemplateVariable[];
  requiredVariables: TemplateVariable[];
  /** Cas SAV auxquels ce message est rattaché. */
  caseIds: string[];
  source: DataSource;
}

/** Message interne (à destination d'une autre personne de l'équipe). */
export interface InternalMessage {
  id: string;
  to: RoleId;
  title: string;
  /** Toutes les variables d'un message interne sont obligatoires. */
  message: string;
  variables: TemplateVariable[];
  validation: ValidationStatus;
  /** Ex. « wording à ajuster ». */
  note?: string;
  source: DataSource;
}

export type DocumentTypeId = 'facture' | 'devis' | 'attestation';

export interface DocumentTypeDef {
  id: DocumentTypeId;
  label: string;
  description: string;
  keywords: string[];
}
