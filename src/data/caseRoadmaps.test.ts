import { describe, expect, it } from 'vitest';
import { caseGuidance, kycRequiredIds, roadmapFor, supportCases } from '.';

describe('roadmaps des cas : aucune information du process ne disparaît', () => {
  it('chaque étape du process est placée dans la roadmap, une seule fois, dans l’ordre', () => {
    for (const c of supportCases) {
      const used = roadmapFor(c).flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'steps' ? b.idx : [])));
      expect(used, c.id).toEqual(c.steps.map((_, i) => i));
    }
  });
  it('chaque réponse au membre du cas est proposée à une étape (ou comme réponse d’un embranchement)', () => {
    for (const c of supportCases) {
      const placed = new Set([
        ...roadmapFor(c).flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'message' ? [b.id] : []))),
        ...(caseGuidance[c.id]?.branches ?? []).flatMap((b) => (b.messageId ? [b.messageId] : [])),
      ]);
      for (const m of c.memberMessages) expect(placed.has(m.templateId), `${c.id} : ${m.templateId}`).toBe(true);
    }
  });
  it('vérifications, informations à demander, « à ne pas faire » et escalade sont affichés quand ils existent', () => {
    for (const c of supportCases) {
      const kinds = new Set(roadmapFor(c).flatMap((s) => s.blocks.map((b) => b.kind)));
      if (c.checks.length) expect(kinds.has('checks'), `${c.id} checks`).toBe(true);
      if (c.doNot.length) expect(kinds.has('doNot'), `${c.id} doNot`).toBe(true);
      if (c.escalation) expect(kinds.has('escalation'), `${c.id} escalation`).toBe(true);
      if (c.infoToCollect.some((i) => !['Prénom', 'Nom', 'Email', 'Email utilisé lors de l’inscription'].includes(i))) expect(kinds.has('ask'), `${c.id} ask`).toBe(true);
    }
  });
  it('titres d’étapes en verbes d’action, sans doublon', () => {
    for (const c of supportCases) {
      const titles = roadmapFor(c).map((s) => s.title);
      expect(new Set(titles).size, c.id).toBe(titles.length);
    }
  });
  it('KYC : aucun cas qui donne ou rétablit un accès n’échappe au contrôle KYC (hors cas déjà dédiés au KYC)', () => {
    const kycNative = new Set(['cas-absent-base-kyc', 'cas-verification-kyc']);
    for (const c of supportCases) {
      const givesAccess = c.steps.some((s) => s.owner === 'gestion-acces');
      if (givesAccess && !kycNative.has(c.id)) expect(kycRequiredIds.has(c.id), c.id).toBe(true);
    }
    for (const id of kycRequiredIds) expect(supportCases.some((c) => c.id === id), id).toBe(true);
  });
  it('KYC : pas ajouté aux cas sans accès à donner (vidéos, documents, paiements…)', () => {
    for (const id of ['cas-lecture-videos', 'cas-video-telephone', 'cas-facture', 'cas-devis', 'cas-attestation', 'cas-date-prelevement', 'cas-remboursement', 'cas-plusieurs-appareils', 'cas-autre-bug', 'cas-utilisation-circle']) {
      expect(kycRequiredIds.has(id), id).toBe(false);
    }
  });
});
