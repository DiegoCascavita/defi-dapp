"use client";

import { FormEvent, useState } from "react";
import { parseAmount } from "@/lib/format";

type AmountFormProps = {
  label: string;
  symbol: string;
  cta: string;
  disabled?: boolean;
  helper?: string;
  onSubmitAmount: (amount: bigint) => Promise<void> | void;
};

export function AmountForm({
  label,
  symbol,
  cta,
  disabled,
  helper,
  onSubmitAmount,
}: AmountFormProps) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parseAmount(value);
    if (!amount || amount <= 0n) {
      setLocalError("Enter a valid amount");
      return;
    }
    setLocalError(null);
    setBusy(true);
    try {
      await onSubmitAmount(amount);
      setValue("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="amount-form" onSubmit={onSubmit}>
      <label className="field-label" htmlFor={`amount-${label}`}>
        {label}
      </label>
      <div className="field-row">
        <input
          id={`amount-${label}`}
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          disabled={disabled || busy}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="field-suffix">{symbol}</span>
      </div>
      {helper ? <p className="field-helper">{helper}</p> : null}
      {localError ? <p className="form-error">{localError}</p> : null}
      <button className="btn btn-primary wide" type="submit" disabled={disabled || busy}>
        {busy ? "Confirm in wallet…" : cta}
      </button>
    </form>
  );
}
