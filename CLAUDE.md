# ECC Support Hub

Outil interne SAV, 100 % local. React 19 + TypeScript + Vite, CSS simple (`src/styles.css`), pas de routeur externe (hash routing dans `src/lib/router.ts`).

- Données métier uniquement dans `src/data/*` (types dans `src/data/types.ts`), importées via `src/data/index.ts`. Ne jamais écrire de texte métier dans les composants.
- Les données fictives ont `source: 'demo'` → badge « Démo ». En remplaçant par de vraies données, changer `source`.
- Ne pas connecter de service externe, d'API ou d'IA sans demande explicite. L'export PDF est un stub (`src/documents/pdf.ts`).
- Interface en français, tutoiement dans les messages aux membres, vocabulaire non technique.
- Vérifier avec `npm run typecheck && npm test`. Serveur : `npm run dev` (port 5180 — le 5173 est utilisé par un autre projet).
- `tools/freshdesk-export/` : export Freshdesk séparé, STRICTEMENT lecture seule (GET uniquement). Ne jamais l'importer dans l'app ni ajouter de méthode d'écriture. Les exports (`exports/`) contiennent des données personnelles : non versionnés, non servis par Vite.
