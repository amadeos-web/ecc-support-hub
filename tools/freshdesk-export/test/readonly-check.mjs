/**
 * Vérifications SANS RÉSEAU (faux Freshdesk en mémoire) :
 *   node --test tools/freshdesk-export/test/readonly-check.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadOnlyClient, FRESHDESK_HOST } from '../lib/client.mjs';
import { runExport } from '../lib/exporter.mjs';

const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAKE_KEY = 'FAKE-KEY-abc123-ne-doit-apparaitre-nulle-part';
const noSleep = async () => {};

/* ---------- Faux Freshdesk ---------- */
function makeFakeFreshdesk() {
  const ts = (n) => new Date(Date.UTC(2024, 0, 1, 0, 0, n)).toISOString().replace('.000', '');
  const ticket = (id, extra = {}) => ({
    id, subject: `Sujet ${id}`, status: 5, priority: 1, source: 1, type: null, tags: ['demo'],
    group_id: 50, responder_id: 900, requester_id: 100 + id, created_at: ts(id), updated_at: ts(100 + id),
    custom_fields: { cf_formation: 'Formation A' }, description_text: `Demande ${id}`, description: `<p>Demande ${id}</p>`,
    spam: false, deleted: false, ...extra,
  });
  const normal = [1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 16].map((id) => ticket(id));
  const spam = [ticket(13, { spam: true })];
  const deleted = [ticket(14, { deleted: true })];
  const archived = { 3: ticket(3, { archived: true }), 9: ticket(9, { archived: true }) };
  const conv = (tid, n, extra = {}) => ({
    id: tid * 1000 + n, ticket_id: tid, body_text: `Message ${n}`, body: `<p>Message ${n}</p>`, incoming: n % 2 === 1,
    private: false, user_id: n % 2 === 1 ? 100 + tid : 900, source: 0, from_email: null, to_emails: [], cc_emails: [], bcc_emails: [],
    attachments: n === 1 ? [{ id: 1, name: 'capture.png', content_type: 'image/png', size: 1234, attachment_url: 'https://cdn.example/x' }] : [],
    created_at: ts(200 + n), updated_at: ts(200 + n), ...extra,
  });
  const conversations = { 1: [1, 2, 3, 4, 5, 6, 7].map((n) => conv(1, n)), 2: [] };
  conversations[1].push(conv(1, 8, { private: true, user_id: 900 }), conv(1, 9, { incoming: false, user_id: 777 }));
  for (const t of [...normal, ...spam, ...deleted, ...Object.values(archived)]) conversations[t.id] ??= [conv(t.id, 1)];

  const requests = [];
  let fail500Once = true;
  let fail429Once = true;

  const page = (items, url) => {
    const per = Number(url.searchParams.get('per_page') ?? 30);
    const p = Number(url.searchParams.get('page') ?? 1);
    const slice = items.slice((p - 1) * per, p * per);
    const more = p * per < items.length;
    return { body: slice, headers: more ? { link: `<${url.origin}${url.pathname}?page=${p + 1}>; rel="next"` } : {} };
  };

  async function fetchImpl(urlStr, init) {
    const url = new URL(urlStr);
    requests.push({ method: init?.method, host: url.host, path: url.pathname, query: url.search, hasBody: init?.body !== undefined, auth: init?.headers?.Authorization, redirect: init?.redirect });
    const respond = (status, body, headers = {}) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-ratelimit-total': '100', 'x-ratelimit-remaining': '90', 'x-ratelimit-used-currentrequest': '1', ...headers } });
    if (init?.headers?.Authorization !== 'Basic ' + Buffer.from(`${FAKE_KEY}:X`).toString('base64')) return respond(401, {});
    const p = url.pathname;
    let m;
    if (p === '/api/v2/ticket_fields') return respond(200, [{ name: 'status', default: true, choices: { 5: ['Fermé', 'Fermé'] } }, { name: 'cf_formation', label: 'Formation', default: false }]);
    if (p === '/api/v2/groups') return respond(200, [{ id: 50, name: 'SAV' }]);
    if (p === '/api/v2/agents') return respond(200, [{ id: 900, contact: { name: 'Agent ECC', email: 'agent@ecc.test' } }]);
    if (p === '/api/v2/tickets') {
      const filter = url.searchParams.get('filter');
      if (filter === 'spam') return (({ body, headers }) => respond(200, body, headers))(page(spam, url));
      if (filter === 'deleted') return (({ body, headers }) => respond(200, body, headers))(page(deleted, url));
      const since = url.searchParams.get('updated_since') ?? '';
      const items = normal.filter((t) => t.updated_at >= since).sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      const { body, headers } = page(items, url);
      return respond(200, body.map((t) => ({ ...t, requester: { id: t.requester_id, name: `Membre ${t.id}`, email: `m${t.id}@ex.test` } })), headers);
    }
    if ((m = p.match(/^\/api\/v2\/tickets\/archived\/(\d+)$/))) return archived[m[1]] ? respond(200, archived[m[1]]) : respond(404, {});
    if ((m = p.match(/^\/api\/v2\/tickets\/archived\/(\d+)\/conversations$/))) {
      const { body, headers } = page(conversations[m[1]] ?? [], url);
      return respond(200, body, headers);
    }
    if ((m = p.match(/^\/api\/v2\/tickets\/(\d+)$/))) {
      const id = Number(m[1]);
      const t = [...normal, ...spam, ...deleted].find((x) => x.id === id);
      return t ? respond(200, { ...t, attachments: [] }) : respond(404, {});
    }
    if ((m = p.match(/^\/api\/v2\/tickets\/(\d+)\/conversations$/))) {
      if (m[1] === '5' && fail500Once) return (fail500Once = false), respond(500, {});
      if (m[1] === '6' && fail429Once) return (fail429Once = false), respond(429, {}, { 'retry-after': '0' });
      const { body, headers } = page(conversations[m[1]] ?? [], url);
      return respond(200, body, headers);
    }
    if ((m = p.match(/^\/api\/v2\/contacts\/(\d+)$/))) return m[1] === '777' ? respond(200, { id: 777, name: 'Contact CC', email: 'cc@ex.test' }) : respond(404, {});
    return respond(404, {});
  }
  return { fetchImpl, requests, expected: { tickets: normal.length + spam.length + deleted.length + 2, conversations } };
}

