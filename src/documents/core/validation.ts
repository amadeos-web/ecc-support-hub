/** Erreurs de formulaire : clé = chemin du champ (ex. "client.lastName", "lines.0.unitPrice"). */
export type FieldErrors = Record<string, string>;

export function requireText(errors: FieldErrors, key: string, value: string | undefined, message: string) {
  if (!value || !value.trim()) errors[key] = message;
}

export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
