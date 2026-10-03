import { describe, expect, it } from 'vitest';
import { personalizeGreeting, prepareSavTemplate } from './savTemplate';
import { missingVariables, renderTemplate } from './templateEngine';
import { templates } from '../data';

describe('salutation personnalisée', () => {
  it('« Salut 👋 » et « Bonjour 👋 » deviennent « Bonjour {{prenom}} 👋 »', () => {
    expect(personalizeGreeting('Salut 👋\n\nConcernant ton accès…')).toBe('Bonjour {{prenom}} 👋\n\nConcernant ton accès…');
    expect(personalizeGreeting('Bonjour 👋\nMerci')).toBe('Bonjour {{prenom}} 👋\nMerci');
  });
  it('« Bonjour, » devient « Bonjour {{prenom}}, »', () => {
    expect(personalizeGreeting('Bonjour,\n\nToute l’équipe')).toBe('Bonjour {{prenom}},\n\nToute l’équipe');
  });
  it('rendu avec et sans prénom', () => {
    const { message } = prepareSavTemplate('Salut 👋\n\nConcernant ton accès...');
    expect(renderTemplate(message, { prenom: 'Thomas' })).toBe('Bonjour Thomas 👋\n\nConcernant ton accès...');
    expect(renderTemplate(message, {})).toBe('Bonjour 👋\n\nConcernant ton accès...');
    expect(renderTemplate('Bonjour {{prenom}},', {})).toBe('Bonjour,');
  });
});

describe('mentions à compléter du document', () => {
  it('« LIEN DE L’INVOICE » devient une variable obligatoire', () => {
    const r = prepareSavTemplate("Salut 👋\n👉 Voici le lien de la facture :\nLIEN DE L'INVOICE\nÀ très vite");
    expect(r.message).toContain('{{lien_invoice}}');
    expect(r.message).not.toContain("LIEN DE L'INVOICE");
    expect(r.variables).toEqual(['prenom', 'lien_invoice']);
    expect(r.requiredVariables).toEqual(['lien_invoice']);
    expect(missingVariables(r.message, { prenom: 'Thomas' })).toEqual(['lien_invoice']);
    expect(missingVariables(r.message, { prenom: 'Thomas', lien_invoice: 'https://whop.com/x' })).toEqual([]);
  });
});

describe('bibliothèque Template SAV ECC', () => {
  it('14 templates, tous personnalisés par le prénom', () => {
    expect(templates).toHaveLength(14);
    for (const t of templates) {
      expect(t.source).toBe('template-sav-ecc');
      expect(t.message.split('\n')[0]).toMatch(/^Bonjour \{\{prenom\}\}( 👋|,)$/);
      expect(renderTemplate(t.message, { prenom: 'Sarah' }).startsWith('Bonjour Sarah')).toBe(true);
    }
  });
  it('seul le template « invoice 0,00 USD » exige une information supplémentaire', () => {
    const withRequired = templates.filter((t) => t.requiredVariables.length > 0);
    expect(withRequired.map((t) => [t.id, t.requiredVariables])).toEqual([['tpl-sav-relance-invoice-0-usd', ['lien_invoice']]]);
  });
  it('le message ne diffère de la source que par la salutation et les mentions à compléter', () => {
    for (const t of templates) {
      const restore = t.message
        .replace(/^Bonjour \{\{prenom\}\}/, (m) => m) // salutation comparée séparément
        .split('\n')
        .slice(1)
        .join('\n')
        .replace('{{lien_invoice}}', "LIEN DE L'INVOICE");
      expect(restore).toBe(t.sourceMessage.split('\n').slice(1).join('\n'));
    }
  });
  it('aucun artefact d’extraction PDF (ÿ, Ā) dans les textes', () => {
    for (const t of templates) expect(t.sourceMessage).not.toMatch(/[ÿĀ]/);
  });
});
