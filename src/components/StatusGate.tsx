import { NOT_IN_ORDER_CASE_ID, getCase, getInternalMessage, getRole } from '../data';
import { href } from '../lib/router';
import { MemberVarsPanel } from './MemberVarsPanel';
import { InternalMessageCard } from './InternalMessageCard';

const FLOW = ['Demande reçue', 'Vérification interne du statut', 'Statut confirmé', 'Traitement de la demande', 'Réponse au membre'];

/** Les cinq temps du workflow, identiques pour tous les cas. */
export function WorkflowStrip({ gated }: { gated: boolean }) {
  const steps = gated ? FLOW : ['Demande reçue', 'Traitement de la demande', 'Réponse au membre'];
  return (
    <ol className="wf-strip" aria-label="Déroulé">
      {steps.map((label, i) => (
        <li key={label} className={label === 'Vérification interne du statut' ? 'is-gate' : ''}>
          {label}
          {i < steps.length - 1 && <span aria-hidden> →</span>}
        </li>
      ))}
    </ol>
  );
}

/** Contrôle du statut membre : étape interne obligatoire, commune à tous les cas, AVANT le traitement. */
export function StatusGate({ caseId }: { caseId: string }) {
  const message = getInternalMessage('int-compta-acces');
  const compta = getRole('comptabilite');
  const notInOrder = caseId === NOT_IN_ORDER_CASE_ID ? undefined : getCase(NOT_IN_ORDER_CASE_ID);
  return (
    <section className="cs-gate" aria-labelledby="gate-title">
      <header className="cs-gate-head">
        <h2 id="gate-title">Contrôle du statut membre</h2>
        <span className="gate-tag">Vérification interne obligatoire</span>
      </header>
      <p className="gate-lead">À faire avant de traiter la demande. Le membre n’en est pas informé.</p>
      <ol className="gate-steps">
        <li>Identifier le membre : prénom, nom, email.</li>
        <li>Envoyer ce message à la comptabilité{compta?.contact ? ` (${compta.contact})` : ''}.</li>
        <li>Attendre son retour avant de commencer.</li>
      </ol>
      <MemberVarsPanel compact fields={['prenom', 'nom', 'email']} />
      {message && <InternalMessageCard message={message} />}
      <div className="gate-outcomes">
        <div className="gate-ok">
          <strong>✅ Membre en règle</strong>
          <span>Continue : traitement de la demande, plus bas.</span>
        </div>
        <div className="gate-ko">
          <strong>⛔ Membre pas en règle</strong>
          <span>Ne poursuis pas le traitement normal.</span>
          {notInOrder ? (
            <span>
              Voir <a href={href('traiter', notInOrder.id)}>{notInOrder.shortTitle}</a>. Si ce cas ne correspond pas : procédure à définir (validation d’un responsable nécessaire).
            </span>
          ) : (
            <span>Applique la procédure ci-dessous. Si elle ne correspond pas : procédure à définir (validation d’un responsable nécessaire).</span>
          )}
        </div>
      </div>
    </section>
  );
}