async function listFiles(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p)));
    else out.push(p);
  }
  return out;
}

/* ---------- Tests ---------- */

test('le client refuse tout endpoint hors liste lecture seule', async () => {
  const fake = makeFakeFreshdesk();
  const client = createReadOnlyClient({ apiKey: FAKE_KEY, fetchImpl: fake.fetchImpl, sleep: noSleep });
  for (const p of ['/api/v2/tickets/1/reply', '/api/v2/tickets/1/notes', '/api/v2/tickets/bulk_delete', '/api/v2/tickets/outbound_email', '/api/v2/contacts', '/api/v2/tickets/1/../1']) {
    await assert.rejects(client.get(p), /Chemin refusé/);
  }
  assert.equal(fake.requests.length, 0, 'aucune requête ne doit partir');
  assert.deepEqual(Object.keys(client).sort(), ['get', 'stats'], 'le client n’expose que get()');
  assert.ok(Object.isFrozen(client));
});

test('export complet : uniquement des GET vers le domaine ECC, fil complet, reprise sans nouvel appel', async () => {
  const fake = makeFakeFreshdesk();
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fd-export-'));
  const logs = [];
  const client = createReadOnlyClient({ apiKey: FAKE_KEY, fetchImpl: fake.fetchImpl, sleep: noSleep, log: (l) => logs.push(l) });
  // Pages de 3 et 2 pages max par fenêtre pour exercer la pagination et le dépassement de la limite de 300 pages.
  const report = await runExport({ client, outDir, options: { _perPage: 3, _maxPages: 2 }, log: (l) => logs.push(l) });

  // 1. Lecture seule stricte
  assert.ok(fake.requests.length > 0);
  for (const r of fake.requests) {
    assert.equal(r.method, 'GET');
    assert.equal(r.host, FRESHDESK_HOST);
    assert.equal(r.hasBody, false);
    assert.equal(r.redirect, 'error');
  }

  // 2. Complétude
  assert.equal(report.totaux.tickets_exportes, fake.expected.tickets, 'normaux + spam + supprimés + archivés');
  assert.deepEqual(report.totaux.tickets_par_etat, { normal: 11, spam: 1, supprime: 1, archive: 2 });
  assert.equal(report.totaux.tickets_incomplets_a_reprendre, 0);
  assert.equal(report.sondage_tickets_archives.resultats.archive, 2);
  assert.equal(report.sondage_tickets_archives.resultats.absent, 1, 'ID 15 inexistant');
  const raw = JSON.parse(await fs.readFile(path.join(outDir, 'freshdesk_raw.json'), 'utf8'));
  const t1 = raw.tickets.find((t) => t.id === 1);
  assert.equal(t1.conversations.length, 9, 'toutes les pages de conversations du ticket 1');
  assert.equal(raw.tickets.find((t) => t.id === 3).conversations.length, 1, 'conversations du ticket archivé');
  assert.deepEqual(report.tickets_sans_conversation.ids, [2]);

  // 3. CSV
  const messages = await fs.readFile(path.join(outDir, 'messages.csv'), 'utf8');
  assert.equal(messages.trim().split('\r\n').length - 1, report.totaux.messages_total_avec_descriptions);
  assert.match(messages, /note_interne/);
  assert.match(messages, /Contact CC/, 'auteur résolu via contacts');
  assert.match(messages, /agent_ecc/);
  const tickets = await fs.readFile(path.join(outDir, 'tickets.csv'), 'utf8');
  assert.match(tickets, /Formation A/);
  assert.match(tickets, /m1@ex\.test/);

  // 4. Reprise : relancer ne refait aucun appel
  const before = fake.requests.length;
  const client2 = createReadOnlyClient({ apiKey: FAKE_KEY, fetchImpl: fake.fetchImpl, sleep: noSleep });
  await runExport({ client: client2, outDir, options: { _perPage: 3, _maxPages: 2 }, log: () => {} });
  assert.equal(fake.requests.length, before, 'aucun appel supplémentaire après un export complet');

  // 5. La clé n'apparaît nulle part (fichiers, état, logs)
  const encoded = Buffer.from(`${FAKE_KEY}:X`).toString('base64');
  for (const f of await listFiles(outDir)) {
    const c = await fs.readFile(f, 'utf8');
    assert.ok(!c.includes(FAKE_KEY) && !c.includes(encoded), `clé trouvée dans ${f}`);
  }
  assert.ok(!logs.join('\n').includes(FAKE_KEY));
  await fs.rm(outDir, { recursive: true });
});

