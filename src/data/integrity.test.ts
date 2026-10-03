import { describe, expect, it } from 'vitest';
import { categories, internalMessages, roles, supportCases, templates } from '.';

/** Vérifie que tous les liens entre données pointent vers des éléments existants. */
describe('cohérence des données', () => {
  const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
  const caseIds = ids(supportCases);
  const tplIds = ids(templates);
  const intIds = ids(internalMessages);
  const roleIds = ids(roles);
  const catIds = ids(categories);

  it('identifiants uniques', () => {
    for (const xs of [supportCases, templates, internalMessages, roles]) expect(ids(xs).size).toBe(xs.length);
  });

  it('chaque cas pointe vers des éléments existants', () => {
    for (const c of supportCases) {
      expect(catIds, c.id).toContain(c.category);
      c.memberMessages.forEach((m) => expect(tplIds, c.id).toContain(m.templateId));
      c.internalMessageIds.forEach((m) => expect(intIds, c.id).toContain(m));
      c.relatedCaseIds.forEach((r) => expect(caseIds, c.id).toContain(r));
      c.steps.forEach((s) => expect(roleIds, c.id).toContain(s.owner));
      if (c.escalation) expect(roleIds, c.id).toContain(c.escalation.to);
    }
    internalMessages.forEach((m) => expect(roleIds, m.id).toContain(m.to));
  });

  it('cohérence du statut : une escalade précise vers qui, un cas validé ne laisse rien « à valider » de bloquant', () => {
    for (const c of supportCases) {
      if (c.handling === 'escalade') expect(c.escalation, c.id).toBeDefined();
      if (c.handling === undefined) expect(c.validation, `${c.id} sans responsable doit être à valider`).toBe('a-valider');
      if (c.validation === 'a-valider') expect(c.toValidate.length + c.contradictions.length, `${c.id} : préciser quoi valider`).toBeGreaterThan(0);
    }
  });

  it('aucune donnée de démonstration mélangée aux cas réels', () => {
    expect(supportCases.filter((c) => c.source === 'demo' || c.validation === 'demo')).toEqual([]);
  });

  it('27 cas Freshdesk, tous sourcés par des tickets réels', () => {
    expect(supportCases).toHaveLength(27);
    for (const c of supportCases) {
      expect(c.source, c.id).toBe('freshdesk');
      expect(c.sources.freshdeskTickets.length, c.id).toBeGreaterThan(0);
      expect(c.frequency, c.id).toBe(c.sources.freshdeskTickets.length);
    }
    expect(supportCases.reduce((s, c) => s + (c.frequency ?? 0), 0)).toBe(526);
  });

  it('les 14 templates validés sont tous rattachés à au moins un cas compatible', () => {
    expect(templates).toHaveLength(14);
    for (const t of templates) {
      expect(t.caseIds.length, t.id).toBeGreaterThan(0);
      t.caseIds.forEach((id) => expect(caseIds, t.id).toContain(id));
      for (const id of t.caseIds) expect(supportCases.find((c) => c.id === id)!.memberMessages.some((m) => m.templateId === t.id), `${t.id} ↔ ${id}`).toBe(true);
    }
  });

  it('RÈGLE ACCÈS : aucune étape d’invitation / réinvitation n’est confiée au SAV', () => {
    for (const c of supportCases) {
      for (const s of c.steps) {
        if (s.owner === 'sav' && /(r[ée])?invit|rétabli|rouvrir|réactiv/i.test(s.text)) {
          expect(/^(Expliquer|Demander|Suivre|Confirmer|Vérifier que|Envoyer le message|Si |Une fois|Quand|Faire vérifier)/.test(s.text), `${c.id} : « ${s.text} »`).toBe(true);
        }
      }
    }
  });

  it('les cas d’accès passent par la comptabilité avec le message interne', () => {
    for (const id of ['cas-acces-v2-non-recu', 'cas-desabonnement-accidentel', 'cas-acces-retire-sans-explication']) {
      const c = supportCases.find((x) => x.id === id)!;
      expect(c.escalation?.to).toBe('comptabilite');
      expect(c.internalMessageIds).toContain('int-compta-acces');
      expect(c.doNot.some((d) => /inviter/.test(d))).toBe(true);
    }
  });

  it('sujets sensibles conservés « À valider » (partage, remboursement, KYC, défaut de paiement)', () => {
    for (const id of ['cas-double-acces', 'cas-remboursement', 'cas-verification-kyc', 'cas-absent-base-kyc', 'cas-defaut-paiement']) {
      expect(supportCases.find((x) => x.id === id)!.validation, id).toBe('a-valider');
    }
  });
});
