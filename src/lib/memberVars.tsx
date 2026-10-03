import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { TemplateVars } from './templateEngine';

/**
 * Variables du membre en cours (prénom, email…), partagées entre
 * "Traiter une demande" et "Messages & Templates". Volontairement non
 * persistées : on repart de zéro à chaque rechargement (nouveau membre).
 */
interface MemberVarsValue {
  vars: TemplateVars;
  setVar: (key: string, value: string) => void;
  reset: () => void;
}

const MemberVarsContext = createContext<MemberVarsValue | null>(null);

export function MemberVarsProvider({ children }: { children: ReactNode }) {
  const [vars, setVars] = useState<TemplateVars>({});
  const value = useMemo<MemberVarsValue>(
    () => ({
      vars,
      setVar: (key, v) => setVars((prev) => ({ ...prev, [key]: v })),
      reset: () => setVars({}),
    }),
    [vars],
  );
  return <MemberVarsContext.Provider value={value}>{children}</MemberVarsContext.Provider>;
}

export function useMemberVars() {
  const ctx = useContext(MemberVarsContext);
  if (!ctx) throw new Error('useMemberVars doit être utilisé dans MemberVarsProvider');
  return ctx;
}
