/**
 * Récupération locale de la clé API, sans jamais l'écrire sur disque.
 * Ordre : variable d'environnement FRESHDESK_API_KEY, puis Trousseau macOS.
 */
import { execFile } from 'node:child_process';

export const KEYCHAIN_SERVICE = 'ecc-freshdesk-api-key';

export function readApiKey() {
  const fromEnv = process.env.FRESHDESK_API_KEY?.trim();
  if (fromEnv) return Promise.resolve({ key: fromEnv, source: 'variable FRESHDESK_API_KEY' });
  return new Promise((resolve) => {
    execFile('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'], (err, stdout) => {
      const key = stdout?.trim();
      resolve(err || !key ? { key: null, source: null } : { key, source: 'Trousseau macOS' });
    });
  });
}
