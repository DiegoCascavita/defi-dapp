"use client";

import { ConnectWallet } from "./ConnectWallet";
import { HealthFactor } from "./HealthFactor";
import { LiquidatePanel } from "./LiquidatePanel";
import { MarketActions } from "./MarketActions";
import { MarketOverview } from "./MarketOverview";
import { VaultPanel } from "./VaultPanel";
import { contracts, contractsConfigured } from "@/lib/contracts";
import { getActiveChainId, isAnvilMode, isSepoliaMode, networkLabel } from "@/lib/network";
import { useProtocolReads } from "@/hooks/useProtocolReads";

export function LendingDesk() {
  const reads = useProtocolReads();
  const chainId = getActiveChainId();
  const label = networkLabel();

  return (
    <div className="desk">
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">Cascade Lend</p>
            <p className="brand-sub">
              {label} desk · LendingPool · {chainId}
            </p>
          </div>
        </div>
        <ConnectWallet />
      </header>

      <section className="hero">
        <div className="hero-copy reveal">
          <p className="eyebrow">Portfolio project 3</p>
          <h1 className="brand-hero">Cascade Lend</h1>
          <p className="lede">
            Connect a wallet, post WETH, borrow DAI against a dual-oracle health factor —
            wired to the Foundry lending market on {isSepoliaMode ? "Sepolia" : "local Anvil"}.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#desk">
              Open desk
            </a>
            <a
              className="btn btn-ghost"
              href="https://github.com/DiegoCascavita/defi-lending"
              target="_blank"
              rel="noreferrer"
            >
              Protocol repo
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="hero-slab">
            <span>HF</span>
            <strong>1.25×</strong>
            <em>liquidation threshold band</em>
          </div>
        </div>
      </section>

      {isSepoliaMode ? (
        contractsConfigured ? (
          <p className="tx-status" role="status">
            Sepolia live — reading{" "}
            <code>
              {contracts.lendingPool.slice(0, 6)}…{contracts.lendingPool.slice(-4)}
            </code>{" "}
            (LendingPool). Mint is Anvil-only; wrap ETH for WETH and use the mock DAI from the
            deploy — see README.
          </p>
        ) : (
          <p className="tx-status" role="status">
            Sepolia addresses are still placeholders. Set{" "}
            <code>NEXT_PUBLIC_LENDING_POOL</code> / <code>WETH</code> / <code>DAI</code> (and
            oracle feeds) or update <code>deployments/sepolia.json</code> — see README.
          </p>
        )
      ) : null}

      <div id="desk" className="desk-grid">
        <MarketOverview
          availableLiquidity={reads.availableLiquidity}
          totalLiquidity={reads.totalLiquidity}
          totalDebt={reads.totalDebt}
          totalCollateral={reads.totalCollateral}
          collateral={reads.collateral}
          debt={reads.debt}
          supplied={reads.supplied}
          wethBalance={reads.wethBalance}
          daiBalance={reads.daiBalance}
        />
        <HealthFactor
          healthFactor={reads.healthFactor}
          collateralUsd={reads.collateralUsd}
          debtUsd={reads.debtUsd}
        />
        <MarketActions
          connected={reads.isConnected}
          onRefresh={reads.refetchAll}
          balances={{
            wethBalance: reads.wethBalance,
            daiBalance: reads.daiBalance,
            wethAllowance: reads.wethAllowance,
            daiAllowance: reads.daiAllowance,
            collateral: reads.collateral,
            debt: reads.debt,
            supplied: reads.supplied,
            availableLiquidity: reads.availableLiquidity,
          }}
        />
        <LiquidatePanel
          connected={reads.isConnected}
          daiAllowance={reads.daiAllowance}
          onRefresh={reads.refetchAll}
        />
        <VaultPanel />
      </div>

      <footer className="site-footer">
        <p>
          Cascade Suite:{" "}
          <a href="https://github.com/DiegoCascavita/defi-stablecoin">defi-stablecoin</a>
          {" → "}
          <a href="https://github.com/DiegoCascavita/defi-lending">defi-lending</a>
          {" → "}
          defi-dapp
          {" → "}
          <a href="https://github.com/DiegoCascavita/defi-vault">defi-vault</a>
          . wagmi/viem · {label} ({chainId})
          {isAnvilMode ? " · Anvil account connector available" : ""}.
        </p>
      </footer>
    </div>
  );
}
