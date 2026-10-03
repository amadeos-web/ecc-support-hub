import type { CategoryId, MessageTemplate } from './types';
import { prepareSavTemplate } from '../lib/savTemplate';

/**
 * BIBLIOTHÈQUE DES MESSAGES SAV — source : document « TEMPLATE SAV ECC » (PDF, 5 pages, 14 cas).
 *
 * `sourceMessage` reprend le texte du document à l'identique (paragraphes reconstitués d'après
 * la mise en page ; aucun mot modifié). La salutation personnalisée et les champs à compléter
 * sont dérivés automatiquement par `prepareSavTemplate` (voir src/lib/savTemplate.ts).
 * Pour ajouter un cas (ex. issu de l'historique Freshdesk) : ajouter une entrée ici et le cas
 * correspondant dans supportCases.ts.
 */
interface SavEntry {
  id: string;
  title: string;
  category: CategoryId;
  sourceMessage: string;
}

const SAV_ECC: SavEntry[] = [
  {
    id: 'tpl-sav-nouvel-ecosysteme',
    title: 'Le client ne connait pas le nouvel écosystème',
    category: 'acces-connexion',
    sourceMessage: `Salut 👋

On a longuement travaillé en coulisses pour vous préparer quelque chose de bien plus grand, et on est ravis de vous annoncer que le nouvel écosystème ECC est officiellement lancé.
Une nouvelle plateforme, une expérience repensée de A à Z, et tout ce qu'il faut pour passer au niveau supérieur avec vous.

Ce qui change concrètement :
La communauté migre sur Circle — plus puissant, plus fluide, plus pro
La nouvelle formation est désormais disponible sur Whop
Le tout réuni dans un seul écosystème : l'Ecommerce Capital Club

👉 Une seule étape pour rejoindre la V2 :
Complétez le KYC (vérification d'identité) via le formulaire ci-dessous.
Cette étape est indispensable pour valider vos nouveaux accès et recevoir votre carte de membre ECC :

🔗 https://membres.ecommercecapitalclub.com/

Une fois validé, vos accès à Circle, Whop et à l'ensemble du nouvel écosystème seront débloqués rapidement.

Si vous avez la moindre question pendant le processus, n’hésitez pas à revenir vers nous.

On a hâte de vous retrouver de l'autre côté 🔥

À très vite,

L'équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-pas-acces-v2-whop',
    title: "Le client n'a pas accès à la V2 sur Whop",
    category: 'formation-whop',
    sourceMessage: `Salut 👋

On vient de t’envoyer, à l’instant, une invoice de 0,00 USD par email afin de finaliser ton accès à ton espace Whop.

Aucun paiement n’est nécessaire — cette étape permet simplement de valider ton intégration et de t’attribuer ta place dans le nouvel espace membre.

👉 Une seule étape à faire :
Rends-toi dans tes emails et accepte l’invoice de 0,00 USD reçue.

Une fois validée, ton accès sera activé et tu pourras profiter de l’ensemble de l’écosystème mis en place pour toi.

Si tu ne vois pas l’email immédiatement, pense à vérifier tes spams ou courriers indésirables.

Si tu as la moindre question pendant le processus, n’hésite pas à revenir vers nous.

On a hâte de te retrouver de l’autre côté 🔥

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-client-non-identifie',
    title: "Le client n'est pas identifié",
    category: 'compte-membre',
    sourceMessage: `Salut 👋

Afin de pouvoir analyser rapidement ta situation et t’apporter une solution efficace, j’ai besoin que tu me confirmes les informations suivantes :

- Email utilisé lors de l’inscription :

- Nom / Prénom :

- Pseudo Discord :

- Description précise du problème rencontré :

- KYC complété : (Oui / Non)

- Accès à Circle : (Oui / Non)

- Accès à Whop : (Oui / Non)

- Carte ECC validée : (Oui / Non)

👉 Dès que j’ai ces éléments, je peux faire le nécessaire de mon côté pour débloquer la situation le plus rapidement possible.

Merci d’avance pour ta réactivité 🔥

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-relance-invoice-0-usd',
    title: "Le client relance pour ses accès à Whop mais a déjà reçu l'invoice à 0,00 USD",
    category: 'formation-whop',
    sourceMessage: `Salut 👋

Concernant ton accès à la V2 sur Whop, ton invitation a déjà bien été envoyée sous la forme d’une invoice de 0,00 USD.

Aucun paiement n’est nécessaire — il te suffit simplement d’accepter cette invitation pour activer ton accès à la plateforme.

👉 Voici le lien de la facture :
LIEN DE L'INVOICE

Je t’invite également à consulter tes emails, car tu as normalement reçu cette même invitation directement par mail.

Une fois l’invoice acceptée, ton accès sera automatiquement débloqué et tu pourras rejoindre l’ensemble du nouvel écosystème ECC.

Si tu ne retrouves pas l’email, pense aussi à vérifier tes spams ou courriers indésirables.

On a hâte de te retrouver de l’autre côté 🔥

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-date-prelevement',
    title: 'Le client demande de modifier la date de prélèvement',
    category: 'paiement-statut',
    sourceMessage: `Salut 👋

Concernant la date de prélèvement, le système est malheureusement entièrement automatisé, ce qui signifie que nous ne pouvons pas modifier manuellement la date prévue.

Si le prélèvement échoue, les accès à la plateforme seront automatiquement suspendus jusqu’à ce que les paiements soient régularisés.

Dès que la situation est remise en ordre et que le paiement passe correctement, les accès sont automatiquement réactivés.

Merci pour ta compréhension 🙏

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-niveau-advanced',
    title: 'Le client demande ses accès au niveau avancé',
    category: 'communaute-circle',
    sourceMessage: `Salut 👋

Pour rejoindre le niveau Advanced, il est nécessaire de poster tes résultats directement dans le channel résultats de la communauté afin de motiver les autres membres.

👉 Un exemple du format attendu est déjà disponible dans ce channel : il te suffit de le suivre et de publier ton post en respectant ce modèle.

L’accès Advanced peut être débloqué à partir de 25 000€ de chiffre d’affaires réalisé.

Une fois ton post publié, tout se passe directement sur la communauté : ce sont les responsables qui vérifient, valident les résultats et attribuent ensuite les accès.

C’est la seule procédure pour débloquer le niveau Advanced.

À très vite 🔥

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-email-present-whop',
    title: 'Le client déclare ne pas avoir accès à la V2 mais son email est bien dans la base de donné Whop',
    category: 'formation-whop',
    sourceMessage: `Salut 👋

Après vérification de notre côté avec l’adresse email que tu nous as communiquée, je peux te confirmer que ton accès à Whop est bien actif sur cette adresse.

Tu disposes donc déjà des accès à la plateforme avec cet email.

Je t’invite à bien vérifier que tu es connecté sur le bon compte Whop, avec la bonne adresse email utilisée lors de ton inscription, car le problème vient généralement de là.

Pense également à te déconnecter puis te reconnecter, ou à tester depuis un autre navigateur/appareil si nécessaire.

Tes accès étant bien actifs de notre côté, tu devrais pouvoir retrouver la formation normalement en te reconnectant sur le bon compte.

Tiens-moi au courant si le problème persiste 🔥

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-acces-retires-defaut-paiement',
    title: "Le client s'est vu retiré ses accès à la V2 pour cause de défaut de paiement",
    category: 'paiement-statut',
    sourceMessage: `Salut 👋

Concernant tes accès, ils ont été suspendus car le règlement du paiement n’a pas été effectué dans les délais prévus.

Une fois le paiement régularisé et la situation remise en ordre, nous pourrons procéder à la réouverture de tes accès à la plateforme.

👉 Il te suffit donc de finaliser le règlement pour que nous puissions débloquer la situation.

Merci pour ta compréhension 🙏

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-email-present-whop-circle',
    title: "Le client déclare ne pas avoir accès à Whop et Circle mais son adresse email indique qu'il est présent sur les deux",
    category: 'acces-connexion',
    sourceMessage: `Salut 👋

Après vérification de notre côté avec l’adresse email que tu nous as communiquée, je peux te confirmer que tes accès à Whop ainsi qu’à Circle sont bien actifs sur cette adresse.

Tu disposes donc déjà des accès aux deux plateformes avec cet email.

Je t’invite à bien vérifier que tu es connecté sur le bon compte, avec la bonne adresse email utilisée lors de ton inscription, car le problème vient généralement de là.

Pense également à te déconnecter puis te reconnecter, ou à tester depuis un autre navigateur/appareil si nécessaire.

Tes accès étant bien actifs de notre côté, tu devrais pouvoir retrouver la formation ainsi que la communauté normalement en te reconnectant sur le bon compte.

Tiens-moi au courant si le problème persiste 🔥

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-plusieurs-appareils',
    title: 'Le client se questionne sur le visionnage de la formation sur plusieurs devices',
    category: 'formation-whop',
    sourceMessage: `Salut 👋

Il est tout à fait possible de se connecter à la formation depuis plusieurs appareils (téléphone, ordinateur, tablette…), tant que l’utilisation reste personnelle et normale.

L’idée est simple : une personne = un abonnement.

Tu peux donc utiliser différents appareils sans problème, tant qu’il ne s’agit pas de connexions suspectes ou d’un partage de compte.

Ce que nos systèmes surveillent principalement, ce sont les connexions simultanées répétées sur plusieurs appareils ou toute activité pouvant indiquer un abus.

Dans ce type de situation, le compte peut être signalé et faire l’objet d’une vérification plus approfondie.

Tant que l’utilisation reste classique et personnelle, il n’y a aucun souci 🙏

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-visionnage-telephone',
    title: 'Le client déclare ne pas pouvoir visionner la formation sur son téléphone',
    category: 'formation-whop',
    sourceMessage: `Salut 👋

Si tu as bien accès à la formation sur ton ordinateur, alors ton accès est normalement actif sur tous les appareils, y compris le téléphone.

Dans ce cas, le problème vient généralement de la connexion ou du compte utilisé sur mobile.

👉 Je t’invite à vérifier les points suivants :

* Être connecté avec la bonne adresse email
* Te déconnecter puis te reconnecter sur ton téléphone
* Tester depuis un autre navigateur ou directement via l’app si disponible

Dans la grande majorité des cas, ça suffit à régler le souci.

Si le problème persiste après ça, reviens vers nous avec plus de détails et on regardera ça ensemble 🔥

À très vite,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-double-acces-associe',
    title: 'Le client veut avoir un double accès avec son associé',
    category: 'compte-membre',
    sourceMessage: `Bonjour,

Toute l’équipe Ecommerce Capital Club tient à revenir vers vous sur un point important, et nous le faisons avec la plus grande transparence.
Depuis le départ, votre accompagnement a été conçu comme une expérience nominative, pensée pour une seule personne, afin de garantir un suivi de qualité et un cadre sécurisé. Sur l’ancienne communauté Discord, nous avions fait preuve de souplesse en tolérant certains partages d’accès. C’était un geste de notre part, jamais une règle officielle, et nous comprenons que cela ait pu créer des habitudes.

Avec notre passage sur Circle, nous franchissons une nouvelle étape. Cette nouvelle plateforme nous permet d’offrir un environnement plus structuré, plus personnalisé, mais elle implique aussi un cadre plus clair : un accompagnement correspond désormais à un accès nominatif, lié à une seule adresse e-mail.

Nous savons que ce changement peut demander un temps d’adaptation, et nous tenons à vous remercier sincèrement pour votre compréhension. Notre objectif reste le même : vous offrir le meilleur accompagnement possible dans les meilleures conditions.

Bien entendu, l’équipe reste pleinement disponible pour répondre à vos questions ou vous accompagner dans cette transition.
Avec toute notre considération,

L’équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-hors-sujet',
    title: 'Le client est hors sujet',
    category: 'autre',
    sourceMessage: `Bonjour 👋

Merci pour ton message.

Le support Ecommerce Capital Club est exclusivement dédié aux demandes d’assistance technique et administrative liées à nos outils et services (accès aux plateformes, paiements, KYC, Circle, Whop, carte ECC, bugs techniques, etc.).

Ta demande ne relève pas du support technique. Nous t'invitons donc à la déposer dans les espaces communautaires appropriés (Circle, coaching, salons dédiés, etc.), où les membres et intervenants pourront t'apporter une réponse adaptée.

👉 Si tu rencontres un problème technique ou administratif concernant ton compte ou tes accès, merci de nous transmettre les détails du problème afin que nous puissions t'aider.

Merci de ta compréhension.

L'équipe Ecommerce Capital Club`,
  },
  {
    id: 'tpl-sav-probleme-technique',
    title: 'Le client a un problème technique',
    category: 'technique',
    sourceMessage: `Bonjour 👋

Merci pour ton message.

Le problème de lecture des vidéos de la formation nous a bien été remonté et nos équipes techniques sont actuellement mobilisées pour le résoudre.
Nous mettons tout en œuvre afin de rétablir la situation dans les plus brefs délais.

👉 Aucune action n'est requise de ton côté pour le moment. Nous t'invitons simplement à réessayer un peu plus tard.

Merci pour ta patience et ta compréhension.

L'équipe Ecommerce Capital Club`,
  },
];

