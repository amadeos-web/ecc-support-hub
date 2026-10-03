/**
 * Client Freshdesk STRICTEMENT LECTURE SEULE.
 *
 * Garanties :
 *  - la méthode HTTP est codée en dur à "GET" — aucun paramètre ne permet d'en changer ;
 *  - aucun corps de requête n'est jamais envoyé ;
 *  - seuls les chemins de la liste ALLOWED_PATHS (tous des endpoints de lecture) sont acceptés ;
 *  - l'hôte est fixé (ecommercecapitalclub.freshdesk.com) et les redirections sont refusées,
 *    pour que l'en-tête d'authentification ne parte jamais ailleurs ;
 *  - la clé API n'apparaît dans aucun message d'erreur, log ou fichier.
 */

export const FRESHDESK_HOST = 'ecommercecapitalclub.freshdesk.com';

/** Endpoints de LECTURE documentés (Freshdesk API v2). Tout autre chemin est refusé. */
export const ALLOWED_PATHS = [
  /^\/api\/v2\/tickets$/, // List All Tickets
  /^\/api\/v2\/tickets\/\d+$/, // View a Ticket
  /^\/api\/v2\/tickets\/\d+\/conversations$/, // List All Conversations of a Ticket
  /^\/api\/v2\/tickets\/archived\/\d+$/, // View an Archive Ticket
  /^\/api\/v2\/tickets\/archived\/\d+\/conversations$/, // List All Conversations of an Archive Ticket
  /^\/api\/v2\/ticket_fields$/, // List All Ticket Fields
  /^\/api\/v2\/groups$/, // List All Groups
  /^\/api\/v2\/agents$/, // List All Agents
  /^\/api\/v2\/contacts\/\d+$/, // View a Contact
];

export class FreshdeskError extends Error {
  constructor(status, path, detail) {
    super(`Freshdesk ${status} sur ${path}${detail ? ` — ${detail}` : ''}`);
    this.status = status;
    this.path = path;
  }
}

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} o
 * @param {string} o.apiKey
 * @param {typeof fetch} [o.fetchImpl]  injectable pour les tests (faux Freshdesk)
 * @param {number} [o.budgetRatio]      part de la limite/minute que le script s'autorise (défaut 50 %)
 */
export function createReadOnlyClient({ apiKey, fetchImpl = globalThis.fetch, host = FRESHDESK_HOST, log = () => {}, sleep = defaultSleep, maxRetries = 6, budgetRatio = 0.5 }) {
  if (!apiKey || typeof apiKey !== 'string') throw new Error('Clé API Freshdesk absente.');
  // Basic auth Freshdesk : "clé:X". Variable locale, jamais exposée.
  const authHeader = 'Basic ' + Buffer.from(`${apiKey.trim()}:X`).toString('base64');

  const stats = { appels: 0, credits: 0, relances: 0, attentes_rate_limit: 0, par_endpoint: {}, limite_par_minute: null };
  let remaining = null;
  let lastCallAt = 0;

  const endpointName = (path) => path.replace(/\/\d+(?=\/|$)/g, '/:id');

  async function pace() {
    // Avant de connaître la limite : prudence, ~40 appels/minute.
    const perMinute = stats.limite_par_minute ? Math.max(1, stats.limite_par_minute * budgetRatio) : 40;
    const minInterval = 60000 / perMinute;
    const wait = lastCallAt + minInterval - Date.now();
    if (wait > 0) await sleep(wait);
    // La limite est partagée avec toute l'équipe : si presque épuisée, on attend la fenêtre suivante.
    if (remaining !== null && stats.limite_par_minute && remaining <= Math.max(5, stats.limite_par_minute * 0.1)) {
      stats.attentes_rate_limit++;
      log(`  ⏸  Quota Freshdesk presque atteint (${remaining} restants) — pause 60 s`);
      await sleep(60000);
      remaining = null;
    }
    lastCallAt = Date.now();
  }

  /** Seule fonction réseau du script. GET uniquement. */
  async function get(path, query = {}) {
    if (!ALLOWED_PATHS.some((re) => re.test(path))) throw new Error(`Chemin refusé (hors liste lecture seule) : ${path}`);
    const url = new URL(`https://${host}${path}`);
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));

    let attempt = 0;
    for (;;) {
      await pace();
      let res;
      try {
        res = await fetchImpl(url.toString(), {
          method: 'GET',
          headers: { Authorization: authHeader, Accept: 'application/json' },
          redirect: 'error',
        });
      } catch (e) {
        if (++attempt > maxRetries) throw new FreshdeskError('RESEAU', path, String(e?.message ?? e));
        stats.relances++;
        await sleep(Math.min(60000, 2000 * 2 ** attempt));
        continue;
      }

      stats.appels++;
      const ep = endpointName(path);
      stats.par_endpoint[ep] = (stats.par_endpoint[ep] ?? 0) + 1;
      const total = Number(res.headers.get('x-ratelimit-total'));
      const rem = Number(res.headers.get('x-ratelimit-remaining'));
      const used = Number(res.headers.get('x-ratelimit-used-currentrequest'));
      if (Number.isFinite(total) && total > 0) stats.limite_par_minute = total;
      if (Number.isFinite(rem) && res.headers.has('x-ratelimit-remaining')) remaining = rem;
      stats.credits += Number.isFinite(used) && used > 0 ? used : 1;

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after')) || 60;
        stats.attentes_rate_limit++;
        log(`  ⏸  Limite Freshdesk atteinte — reprise dans ${retryAfter} s`);
        await sleep(retryAfter * 1000);
        if (++attempt > maxRetries * 3) throw new FreshdeskError(429, path, 'limite atteinte trop de fois');
        continue;
      }
      if (res.status >= 500) {
        if (++attempt > maxRetries) throw new FreshdeskError(res.status, path, 'erreur serveur Freshdesk');
        stats.relances++;
        await sleep(Math.min(60000, 2000 * 2 ** attempt));
        continue;
      }
      if (!res.ok) {
        let detail = '';
        try {
          detail = (await res.text()).slice(0, 300);
        } catch {
          /* ignore */
        }
        throw new FreshdeskError(res.status, path, detail);
      }
      const data = await res.json();
      return { data, hasNextLink: /rel="?next"?/.test(res.headers.get('link') ?? '') };
    }
  }

  return Object.freeze({ get, stats });
}
