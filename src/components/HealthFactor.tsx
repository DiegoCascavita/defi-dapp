"use client";

import { formatHealthFactor, formatUsd } from "@/lib/format";

type HealthFactorProps = {
  healthFactor?: bigint;
  collateralUsd?: bigint;
  debtUsd?: bigint;
};

export function HealthFactor({
  healthFactor,
  collateralUsd,
  debtUsd,
}: HealthFactorProps) {
  const hf = formatHealthFactor(healthFactor);
  const progress =
    hf.numeric === null
      ? 0
      : hf.numeric === Number.POSITIVE_INFINITY
        ? 100
        : Math.max(4, Math.min(100, (hf.numeric / 2) * 100));

  return (
    <section className="health-panel reveal delay-2" aria-label="Health factor">
      <div className="section-kicker">Risk</div>
      <h2 className="section-title">Health factor</h2>
      <p className="section-copy">
        Liquidatable below 1.0. Threshold 80% ≈ 125% collateralization.
      </p>

      <div className={`hf-meter tone-${hf.tone}`}>
        <div className="hf-ring" style={{ ["--hf" as string]: `${progress}%` }}>
          <span className="hf-value">{hf.label}</span>
        </div>
        <dl className="hf-stats">
          <div>
            <dt>Collateral</dt>
            <dd>{formatUsd(collateralUsd)}</dd>
          </div>
          <div>
            <dt>Debt</dt>
            <dd>{formatUsd(debtUsd)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              {hf.tone === "danger"
                ? "Liquidatable"
                : hf.tone === "warn"
                  ? "Near threshold"
                  : hf.tone === "ok"
                    ? "Healthy"
                    : "No position"}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
