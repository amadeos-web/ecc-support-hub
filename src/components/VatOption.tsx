/**
 * Option TVA commune aux trois documents (facture, devis, attestation) : décochée = TVA 0 %.
 * Taux libre avec propositions triées, montant saisi TTC ou HT.
 */
export interface VatState {
  vatOn: boolean;
  vatRate: string;
  vatMode: 'TTC' | 'HT';
}

export const emptyVat = (): VatState => ({ vatOn: false, vatRate: '', vatMode: 'TTC' });

export const RATE_PRESETS = ['5,5', '6', '10', '12', '20', '21'];

export function VatOption({ value, onChange, error, id }: { value: VatState; onChange: (patch: Partial<VatState>) => void; error?: string; id: string }) {
  return (
    <>
      <label className="na-check vat-toggle">
        <input type="checkbox" checked={value.vatOn} onChange={(e) => onChange({ vatOn: e.target.checked })} />
        Add VAT
      </label>
      {value.vatOn && (
        <div className="field-row">
          <div className={`field ${error ? 'is-invalid' : ''}`}>
            <span className="field-label">
              VAT rate (%) <span className="req">*</span>
            </span>
            <input className="input" inputMode="decimal" list={`${id}-rates`} value={value.vatRate} onChange={(e) => onChange({ vatRate: e.target.value })} placeholder="20" autoComplete="off" />
            <datalist id={`${id}-rates`}>
              {RATE_PRESETS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            {error && <span className="field-error">{error}</span>}
          </div>
          <div className="field">
            <span className="field-label">The amount entered is</span>
            <div className="seg">
              {(['TTC', 'HT'] as const).map((m) => (
                <button key={m} type="button" className={`btn btn-small ${value.vatMode === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onChange({ vatMode: m })}>
                  {m === 'TTC' ? 'Incl. VAT' : 'Excl. VAT'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
