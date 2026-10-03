#!/usr/bin/env node
/**
 * Export LECTURE SEULE de l'historique Freshdesk ECC.
 * Outil séparé : il n'est importé par aucune partie de l'ECC Support Hub.
 *
 *   node tools/freshdesk-export/freshdesk-export.mjs plan            → aucun appel réseau
 *   node tools/freshdesk-export/freshdesk-export.mjs test-connexion  → 1 seul appel GET
 *   node tools/freshdesk-export/freshdesk-export.mjs pilote [--limite 5]
 *   node tools/freshdesk-export/freshdesk-export.mjs export          → export complet (reprise automatique)
 *
 * Options : --depuis 2026-04-01  --sans-detail  --sans-archives  --sans-spam-supprimes  --sans-contacts  --budget 0.5
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_PATHS, FRESHDESK_HOST, createReadOnlyClient } from './lib/client.mjs';
import { KEYCHAIN_SERVICE, readApiKey } from './lib/credentials.mjs';
import { runExport } from './lib/exporter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('--')) ?? 'plan';
const flag = (name) => args.includes(`--${name}`);
const value = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const options = {
  skipDetails: flag('sans-detail'),
  skipArchives: flag('sans-archives'),
  skipSpamDeleted: flag('sans-spam-supprimes'),
  skipContacts: flag('sans-contacts'),
  /** --depuis AAAA-MM-JJ : uniquement les tickets créés à partir de cette date. */
  createdSince: value('depuis', undefined),
};
if (options.createdSince && !/^\d{4}-\d{2}-\d{2}$/.test(options.createdSince)) {
  console.error('--depuis attend une date AAAA-MM-JJ (ex. 2026-04-01).');
  process.exit(1);
}
const budget = Math.min(0.9, Math.max(0.1, Number(value('budget', 0.5)) || 0.5));

async function main() {
  const { key, source } = await readApiKey();

  if (command === 'plan') {
    console.log(`Export Freshdesk — LECTURE SEULE
  Domaine        : ${FRESHDESK_HOST}
  Clé API        : ${key ? `trouvée (${source}) — jamais affichée` : `ABSENTE (Trousseau « ${KEYCHAIN_SERVICE} » ou variable FRESHDESK_API_KEY)`}
  Méthode HTTP   : GET uniquement (codé en dur), redirections refusées
  Endpoints autorisés :
${ALLOWED_PATHS.map((r) => `    GET ${r.source.replace(/\\\//g, '/').replace(/\^|\$/g, '').replace('\\d+', '[id]').replace('\\d+', '[id]')}`).join('\n')}
  Sortie         : exports/freshdesk/ (pilote et export complet ; reprise automatique)
  Budget         : ${Math.round(budget * 100)} % de la limite Freshdesk par minute
Aucun appel réseau n'a été effectué.`);
    return;
  }

  if (!key) {
    console.error(`Clé API introuvable. Enregistre-la dans le Trousseau (service « ${KEYCHAIN_SERVICE} ») — voir README.`);
    process.exit(1);
  }
  const client = createReadOnlyClient({ apiKey: key, budgetRatio: budget, log: console.log });

  if (command === 'test-connexion') {
    const { data } = await client.get('/api/v2/tickets', { per_page: 1 });
    console.log(`✓ Connexion OK (clé : ${source}).
  Limite Freshdesk : ${client.stats.limite_par_minute ?? 'inconnue'} appels / minute (partagée avec toute l'équipe)
  Appels effectués : ${client.stats.appels} (GET)
  Ticket le plus récent visible : ${Array.isArray(data) && data[0] ? `#${data[0].id}` : 'aucun sur 30 jours'}`);
    return;
  }

  if (command === 'pilote' || command === 'export') {
    const pilot = command === 'pilote';
    const limit = pilot ? Math.max(1, Math.min(100, Number(value('limite', 5)) || 5)) : undefined;
    const outDir = path.join(ROOT, 'exports', 'freshdesk');
    console.log(`${pilot ? `Pilote (${limit} tickets)` : 'Export complet'} → ${path.relative(ROOT, outDir)}/`);
    const report = await runExport({ client, outDir, options: { ...options, limit }, log: console.log });
    console.log(`\n✓ Terminé.
  Tickets exportés      : ${report.totaux.tickets_exportes}
  Messages (avec 1ers)  : ${report.totaux.messages_total_avec_descriptions}
  Tickets à reprendre   : ${report.totaux.tickets_incomplets_a_reprendre}${report.totaux.tickets_incomplets_a_reprendre ? ' (relance la même commande)' : ''}
  Erreurs               : ${report.erreurs.length}
  Appels API (cette fois): ${client.stats.appels}
  Rapport               : ${path.relative(ROOT, path.join(outDir, 'export_report.json'))}`);
    return;
  }

  console.error(`Commande inconnue : ${command}. Commandes : plan, test-connexion, pilote, export.`);
  process.exit(1);
}

main().catch((e) => {
  // Les erreurs ne contiennent jamais la clé (elle n'est pas dans les URL ni dans les messages).
  console.error(`✗ ${e?.message ?? e}\n  L'export peut être relancé : il reprendra là où il s'est arrêté.`);
  process.exit(1);
});
