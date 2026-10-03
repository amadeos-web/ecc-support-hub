# Export Freshdesk — lecture seule

Outil **séparé** de l'ECC Support Hub : il ne sert qu'à récupérer l'historique Freshdesk pour
analyse. Rien dans l'application n'importe ce dossier, et le serveur de l'app refuse de servir
`tools/` et `exports/`.

## Garanties
- `lib/client.mjs` est la **seule** partie qui fait du réseau. Méthode `GET` codée en dur, aucun
  corps envoyé, hôte fixé à `ecommercecapitalclub.freshdesk.com`, redirections refusées.
- Seuls 9 endpoints de lecture sont autorisés (`node tools/freshdesk-export/freshdesk-export.mjs plan`).
- La clé API est lue dans le **Trousseau macOS** (ou `FRESHDESK_API_KEY`) au moment de l'exécution.
  Elle n'est jamais écrite dans un fichier, un log ou un export.
- Vérification hors-ligne : `node --test tools/freshdesk-export/test/readonly-check.mjs`

⚠️ Une clé Freshdesk a les **mêmes droits que l'agent** qui la possède (Freshdesk ne propose
pas de clé en lecture seule). La protection est donc dans ce script, pas dans la clé.

## Clé API
Enregistrement (une fois, dans le Terminal — la clé est demandée de façon masquée) :
```
security add-generic-password -a "$USER" -s ecc-freshdesk-api-key -w
```
Suppression après l'export : `security delete-generic-password -s ecc-freshdesk-api-key`

## Commandes
| Commande | Effet |
|---|---|
| `node tools/freshdesk-export/freshdesk-export.mjs plan` | Récapitulatif, **aucun appel réseau** |
| `… test-connexion` | 1 seul `GET` : vérifie la clé et lit la limite d'appels |
| `… pilote --limite 5` | Export de 5 tickets → `exports/freshdesk/` (réutilisés par l’export complet) |
| `… export` | Export complet → `exports/freshdesk/` (reprise automatique si interrompu) |

Options : `--sans-detail` (pas de GET par ticket : économise des appels mais perd les pièces
jointes de la 1re demande), `--sans-archives`, `--sans-spam-supprimes`, `--sans-contacts`,
`--budget 0.5` (part de la limite Freshdesk par minute utilisée, 50 % par défaut pour laisser
de la marge à l'équipe).

## Fichiers produits
- `freshdesk_raw.json` — source de vérité : tickets + conversations imbriquées, HTML compris.
- `tickets.csv` — 1 ligne par ticket.
- `messages.csv` — 1 ligne par message (ordre 0 = demande initiale), `ticket_id` pour reconstruire les fils.
- `export_report.json` — totaux, période, erreurs, pages, appels, éléments non récupérables.
- `.state/` — points de reprise (peut être supprimé une fois l'export validé).
