/** Minuscules + suppression des accents : « Facturé » → « facture ». */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