test('aucun code d’écriture HTTP dans les sources de l’outil', async () => {
  const sources = (await listFiles(TOOL_DIR)).filter((f) => f.endsWith('.mjs') && !f.includes(`${path.sep}test${path.sep}`));
  for (const f of sources) {
    const code = await fs.readFile(f, 'utf8');
    assert.doesNotMatch(code, /['"`](POST|PUT|PATCH|DELETE)['"`]/, `${f} contient une méthode d’écriture`);
    assert.doesNotMatch(code, /method:\s*['"`](?!GET['"`])/, `${f} utilise une méthode autre que GET`);
    if (!f.endsWith(`lib${path.sep}client.mjs`)) {
      assert.doesNotMatch(code, /\bfetch\s*\(|fetchImpl\s*\(|https?\.request|node:https?/, `${f} fait du réseau hors du client`);
    }
  }
});

test('période : seuls les tickets créés depuis la date sont exportés (archives comprises)', async () => {
  const fake = makeFakeFreshdesk();
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fd-period-'));
  const client = createReadOnlyClient({ apiKey: FAKE_KEY, fetchImpl: fake.fetchImpl, sleep: noSleep });
  // Tickets créés à ts(id) : depuis ts(5) → 5..16 (hors 15 inexistant) ; 3 (archivé, antérieur) exclu, 9 (archivé) inclus.
  const since = new Date(Date.UTC(2024, 0, 1, 0, 0, 5)).toISOString();
  const report = await runExport({ client, outDir, options: { _perPage: 3, _maxPages: 2, createdSince: since }, log: () => {} });
  const raw = JSON.parse(await fs.readFile(path.join(outDir, 'freshdesk_raw.json'), 'utf8'));
  const ids = raw.tickets.map((t) => t.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16]);
  assert.ok(raw.tickets.every((t) => t.created_at >= since.replace('.000', '')));
  assert.equal(report.periode_demandee.depuis, since);
  for (const r of fake.requests) assert.equal(r.method, 'GET');
  await fs.rm(outDir, { recursive: true });
});
