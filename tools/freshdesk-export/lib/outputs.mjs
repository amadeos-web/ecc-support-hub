/** Écriture des fichiers finaux : JSON brut, CSV tickets / messages, rapport. Aucun appel réseau. */
import fs from 'node:fs/promises';
import path from 'node:path';

const STATUS = { 2: 'Ouvert', 3: 'En attente', 4: 'Résolu', 5: 'Fermé' };
const PRIORITY = { 1: 'Basse', 2: 'Moyenne', 3: 'Haute', 4: 'Urgente' };
const TICKET_SOURCE = { 1: 'Email', 2: 'Portail', 3: 'Téléphone', 7: 'Chat', 9: 'Widget feedback', 10: 'Email sortant' };
const CONV_SOURCE = { 0: 'Réponse', 2: 'Note', 5: 'Tweet', 6: 'Enquête satisfaction', 7: 'Facebook', 8: 'Email transféré', 9: 'Téléphone', 11: 'E-commerce' };

export const NON_RECUPERABLE = [
  "Pièces jointes : seules les métadonnées (nom, type, taille, URL) sont exportées, pas les fichiers. Les URL Freshdesk sont signées et expirent.",
  "Contenu des Tweets / messages Twitter : remplacé par Freshdesk par « View the message on Twitter » (politique Twitter).",
  "Notifications automatiques envoyées par les règles d'automatisation : Freshdesk ne les enregistre pas comme conversations.",
  "Historique des changements de statut / d'assignation (journal d'activité) : non exposé par l'API v2 publique.",
  "Tickets supprimés définitivement (vidés de la corbeille) : introuvables.",
  "Distinction agent / automatisation : une réponse envoyée par une règle apparaît sous le nom de l'agent ou du compte qui l'a configurée.",
];

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function writeCsv(file, columns, rows) {
  const lines = [columns.join(',')];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c])).join(','));
  await fs.writeFile(file, '﻿' + lines.join('\r\n') + '\r\n'); // BOM : accents corrects dans Excel
}

function buildLookups(refs, contacts) {
  const groups = new Map((refs.groups ?? []).map((g) => [g.id, g.name]));
  const agents = new Map((refs.agents ?? []).map((a) => [a.id, { name: a.contact?.name ?? null, email: a.contact?.email ?? null }]));
  const statusField = (refs.ticket_fields ?? []).find((f) => f.name === 'status');
  const statusLabels = { ...STATUS };
  if (statusField?.choices && !Array.isArray(statusField.choices)) {
    for (const [k, v] of Object.entries(statusField.choices)) if (Array.isArray(v) && /^\d+$/.test(k)) statusLabels[k] = v[0];
  }
  const customLabels = new Map((refs.ticket_fields ?? []).filter((f) => !f.default).map((f) => [f.name, f.label]));
  const user = (id, ticket) => {
    if (id == null) return { name: null, email: null, kind: null };
    if (agents.has(id)) return { ...agents.get(id), kind: 'agent' };
    if (ticket?.requester && ticket.requester.id === id) return { name: ticket.requester.name, email: ticket.requester.email, kind: 'demandeur' };
    const c = contacts[id];
    if (c && !c.introuvable) return { name: c.name, email: c.email, kind: id === ticket?.requester_id ? 'demandeur' : 'contact' };
    return { name: null, email: null, kind: id === ticket?.requester_id ? 'demandeur' : null };
  };
  return { groups, agents, statusLabels, customLabels, user };
}

/** membre · agent_ecc · agent_ecc_probable · note_interne · systeme */
function roleOf(conv, ticket, agents) {
  if (conv.private) return 'note_interne';
  if (conv.user_id == null) return 'systeme';
  if (conv.incoming) return 'membre';
  if (agents.has(conv.user_id)) return 'agent_ecc';
  if (conv.user_id === ticket.requester_id) return 'membre';
  return 'agent_ecc_probable';
}

const attachmentsMeta = (atts) =>
  (atts ?? []).map((a) => ({ id: a.id, nom: a.name, type: a.content_type, taille: a.size, url: a.attachment_url, cree_le: a.created_at }));

