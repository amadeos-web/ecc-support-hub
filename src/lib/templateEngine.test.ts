import { describe, expect, it } from 'vitest';
import { missingVariables, renderTemplate } from './templateEngine';

describe('renderTemplate', () => {
  it('remplace le prénom', () => {
    expect(renderTemplate('Bonjour {{prenom}}, merci pour ton message.', { prenom: 'Alexandre' })).toBe(
      'Bonjour Alexandre, merci pour ton message.',
    );
  });
  it('laisse les variables vides visibles', () => {
    expect(renderTemplate('Bonjour {{prenom}} — {{formation}}', { prenom: 'Léa' })).toBe('Bonjour Léa — {{formation}}');
  });
  it('tolère les espaces dans les accolades', () => {
    expect(renderTemplate('Hello {{ prenom }}', { prenom: 'Sam' })).toBe('Hello Sam');
  });
  it('liste les variables manquantes sans doublon', () => {
    expect(missingVariables('{{prenom}} {{date}} {{date}} {{montant}}', { prenom: 'A', montant: ' ' })).toEqual(['date', 'montant']);
  });
});
