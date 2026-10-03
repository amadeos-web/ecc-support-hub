/**
 * Export complet de l'historique Freshdesk (lecture seule), avec reprise.
 *
 * Étapes :
 *  0. Référentiels : champs de ticket, groupes, agents (pour traduire les ID en noms).
 *  1. Liste de tous les tickets (updated_since + tri updated_at asc, fenêtres de 300 pages
 *     pour dépasser la limite Freshdesk de 30 000 tickets par requête), + spam et supprimés.
 *  2. Tickets archivés : Freshdesk ne les liste pas. On interroge un par un les ID manquants
 *     (GET /tickets/archived/[id], puis GET /tickets/[id]).
 *  3. Pour chaque ticket : détail complet (pièces jointes de la description) + TOUTES les pages
 *     de conversations. Chaque ticket terminé est sauvegardé dans .state/tickets/[id].json :
 *     en cas d'interruption, la relance reprend là où elle s'est arrêtée.
 *  4. Contacts : nom / email des auteurs de messages non identifiés.
 *  5. Fichiers finaux : freshdesk_raw.json, tickets.csv, messages.csv, export_report.json.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeOutputs } from './outputs.mjs';

const LIST_INCLUDE = 'requester,stats,description';

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file); // écriture atomique : pas de fichier à moitié écrit en cas de coupure
}

const errInfo = (e) => ({ statut: e?.status ?? null, message: String(e?.message ?? e) });

async function listAllPages(client, apiPath, query, { perPage, maxPages, onPage }) {
  let pages = 0;
  for (let page = 1; page <= maxPages; page++) {
    const { data, hasNextLink } = await client.get(apiPath, { ...query, per_page: perPage, page });
    pages++;
    const items = Array.isArray(data) ? data : [];
    const stop = await onPage(items, page);
    if (stop || items.length < perPage || !hasNextLink) return { pages, reachedMax: false };
  }
  return { pages, reachedMax: true };
}

export async function runExport({ client, outDir, options = {}, log = console.log, now = () => new Date() }) {
  const perPage = options._perPage ?? 100; // max documenté : 100
  const maxPages = options._maxPages ?? 300; // limite documentée de List All Tickets
  const pilot = Number.isInteger(options.limit) && options.limit > 0;
  /** Période : seuls les tickets créés à partir de cette date sont exportés. */
  const cutoff = options.createdSince ? new Date(options.createdSince).toISOString() : null;
  const inPeriod = (t) => !cutoff || (t?.created_at && new Date(t.created_at).toISOString() >= cutoff);
  const stateDir = path.join(outDir, '.state');
  const files = {
    refs: path.join(stateDir, 'references.json'),
    list: path.join(stateDir, 'liste_tickets.json'),
    probe: path.join(stateDir, 'sondage_archives.json'),
    contacts: path.join(stateDir, 'contacts.json'),
    counters: path.join(stateDir, 'compteurs.json'),
    ticketsDir: path.join(stateDir, 'tickets'),
  };
  await fs.mkdir(files.ticketsDir, { recursive: true });

  const runErrors = [];
  const counters = await readJson(files.counters, { executions: [], pages: { liste_tickets: 0, spam_supprimes: 0, conversations: 0, referentiels: 0 } });
  const pages = counters.pages;
  const warnings = [];

  /* ---------- 0. Référentiels ---------- */
  let refs = await readJson(files.refs, null);
  if (!refs) {
    log('▶ Référentiels (champs, groupes, agents)…');
    refs = { ticket_fields: null, groups: null, agents: null, erreurs: [] };
    try {
      refs.ticket_fields = (await client.get('/api/v2/ticket_fields')).data;
      pages.referentiels++;
    } catch (e) {
      refs.erreurs.push({ ressource: 'ticket_fields', ...errInfo(e) });
    }
    for (const [key, apiPath] of [['groups', '/api/v2/groups'], ['agents', '/api/v2/agents']]) {
      try {
        const acc = [];
        const r = await listAllPages(client, apiPath, {}, { perPage, maxPages: 50, onPage: (items) => void acc.push(...items) });
        pages.referentiels += r.pages;
        refs[key] = acc;
      } catch (e) {
        refs.erreurs.push({ ressource: key, ...errInfo(e) });
      }
    }
    await writeJson(files.refs, refs);
  }
  const agentIds = new Set((refs.agents ?? []).map((a) => a.id));

  /* ---------- 1. Liste des tickets ---------- */
  let list = await readJson(files.list, null);
  const needList = !list || (list.depuis ?? null) !== cutoff || (!pilot && !list.complete) || (pilot && !list.complete && Object.keys(list.tickets).length < options.limit);
  if (needList) {
    log(pilot ? `▶ Liste des tickets (pilote : ${options.limit} tickets)…` : '▶ Liste de tous les tickets…');
    list = { complete: false, tickets: {}, fenetres: 0, depuis: cutoff };
    // Un ticket créé dans la période a forcément été mis à jour depuis le début de la période.
    let since = cutoff ?? '2000-01-01T00:00:00Z';
    for (;;) {
      list.fenetres++;
      let lastUpdated = null;
      let newInWindow = 0;
      let stopAll = false;
      const r = await listAllPages(
        client,
        '/api/v2/tickets',
        { updated_since: since, order_by: 'updated_at', order_type: 'asc', include: LIST_INCLUDE },
        {
          perPage,
          maxPages,
          onPage: (items, page) => {
            for (const t of items) {
              if (!list.tickets[t.id]) newInWindow++;
              list.tickets[t.id] = { etat: 'normal', item: t };
              lastUpdated = t.updated_at;
            }
            log(`  fenêtre ${list.fenetres} · page ${page} · ${Object.keys(list.tickets).length} tickets`);
            if (pilot && Object.keys(list.tickets).length >= options.limit) stopAll = true;
            return stopAll;
          },
        },
      );
      pages.liste_tickets += r.pages;
      if (stopAll || !r.reachedMax) break;
      if (!lastUpdated || newInWindow === 0) {
        warnings.push('Fenêtre de 300 pages sans nouveau ticket : arrêt de la liste pour éviter une boucle.');
        break;
      }
      since = lastUpdated; // fenêtre suivante (les doublons sont dédupliqués par ID)
    }

    if (!pilot && !options.skipSpamDeleted) {
      for (const filter of ['spam', 'deleted']) {
        try {
          const r = await listAllPages(client, '/api/v2/tickets', { filter }, {
            perPage,
            maxPages,
            onPage: (items) => {
              for (const t of items) list.tickets[t.id] = { etat: filter === 'spam' ? 'spam' : 'supprime', item: t };
            },
          });
          pages.spam_supprimes += r.pages;
        } catch (e) {
          runErrors.push({ etape: `liste ${filter}`, ...errInfo(e) });
        }
      }
    }
    list.complete = !pilot;
    await writeJson(files.list, list);
    await writeJson(files.counters, counters);
  } else {
    log(`▶ Liste des tickets déjà récupérée (${Object.keys(list.tickets).length} tickets) — reprise.`);
  }

  /* ---------- 2. Tickets archivés (ID manquants) ---------- */
  const probe = await readJson(files.probe, { complete: false, resultats: {}, trouves: {}, max_id: null, arrete: null });
  if (!pilot && !options.skipArchives && !probe.complete) {
    const known = new Set(Object.keys(list.tickets).map(Number));
    const maxId = Math.max(0, ...known);
    probe.max_id = maxId;
    let forbiddenStreak = 0;

    /** Interroge un ID absent des listes : archive, sinon ticket direct (spam / supprimé). */
    const probeId = async (id) => {
      let result = 'absent';
      try {
        const { data } = await client.get(`/api/v2/tickets/archived/${id}`);
        probe.trouves[id] = { etat: 'archive', item: data };
        result = 'archive';
        forbiddenStreak = 0;
      } catch (e) {
        if (e.status === 403) forbiddenStreak++;
        if (e.status !== 404 && e.status !== 403) {
          runErrors.push({ etape: 'archive', ticket_id: id, ...errInfo(e) });
          result = 'erreur';
        }
      }
      if (result === 'absent') {
        try {
          const { data } = await client.get(`/api/v2/tickets/${id}`);
          probe.trouves[id] = { etat: data.deleted ? 'supprime' : data.spam ? 'spam' : 'normal', item: data };
          result = 'trouve_hors_liste';
        } catch (e) {
          if (e.status !== 404 && e.status !== 403) {
            runErrors.push({ etape: 'sondage', ticket_id: id, ...errInfo(e) });
            result = 'erreur';
          }
        }
      }
      if (result !== 'erreur') probe.resultats[id] = result; // les erreurs seront retentées
      return result;
    };
    const stopForbidden = () => {
      if (forbiddenStreak >= 25 && Object.keys(probe.trouves).length === 0) {
        probe.arrete = 'Accès aux tickets archivés refusé (403) — fonctionnalité absente du plan ou droits insuffisants.';
        warnings.push(probe.arrete);
        return true;
      }
      return false;
    };

    // Les numéros de ticket suivent l'ordre de création : avec une période, on ne sonde que
    // les trous à partir du premier ticket de la période, puis on redescend jusqu'au premier
    // ticket antérieur à la période.
    const inRangeIds = [...known].filter((id) => inPeriod(list.tickets[id].item));
    const startId = cutoff ? Math.min(maxId + 1, ...inRangeIds) : 1;
    const missing = [];
    for (let id = startId; id <= maxId; id++) if (!known.has(id) && !(id in probe.resultats)) missing.push(id);
    log(`▶ Recherche des tickets archivés : ${missing.length} ID à vérifier (${startId}…${maxId})…`);
    for (let i = 0; i < missing.length; i++) {
      await probeId(missing[i]);
      if (stopForbidden()) break;
      if (i % 50 === 49) {
        await writeJson(files.probe, probe);
        log(`  ${i + 1}/${missing.length} ID vérifiés · ${Object.keys(probe.trouves).length} trouvés`);
      }
    }
    let downOk = true;
    if (cutoff && !probe.arrete) {
      log(`▶ Vérification des tickets juste avant le n° ${startId} (début de période)…`);
      for (let id = startId - 1; id >= 1; id--) {
        const t = known.has(id) ? list.tickets[id].item : (id in probe.resultats ? probe.trouves[id]?.item : (await probeId(id), probe.trouves[id]?.item));
        if (probe.resultats[id] === undefined && !known.has(id)) downOk = false;
        if (t && !inPeriod(t)) break; // premier ticket antérieur à la période : on s'arrête
        if (stopForbidden()) break;
      }
    }
    probe.complete = downOk && !Object.values(probe.resultats).includes('erreur') && missing.every((id) => id in probe.resultats || probe.arrete);
    await writeJson(files.probe, probe);
  }

  /* ---------- 3. Détail + conversations de chaque ticket ---------- */
  const all = { ...list.tickets, ...probe.trouves };
  const ignoredBefore = Object.keys(all).filter((id) => !inPeriod(all[id].item)).length;
  let ids = Object.keys(all)
    .map(Number)
    .filter((id) => inPeriod(all[id].item))
    .sort((a, b) => a - b);
  if (cutoff) log(`▶ Période : tickets créés depuis le ${cutoff.slice(0, 10)} → ${ids.length} retenus, ${ignoredBefore} antérieurs ignorés.`);
  if (pilot) ids = ids.slice(-options.limit); // pilote : les plus récents de la liste
  log(`▶ Conversations : ${ids.length} tickets à traiter…`);
  let done = 0;
  for (const id of ids) {
    const file = path.join(files.ticketsDir, `${id}.json`);
    done++;
    if (await readJson(file, null)) continue; // déjà exporté lors d'une exécution précédente
    const entry = all[id];
    const archived = entry.etat === 'archive';
    const erreurs = [];
    let ticket = entry.item;
    let complete = true;

    if (!archived && !options.skipDetails && !probe.trouves[id]) {
      try {
        const { data } = await client.get(`/api/v2/tickets/${id}`);
        ticket = { ...entry.item, ...data }; // garde requester / stats issus de la liste
      } catch (e) {
        erreurs.push({ etape: 'detail', ...errInfo(e) });
        if (e.status !== 404) complete = false;
      }
    }

    const conversations = [];
    const convPath = archived ? `/api/v2/tickets/archived/${id}/conversations` : `/api/v2/tickets/${id}/conversations`;
    try {
      const r = await listAllPages(client, convPath, {}, { perPage, maxPages: 1000, onPage: (items) => void conversations.push(...items) });
      pages.conversations += r.pages;
    } catch (e) {
      erreurs.push({ etape: 'conversations', ...errInfo(e) });
      if (e.status !== 404) complete = false;
    }

    if (complete) {
      await writeJson(file, { etat: entry.etat, exporte_le: now().toISOString(), ticket, conversations, erreurs });
    } else {
      runErrors.push({ etape: 'ticket', ticket_id: id, erreurs });
    }
    log(`  [${done}/${ids.length}] ticket #${id} · ${conversations.length} conversation(s)${complete ? '' : ' · ⚠ à reprendre'}`);
    if (done % 25 === 0) await writeJson(files.counters, counters);
  }

  /* ---------- 4. Contacts (auteurs non identifiés) ---------- */
  const exported = [];
  for (const id of ids) {
    const t = await readJson(path.join(files.ticketsDir, `${id}.json`), null);
    if (t) exported.push(t);
  }
  const contacts = await readJson(files.contacts, {});
  if (!options.skipContacts) {
    const wanted = new Set();
    for (const t of exported) {
      if (t.ticket.requester_id && !t.ticket.requester) wanted.add(t.ticket.requester_id);
      for (const c of t.conversations) if (c.user_id && !agentIds.has(c.user_id) && c.user_id !== t.ticket.requester_id) wanted.add(c.user_id);
    }
    const todo = [...wanted].filter((uid) => !(uid in contacts));
    if (todo.length) log(`▶ Contacts : ${todo.length} auteur(s) à identifier…`);
    for (const uid of todo) {
      try {
        const { data } = await client.get(`/api/v2/contacts/${uid}`);
        contacts[uid] = { id: data.id, name: data.name, email: data.email ?? null };
      } catch (e) {
        if (e.status === 404) contacts[uid] = { id: uid, introuvable: true };
        else {
          runErrors.push({ etape: 'contact', user_id: uid, ...errInfo(e) });
          if (e.status === 403) break;
        }
      }
    }
    await writeJson(files.contacts, contacts);
  }

  /* ---------- 5. Fichiers finaux ---------- */
  const exportedIds = new Set(exported.map((t) => Number(t.ticket.id)));
  counters.executions.push({ date: now().toISOString(), mode: pilot ? 'pilote' : 'complet', ...client.stats });
  await writeJson(files.counters, counters);

  const summary = await writeOutputs({
    outDir,
    exported,
    refs,
    contacts,
    list,
    probe,
    counters,
    runErrors,
    warnings,
    mode: pilot ? 'pilote' : 'complet',
    options,
    pendingIds: ids.filter((id) => !exportedIds.has(id)),
    period: cutoff ? { depuis: cutoff, tickets_anterieurs_ignores: ignoredBefore } : null,
    now,
  });
  return summary;
}