export async function writeOutputs({ outDir, exported, refs, contacts, list, probe, counters, runErrors, warnings, mode, options, pendingIds, period, now }) {
  const L = buildLookups(refs, contacts);
  exported.sort((a, b) => a.ticket.id - b.ticket.id);

  const ticketRows = [];
  const messageRows = [];
  const rawTickets = [];
  let nbConversations = 0;
  let nbAttachments = 0;
  const sansConversation = [];

  for (const { etat, ticket: t, conversations, erreurs } of exported) {
    const convs = [...conversations].sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id - b.id));
    nbConversations += convs.length;
    if (convs.length === 0) sansConversation.push(t.id);
    const requester = L.user(t.requester_id, t);
    const agent = L.user(t.responder_id, t);
    const custom = {};
    for (const [k, v] of Object.entries(t.custom_fields ?? {})) if (v !== null && v !== '') custom[L.customLabels.get(k) ?? k] = v;
    const ticketAtts = attachmentsMeta(t.attachments);
    nbAttachments += ticketAtts.length;

    ticketRows.push({
      ticket_id: t.id,
      etat,
      sujet: t.subject,
      statut_code: t.status,
      statut: L.statusLabels[t.status] ?? t.status,
      priorite: PRIORITY[t.priority] ?? t.priority,
      source: TICKET_SOURCE[t.source] ?? t.source,
      type: t.type,
      tags: (t.tags ?? []).join(' | '),
      groupe: L.groups.get(t.group_id) ?? t.group_id,
      agent_assigne: agent.name ?? agent.email ?? t.responder_id,
      demandeur_id: t.requester_id,
      demandeur_nom: requester.name,
      demandeur_email: requester.email,
      cree_le: t.created_at,
      mis_a_jour_le: t.updated_at,
      premiere_reponse_le: t.stats?.first_responded_at,
      resolu_le: t.stats?.resolved_at,
      ferme_le: t.stats?.closed_at,
      nb_messages: convs.length + 1,
      nb_pieces_jointes_description: ticketAtts.length,
      champs_personnalises: Object.keys(custom).length ? custom : '',
      description_texte: t.description_text,
    });

    // Message n°0 : la demande initiale (description du ticket).
    messageRows.push({
      ticket_id: t.id,
      ordre: 0,
      message_id: `description-${t.id}`,
      nature: 'description',
      cree_le: t.created_at,
      mis_a_jour_le: t.updated_at,
      auteur_id: t.requester_id,
      auteur_nom: requester.name,
      auteur_email: requester.email,
      role: t.source === 10 ? 'agent_ecc' : 'membre',
      entrant: t.source !== 10,
      prive: false,
      source: TICKET_SOURCE[t.source] ?? t.source,
      de: requester.email,
      a: (t.to_emails ?? []).join(' | '),
      cc: (t.cc_emails ?? []).join(' | '),
      bcc: '',
      nb_pieces_jointes: ticketAtts.length,
      pieces_jointes: ticketAtts.length ? ticketAtts : '',
      texte: t.description_text,
    });

    convs.forEach((c, i) => {
      const u = L.user(c.user_id, t);
      const atts = attachmentsMeta(c.attachments);
      nbAttachments += atts.length;
      messageRows.push({
        ticket_id: t.id,
        ordre: i + 1,
        message_id: c.id,
        nature: 'conversation',
        cree_le: c.created_at,
        mis_a_jour_le: c.updated_at,
        auteur_id: c.user_id,
        auteur_nom: u.name,
        auteur_email: u.email ?? c.from_email,
        role: roleOf(c, t, L.agents),
        entrant: c.incoming,
        prive: c.private,
        source: CONV_SOURCE[c.source] ?? c.source,
        de: c.from_email,
        a: (c.to_emails ?? []).join(' | '),
        cc: (c.cc_emails ?? []).join(' | '),
        bcc: (c.bcc_emails ?? []).join(' | '),
        nb_pieces_jointes: atts.length,
        pieces_jointes: atts.length ? atts : '',
        texte: c.body_text,
      });
    });

    rawTickets.push({ etat, ...t, conversations: convs, erreurs_export: erreurs });
  }

  const date = now().toISOString();
  await fs.mkdir(outDir, { recursive: true });

  await fs.writeFile(
    path.join(outDir, 'freshdesk_raw.json'),
    JSON.stringify(
      {
        meta: { source: 'Freshdesk API v2 (lecture seule)', domaine: 'ecommercecapitalclub.freshdesk.com', exporte_le: date, mode },
        referentiels: {
          ticket_fields: refs.ticket_fields,
          groupes: refs.groups,
          agents: (refs.agents ?? []).map((a) => ({ id: a.id, nom: a.contact?.name ?? null, email: a.contact?.email ?? null, actif: a.contact?.active ?? null })),
        },
        tickets: rawTickets,
      },
      null,
      2,
    ),
  );

  await writeCsv(path.join(outDir, 'tickets.csv'), Object.keys(ticketRows[0] ?? { ticket_id: 0 }), ticketRows);
  await writeCsv(
    path.join(outDir, 'messages.csv'),
    ['ticket_id', 'ordre', 'message_id', 'nature', 'cree_le', 'mis_a_jour_le', 'auteur_id', 'auteur_nom', 'auteur_email', 'role', 'entrant', 'prive', 'source', 'de', 'a', 'cc', 'bcc', 'nb_pieces_jointes', 'pieces_jointes', 'texte'],
    messageRows,
  );

  const created = exported.map((t) => t.ticket.created_at).filter(Boolean).sort();
  const updated = exported.map((t) => t.ticket.updated_at).filter(Boolean).sort();
  const parEtat = {};
  for (const t of exported) parEtat[t.etat] = (parEtat[t.etat] ?? 0) + 1;
  const probeCounts = {};
  for (const r of Object.values(probe.resultats ?? {})) probeCounts[r] = (probeCounts[r] ?? 0) + 1;
  const cumul = counters.executions.reduce((acc, e) => ({ appels: acc.appels + e.appels, credits: acc.credits + e.credits }), { appels: 0, credits: 0 });

  const report = {
    date_export: date,
    mode,
    domaine: 'ecommercecapitalclub.freshdesk.com',
    periode_demandee: period,
    options: { ...options },
    totaux: {
      tickets_listes: Object.keys(list.tickets).length + Object.keys(probe.trouves ?? {}).length,
      tickets_exportes: exported.length,
      tickets_par_etat: parEtat,
      tickets_incomplets_a_reprendre: pendingIds.length,
      conversations: nbConversations,
      messages_total_avec_descriptions: messageRows.length,
      pieces_jointes_referencees: nbAttachments,
    },
    periode_couverte: {
      premier_ticket_cree_le: created[0] ?? null,
      dernier_ticket_cree_le: created.at(-1) ?? null,
      derniere_activite_le: updated.at(-1) ?? null,
    },
    tickets_sans_conversation: { nombre: sansConversation.length, ids: sansConversation },
    tickets_incomplets_ids: pendingIds,
    pages_parcourues: { ...counters.pages, fenetres_liste: list.fenetres ?? null },
    appels_api: { cette_execution: counters.executions.at(-1) ?? null, cumul_toutes_executions: cumul, executions: counters.executions.length },
    sondage_tickets_archives: {
      id_max: probe.max_id ?? null,
      resultats: probeCounts,
      termine: !!probe.complete,
      remarque: probe.arrete ?? null,
    },
    referentiels_indisponibles: refs.erreurs ?? [],
    avertissements: warnings,
    erreurs: runErrors,
    non_recuperable: NON_RECUPERABLE,
    note_html: 'Le HTML complet (description et body) figure uniquement dans freshdesk_raw.json ; les CSV contiennent la version texte.',
  };
  await fs.writeFile(path.join(outDir, 'export_report.json'), JSON.stringify(report, null, 2));
  return report;
}
