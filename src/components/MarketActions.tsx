"use client";

import { useMemo, useState } from "react";
import { AmountForm } from "./AmountForm";
import { useMarketWrite, type MarketAction } from "@/hooks/useMarketWrite";
import { formatToken } from "@/lib/format";
import { isAnvilMode } from "@/lib/network";

type Balances = {
  wethBalance?: bigint;
  daiBalance?: bigint;
  wethAllowance?: bigint;
  daiAllowance?: bigint;
  collateral?: bigint;
  debt?: bigint;
  supplied?: bigint;
  availableLiquidity?: bigint;
};

type MarketActionsProps = {
  balances: Balances;
  connected: boolean;
  onRefresh: () => void;
};

const TABS = [
  { id: "supply", label: "Supply DAI" },
  { id: "collateral", label: "Collateral" },
  { id: "borrow", label: "Borrow / repay" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MarketActions({
  balances,
  connected,
  onRefresh,
}: MarketActionsProps) {
  const [tab, setTab] = useState<TabId>("supply");
  const { run, isPending, error, isSuccess, hash } = useMarketWrite(onRefresh);

  const needsWethApprove = (balances.wethAllowance ?? 0n) === 0n;
  const needsDaiApprove = (balances.daiAllowance ?? 0n) === 0n;

  const status = useMemo(() => {
    if (error) return error.message;
    if (isSuccess && hash) return `Confirmed · ${hash.slice(0, 10)}…`;
    return null;
  }, [error, hash, isSuccess]);

  async function ensureApprove(kind: "weth" | "dai") {
    const action: MarketAction = kind === "weth" ? "approveWeth" : "approveDai";
    const needs = kind === "weth" ? needsWethApprove : needsDaiApprove;
    if (needs) await run({ action });
  }

  return (
    <section className="actions-panel reveal delay-3" aria-label="Market actions">
      <div className="section-kicker">Desk</div>
      <h2 className="section-title">Market actions</h2>
      <p className="section-copy">
        Approve once, then supply liquidity, post WETH collateral, borrow or repay DAI.
      </p>

      <div className="tablist" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "tab active" : "tab"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="action-grid">
        {tab === "supply" ? (
          <>
            <AmountForm
              label="Supply liquidity"
              symbol="DAI"
              cta="Supply"
              disabled={!connected || isPending}
              helper={`Wallet ${formatToken(balances.daiBalance)} DAI · pool free ${formatToken(balances.availableLiquidity)}`}
              onSubmitAmount={async (amount) => {
                await ensureApprove("dai");
                await run({ action: "supplyLiquidity", amount });
              }}
            />
            <AmountForm
              label="Withdraw liquidity"
              symbol="DAI"
              cta="Withdraw"
              disabled={!connected || isPending}
              helper={`Your supply ${formatToken(balances.supplied)} DAI`}
              onSubmitAmount={async (amount) => {
                await run({ action: "withdrawLiquidity", amount });
              }}
            />
          </>
        ) : null}

        {tab === "collateral" ? (
          <>
            <AmountForm
              label="Deposit collateral"
              symbol="WETH"
              cta="Deposit"
              disabled={!connected || isPending}
              helper={`Wallet ${formatToken(balances.wethBalance)} WETH`}
              onSubmitAmount={async (amount) => {
                await ensureApprove("weth");
                await run({ action: "depositCollateral", amount });
              }}
            />
            <AmountForm
              label="Withdraw collateral"
              symbol="WETH"
              cta="Withdraw"
              disabled={!connected || isPending}
              helper={`Deposited ${formatToken(balances.collateral)} WETH`}
              onSubmitAmount={async (amount) => {
                await run({ action: "withdrawCollateral", amount });
              }}
            />
          </>
        ) : null}

        {tab === "borrow" ? (
          <>
            <AmountForm
              label="Borrow"
              symbol="DAI"
              cta="Borrow"
              disabled={!connected || isPending}
              helper={`Available liquidity ${formatToken(balances.availableLiquidity)} DAI`}
              onSubmitAmount={async (amount) => {
                await run({ action: "borrow", amount });
              }}
            />
            <AmountForm
              label="Repay"
              symbol="DAI"
              cta="Repay"
              disabled={!connected || isPending}
              helper={`Outstanding debt ${formatToken(balances.debt)} DAI`}
              onSubmitAmount={async (amount) => {
                await ensureApprove("dai");
                await run({ action: "repay", amount });
              }}
            />
          </>
        ) : null}
      </div>

      {isAnvilMode ? (
        <div className="faucet-row">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!connected || isPending}
            onClick={() => run({ action: "mintWeth", amount: 10n * 10n ** 18n })}
          >
            Mint 10 WETH (Anvil)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!connected || isPending}
            onClick={() => run({ action: "mintDai", amount: 100_000n * 10n ** 18n })}
          >
            Mint 100k DAI (Anvil)
          </button>
        </div>
      ) : (
        <p className="section-copy">
          Sepolia mode: use public faucets for ETH / test tokens (see README). In-app mint is Anvil-only.
        </p>
      )}

      {status ? <p className="tx-status">{status}</p> : null}
    </section>
  );
}
