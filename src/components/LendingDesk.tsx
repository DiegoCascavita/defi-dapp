"use client";

import { ConnectWallet } from "./ConnectWallet";
import { HealthFactor } from "./HealthFactor";
import { LiquidatePanel } from "./LiquidatePanel";
import { MarketActions } from "./MarketActions";
import { MarketOverview } from "./MarketOverview";
import { useProtocolReads } from "@/hooks/useProtocolReads";

export function LendingDesk() {
  const reads = useProtocolReads();

  return (
    <div className="desk">
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">Cascade Lend</p>
            <p className="brand-sub">Anvil desk · LendingPool</p>
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
            wired to the Foundry lending market on local Anvil.
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
      </div>

      <footer className="site-footer">
        <p>
          Sibling protocol{" "}
          <a href="https://github.com/DiegoCascavita/defi-lending">defi-lending</a>. UI
          talks over wagmi/viem · chain 31337.
        </p>
      </footer>
    </div>
  );
}
