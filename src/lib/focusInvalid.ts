/** Amène l'utilisateur au premier champ à corriger : défilement + focus. */
export function focusFirstInvalid(root: ParentNode = document): boolean {
  const el = root.querySelector<HTMLElement>('.is-invalid input, .is-invalid select, .is-invalid textarea, input.has-error, select.has-error');
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus({ preventScroll: true });
  return true;
}
