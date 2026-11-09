"use client";

import { FormEvent, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { useMarketWrite } from "@/hooks/useMarketWrite";

type LiquidatePanelProps = {
  connected: boolean;
  daiAllowance?: bigint;
  onRefresh: () => void;
};

export function LiquidatePanel({
  connected,
  daiAllowance,
  onRefresh,
}: LiquidatePanelProps) {
  const [borrower, setBorrower] = useState("");
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { run, isPending, error, isSuccess, hash } = useMarketWrite(onRefresh);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (!isAddress(borrower)) {
      setLocalError("Borrower must be a valid address");
      return;
    }

    let debtToCover: bigint;
    try {
      debtToCover = parseUnits(amount.trim(), 18);
    } catch {
      setLocalError("Enter a valid DAI amount");
      return;
    }

    try {
      if ((daiAllowance ?? 0n) === 0n) {
        await run({ action: "approveDai" });
      }
      await run({
        action: "liquidate",
        borrower: borrower as `0x${string}`,
        amount: debtToCover,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Liquidation failed");
    }
  }

  return (
    <section className="liquidate-panel reveal delay-4" aria-label="Liquidations">
      <div className="section-kicker">Optional</div>
      <h2 className="section-title">Liquidate</h2>
      <p className="section-copy">
        Cover DAI debt for an account with health factor &lt; 1 and receive WETH plus a 5%
        bonus.
      </p>

      <form className="amount-form" onSubmit={onSubmit}>
        <label className="field-label" htmlFor="borrower">
          Borrower
        </label>
        <input
          id="borrower"
          placeholder="0x…"
          value={borrower}
          disabled={!connected || isPending}
          onChange={(e) => setBorrower(e.target.value)}
        />

        <label className="field-label" htmlFor="debt-cover">
          Debt to cover
        </label>
        <div className="field-row">
          <input
            id="debt-cover"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            disabled={!connected || isPending}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="field-suffix">DAI</span>
        </div>

        {localError || error ? (
          <p className="form-error">{localError || error?.message}</p>
        ) : null}
        {isSuccess && hash ? (
          <p className="tx-status">Liquidation confirmed · {hash.slice(0, 10)}…</p>
        ) : null}

        <button
          className="btn btn-danger wide"
          type="submit"
          disabled={!connected || isPending}
        >
          {isPending ? "Confirm in wallet…" : "Liquidate"}
        </button>
      </form>
    </section>
  );
}
