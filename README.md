# ECC Support Hub — V1 locale

Cockpit SAV / handover pour ECC : traiter une demande, suivre les process, copier des
réponses personnalisées, générer des documents (aperçu) et connaître les règles d'escalade.

> ⚠️ **Toutes les données actuelles sont fictives (badge « Démo »).** Elles ne reflètent pas
> les vrais process ECC et seront remplacées par les templates Excel et les historiques
> Freshdesk / Whop.

## Démarrer

```bash
npm install     # première fois seulement
npm run dev     # → http://localhost:5180
```

Autres commandes : `npm run typecheck` · `npm test` · `npm run build`

## Où modifier quoi

| Je veux modifier…                              | Fichier                           |
|------------------------------------------------|-----------------------------------|
| Les cas SAV (27 fiches issues de Freshdesk)    | `src/data/supportCases.ts`        |
| Fréquences / tickets sources par cas           | `src/data/freshdeskObservations.ts` |
| Les messages au membre (Template SAV ECC)      | `src/data/templates.ts`           |
| Les messages internes (ex. comptabilité)       | `src/data/internalMessages.ts`    |
| Les intervenants et leurs contacts             | `src/data/roles.ts`               |
| Les grandes catégories (provisoires)           | `src/data/categories.ts`          |
| La structure de toutes les données             | `src/data/types.ts`               |
| Le style                                       | `src/styles.css`                  |

Un cas contient : problème, formulations observées, fréquence, dernière observation, tickets Freshdesk
sources, informations à collecter, vérifications, étapes avec responsable, « ne pas faire », statut
(🟢 SAV / 🟠 à remonter / 🔴 ne pas traiter), escalade (vers qui, pourquoi, quoi transmettre, retour attendu),
messages interne et membre, statut de validation (validé / à valider), contradictions, cas proches.
Les cas « à valider » expliquent ce qui doit être confirmé. Plus aucune donnée fictive.

### Templates SAV (source : « Template SAV ECC »)
- 14 cas / 14 messages repris du document officiel (`src/data/templates.ts`, `src/data/supportCases.ts`).
- `sourceMessage` = texte du document ; la salutation (« Salut 👋 » → « Bonjour {{prenom}} 👋 ») et les
  mentions à compléter (« LIEN DE L'INVOICE » → `{{lien_invoice}}`) sont dérivées par `src/lib/savTemplate.ts`.
- Champs `actionRequired`, `checks`, `escalation`, `internalNotes` prévus mais vides (non documentés) :
  à compléter avec l'historique Freshdesk.

### Variables de template
`{{prenom}} {{nom}} {{email}} {{formation}} {{montant}} {{date}} {{numero_facture}} {{lien_invoice}}` —
`{{prenom}}` est facultatif (salutation générique s'il est vide) ; toute autre variable est obligatoire :
tant qu'elle est vide, elle est signalée et la copie du message est bloquée.

## Générateur de factures (Documents → Facture)
- Rendu calqué sur le modèle ECC / BB (« FACTURE #ECC0174 », DESTINATAIRE / EMETTEUR, Délivré le, DESCRIPTION / PRIX / MONTANT, TOTAL MONTANT PERÇU).
- Textes du modèle (libellés, description par défaut, préfixes) : `src/data/invoiceTemplate.ts`.
- **Direction artistique** (logo, polices, interlettrage, couleurs, filets, bandeaux/texture, pied de page, total) : `src/data/invoiceBrand.ts`. Les fichiers de marque officiels se déposent dans `src/assets/brand/` (voir le README de ce dossier).
- Calculs en centimes entiers (`src/documents/core/totals.ts`), modes « montant HT » / « montant TTC ».
- PDF réel généré dans le navigateur avec `@react-pdf/renderer` (`src/documents/pdf/`) ; polices EB Garamond, Didact Gothic et Inter embarquées (`src/documents/pdf/fonts/`, licences OFL). L'aperçu affiché est le PDF lui-même.
- **Émetteur par défaut : Business Brothers LIMITED** (`src/data/issuerProfile.ts`, seule source). Affiché en lecture seule ; aucune autre mention légale n'est inventée (n° d'entreprise, TVA, email : vides, donc non imprimés). Case « Modifier exceptionnellement… » + confirmation → champs modifiables pour CE document uniquement ; rien n'est enregistré, le document suivant (ou « Réinitialiser », ou un rechargement) revient à Business Brothers.
- **Logo officiel ECC** : déposer le fichier dans `src/assets/ecc-logo.png` (ou `.jpg` / `.jpeg`). Détecté automatiquement, utilisé dans l'aperçu et dans le PDF (ratio respecté). Tant qu'il est absent, l'en-tête reste sans logo.
- Génération impossible sans la case « Je confirme que le règlement intégral du client a bien été reçu ».
- Numéros : proposition `ECC0174` (préfixe ECC / BB / autre), modifiable ; la séquence continue à partir du « dernier numéro émis » saisi et des PDF générés dans ce navigateur (aucune donnée client stockée).

## Volontairement non connecté (V1)
- Aucun service externe (Freshdesk, Whop, WhatsApp, paiement), aucun appel API, aucune IA.
- **Export PDF du devis et de l'attestation** : encore « À connecter » (la facture, elle, génère un vrai PDF).
- Pas de numérotation automatique des factures / devis (saisie manuelle).
- Pas d'import Excel / CSV : les données sont des fichiers TypeScript à remplacer.
- Favoris stockés uniquement dans le navigateur (localStorage).
