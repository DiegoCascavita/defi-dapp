import { formatUnits, parseUnits } from "viem";

const MAX_UINT256 = (1n << 256n) - 1n;

export function parseAmount(value: string, decimals = 18): bigint | null {
  const trimmed = value.trim();
  if (!trimmed || Number.isNaN(Number(trimmed))) return null;
  try {
    return parseUnits(trimmed, decimals);
  } catch {
    return null;
  }
}

export function formatToken(
  value: bigint | undefined,
  decimals = 18,
  digits = 4,
): string {
  if (value === undefined) return "—";
  const raw = formatUnits(value, decimals);
  const [whole, frac = ""] = raw.split(".");
  return `${whole}.${frac.padEnd(digits, "0").slice(0, digits)}`;
}

export function formatUsd(value: bigint | undefined, digits = 2): string {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, 18));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  });
}

/**
 * Health factor is 1e18-scaled. Unbounded (no debt) returns Infinity display.
 */
export function formatHealthFactor(value: bigint | undefined): {
  label: string;
  numeric: number | null;
  tone: "ok" | "warn" | "danger" | "idle";
} {
  if (value === undefined) {
    return { label: "—", numeric: null, tone: "idle" };
  }
  if (value >= MAX_UINT256 / 2n) {
    return { label: "∞", numeric: Number.POSITIVE_INFINITY, tone: "ok" };
  }
  const numeric = Number(formatUnits(value, 18));
  const label = numeric >= 100 ? ">99" : numeric.toFixed(3);
  if (numeric < 1) return { label, numeric, tone: "danger" };
  if (numeric < 1.25) return { label, numeric, tone: "warn" };
  return { label, numeric, tone: "ok" };
}

export function shortenAddress(address: string, size = 4): string {
  return `${address.slice(0, 2 + size)}…${address.slice(-size)}`;
}