/** Cas SAV auxquels chaque message validé est rattaché (un message peut servir plusieurs cas). */
const CASE_LINKS: Record<string, string[]> = {
  'tpl-sav-nouvel-ecosysteme': ['cas-absent-base-kyc'],
  'tpl-sav-pas-acces-v2-whop': ['cas-acces-v2-non-recu', 'cas-desabonnement-accidentel', 'cas-invitation-whop-0usd'],
  'tpl-sav-client-non-identifie': ['cas-membre-non-identifie', 'cas-acces-v2-non-recu', 'cas-desabonnement-accidentel', 'cas-acces-retire-sans-explication'],
  'tpl-sav-relance-invoice-0-usd': ['cas-invitation-whop-0usd'],
  'tpl-sav-date-prelevement': ['cas-date-prelevement'],
  'tpl-sav-niveau-advanced': ['cas-niveau-advanced'],
  'tpl-sav-email-present-whop': ['cas-acces-actif-mauvais-compte', 'cas-whop-payant-v1'],
  'tpl-sav-acces-retires-defaut-paiement': ['cas-defaut-paiement'],
  'tpl-sav-email-present-whop-circle': ['cas-acces-actif-mauvais-compte'],
  'tpl-sav-plusieurs-appareils': ['cas-plusieurs-appareils', 'cas-acces-perdu-appareil'],
  'tpl-sav-visionnage-telephone': ['cas-video-telephone'],
  'tpl-sav-double-acces-associe': ['cas-double-acces'],
  'tpl-sav-hors-sujet': ['cas-hors-sujet'],
  'tpl-sav-probleme-technique': ['cas-lecture-videos'],
};

export const templates: MessageTemplate[] = SAV_ECC.map((e) => ({
  id: e.id,
  title: e.title,
  category: e.category,
  sourceMessage: e.sourceMessage,
  ...prepareSavTemplate(e.sourceMessage),
  caseIds: CASE_LINKS[e.id] ?? [],
  source: 'template-sav-ecc',
}));
