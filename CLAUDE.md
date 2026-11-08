# ECC Support Hub

Outil interne SAV, 100 % local. React 19 + TypeScript + Vite, CSS simple (`src/styles.css`), pas de routeur externe (hash routing dans `src/lib/router.ts`).

- Données métier uniquement dans `src/data/*` (types dans `src/data/types.ts`), importées via `src/data/index.ts`. Ne jamais écrire de texte métier dans les composants.
- Les données fictives ont `source: 'demo'` → badge « Démo ». En remplaçant par de vraies données, changer `source`.
- Ne pas connecter de service externe, d'API ou d'IA sans demande explicite. L'export PDF est un stub (`src/documents/pdf.ts`).
- **Langues** : interface agent en **anglais** (menus, étapes, vérifications, boutons, erreurs, libellés de formulaires) — l'agent SAV est anglophone. Restent en **français** : les messages aux membres (`templates.ts`, tutoiement, texte source inchangé), le message interne à la comptabilité (`internalMessages.ts` → `message`), tout ce qui est imprimé sur les PDF (facture, devis, attestation, noms de fichiers) et les formulations / mots-clés des membres (`observedRequests`, `keywords`). Chaque message au membre a une traduction anglaise (`src/data/templatesEnglish.ts`) affichée à côté, pour information de l'agent : jamais copiée, même découpage en paragraphes que le français (testé). Tout nouveau message doit avoir sa traduction. Vocabulaire non technique.
- Les identifiants internes (ids de cas, de routes `#/accueil`, `#/traiter`, de catégories) restent en français : ne pas les renommer (liens existants).
- Vérifier avec `npm run typecheck && npm test`. Serveur : `npm run dev` (port 5180 — le 5173 est utilisé par un autre projet).
- `tools/freshdesk-export/` : export Freshdesk séparé, STRICTEMENT lecture seule (GET uniquement). Ne jamais l'importer dans l'app ni ajouter de méthode d'écriture. Les exports (`exports/`) contiennent des données personnelles : non versionnés, non servis par Vite.
