"use client";

import { formatToken } from "@/lib/format";
import { contracts, PROTOCOL } from "@/lib/contracts";
import { shortenAddress } from "@/lib/format";

type MarketOverviewProps = {
  availableLiquidity?: bigint;
  totalLiquidity?: bigint;
  totalDebt?: bigint;
  totalCollateral?: bigint;
  collateral?: bigint;
  debt?: bigint;
  supplied?: bigint;
  wethBalance?: bigint;
  daiBalance?: bigint;
};

export function MarketOverview(props: MarketOverviewProps) {
  return (
    <section className="overview-panel reveal delay-1" aria-label="Market overview">
      <div className="section-kicker">Market</div>
      <h2 className="section-title">Pool pulse</h2>
      <p className="section-copy">
        {PROTOCOL.collateralSymbol} collateral · {PROTOCOL.debtSymbol} liquidity · dual
        oracle priced.
      </p>

      <div className="stat-grid">
        <article>
          <h3>Available liquidity</h3>
          <p className="stat-value">{formatToken(props.availableLiquidity)} DAI</p>
        </article>
        <article>
          <h3>Total supplied</h3>
          <p className="stat-value">{formatToken(props.totalLiquidity)} DAI</p>
        </article>
        <article>
          <h3>Total debt</h3>
          <p className="stat-value">{formatToken(props.totalDebt)} DAI</p>
        </article>
        <article>
          <h3>Total collateral</h3>
          <p className="stat-value">{formatToken(props.totalCollateral)} WETH</p>
        </article>
      </div>

      <div className="position-strip">
        <div>
          <span>Your collateral</span>
          <strong>{formatToken(props.collateral)} WETH</strong>
        </div>
        <div>
          <span>Your debt</span>
          <strong>{formatToken(props.debt)} DAI</strong>
        </div>
        <div>
          <span>Your supply</span>
          <strong>{formatToken(props.supplied)} DAI</strong>
        </div>
        <div>
          <span>Wallet</span>
          <strong>
            {formatToken(props.wethBalance)} WETH · {formatToken(props.daiBalance)} DAI
          </strong>
        </div>
      </div>

      <p className="mono address-line">
        Pool {shortenAddress(contracts.lendingPool, 6)} · WETH{" "}
        {shortenAddress(contracts.weth, 4)} · DAI {shortenAddress(contracts.dai, 4)}
      </p>
    </section>
  );
}
