"use client";

import { useMemo } from "react";
import { AmountForm } from "./AmountForm";
import { useVaultReads } from "@/hooks/useVaultReads";
import { useVaultWrite } from "@/hooks/useVaultWrite";
import {
  contracts,
  PROTOCOL,
  vaultAssetSupportsPermit,
  vaultConfigured,
} from "@/lib/contracts";
import { formatToken, shortenAddress } from "@/lib/format";
import { isAnvilMode, isSepoliaMode } from "@/lib/network";

/**
 * Cascade Vault desk panel — ERC-4626 deposit / withdraw (+ Anvil permit).
 * Sepolia uses live cvWETH over canonical WETH (no EIP-2612 on that asset).
 */
export function VaultPanel() {
  const reads = useVaultReads();
  const { run, isPending, error, isSuccess, hash } = useVaultWrite(reads.refetchAll);

  const status = useMemo(() => {
    if (error) return error.message;
    if (isSuccess && hash) return `Confirmed · ${hash.slice(0, 10)}…`;
    return null;
  }, [error, hash, isSuccess]);

  const needsApprove = (reads.assetAllowance ?? 0n) === 0n;
  const permitReady =
    vaultAssetSupportsPermit &&
    Boolean(reads.assetName?.trim()) &&
    reads.assetNonce !== undefined;
  const feeBps = reads.withdrawalFeeBps !== undefined ? Number(reads.withdrawalFeeBps) : null;

  return (
    <section className="vault-panel reveal delay-4" aria-label="Cascade Vault">
      <div className="section-kicker">Demo vault</div>
      <h2 className="section-title">Cascade Vault</h2>
      <p className="section-copy">
        ERC-4626 share vault from{" "}
        <a
          href="https://github.com/DiegoCascavita/defi-vault"
          target="_blank"
          rel="noreferrer"
        >
          defi-vault
        </a>
        .{" "}
        {isSepoliaMode ? (
          <>
            Deposit Sepolia WETH for {PROTOCOL.vaultShareSymbol} shares —{" "}
            <strong>portfolio demo only</strong>, not production yield. Vault asset is
            canonical WETH (same token as lending collateral; wrap ETH first).
          </>
        ) : (
          <>
            Park mock DAI for {PROTOCOL.vaultShareSymbol} shares —{" "}
            <strong>portfolio demo only</strong>, not production yield. Underlying is the
            vault&apos;s own mock asset (separate from lending DAI).
          </>
        )}
      </p>

      {!vaultConfigured ? (
        <p className="tx-status" role="status">
          {isSepoliaMode
            ? "Vault addresses missing on Sepolia — set deployments/sepolia.json or NEXT_PUBLIC_CASCADE_VAULT / VAULT_ASSET."
            : "Vault addresses missing. Deploy defi-vault on Anvil, then run npm run sync:vault."}
        </p>
      ) : (
        <>
          <div className="stat-grid vault-stats">
            <article>
              <h3>Total assets</h3>
              <p className="stat-value">
                {formatToken(reads.totalAssets)} {PROTOCOL.vaultAssetSymbol}
              </p>
            </article>
            <article>
              <h3>Your shares</h3>
              <p className="stat-value">
                {formatToken(reads.shares)} {PROTOCOL.vaultShareSymbol}
              </p>
            </article>
            <article>
              <h3>Share value</h3>
              <p className="stat-value">
                {formatToken(reads.shareAssets)} {PROTOCOL.vaultAssetSymbol}
              </p>
            </article>
            <article>
              <h3>Withdraw fee</h3>
              <p className="stat-value">{feeBps === null ? "—" : `${(feeBps / 100).toFixed(2)}%`}</p>
            </article>
          </div>

          <p className="field-helper vault-addr">
            Vault {shortenAddress(contracts.cascadeVault)} · asset{" "}
            {shortenAddress(contracts.vaultAsset)}
            {isSepoliaMode ? " · Sepolia vault" : " · Anvil demo"}
          </p>

          <div className="action-grid">
            <AmountForm
              label="Deposit assets"
              symbol={PROTOCOL.vaultAssetSymbol}
              cta="Deposit"
              disabled={!reads.isConnected || isPending || !vaultConfigured}
              helper={`Wallet ${formatToken(reads.assetBalance)} ${PROTOCOL.vaultAssetSymbol}`}
              onSubmitAmount={async (amount) => {
                if (needsApprove) await run({ action: "approveAsset" });
                await run({ action: "deposit", amount });
              }}
            />
            <AmountForm
              label="Withdraw assets"
              symbol={PROTOCOL.vaultAssetSymbol}
              cta="Withdraw"
              disabled={!reads.isConnected || isPending || !vaultConfigured}
              helper={`Max ${formatToken(reads.maxWithdraw)} ${PROTOCOL.vaultAssetSymbol}`}
              onSubmitAmount={async (amount) => {
                await run({ action: "withdraw", amount });
              }}
            />
            {vaultAssetSupportsPermit ? (
              <AmountForm
                label="Deposit with permit"
                symbol={PROTOCOL.vaultAssetSymbol}
                cta="Sign + deposit"
                disabled={
                  !reads.isConnected || isPending || !vaultConfigured || !permitReady
                }
                helper={
                  permitReady
                    ? "EIP-2612 permit on underlying, then depositWithPermit (no prior approve tx)"
                    : "Waiting for vault asset name + permit nonce before signing"
                }
                onSubmitAmount={async (amount) => {
                  await run({
                    action: "depositWithPermit",
                    amount,
                    assetName: reads.assetName,
                    nonce: reads.assetNonce,
                  });
                }}
              />
            ) : null}
          </div>

          {isAnvilMode ? (
            <div className="faucet-row">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!reads.isConnected || isPending}
                onClick={() =>
                  run({ action: "mintVaultAsset", amount: 100_000n * 10n ** 18n })
                }
              >
                Mint 100k vault mDAI (Anvil)
              </button>
            </div>
          ) : null}

          {status ? <p className="tx-status">{status}</p> : null}
        </>
      )}
    </section>
  );
}
