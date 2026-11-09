import deployment from "../../deployments/anvil.json";
import { lendingPoolAbi } from "./abis/lendingPool";
import { erc20Abi } from "./abis/erc20";

export type AnvilDeployment = {
  chainId: number;
  rpcUrl: string;
  lendingPool: `0x${string}`;
  weth: `0x${string}`;
  dai: `0x${string}`;
  primaryFeed: `0x${string}`;
  secondaryOracle: `0x${string}`;
};

function readEnvAddress(key: string): `0x${string}` | undefined {
  const value = process.env[key];
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as `0x${string}`;
}

/**
 * Resolve protocol addresses: env overrides win, then deployments/anvil.json.
 * After every Anvil restart, re-run `npm run sync:anvil` or set NEXT_PUBLIC_* vars.
 */
export const contracts: AnvilDeployment = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? deployment.chainId),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? deployment.rpcUrl,
  lendingPool:
    readEnvAddress("NEXT_PUBLIC_LENDING_POOL") ??
    (deployment.lendingPool as `0x${string}`),
  weth:
    readEnvAddress("NEXT_PUBLIC_WETH") ?? (deployment.weth as `0x${string}`),
  dai: readEnvAddress("NEXT_PUBLIC_DAI") ?? (deployment.dai as `0x${string}`),
  primaryFeed:
    readEnvAddress("NEXT_PUBLIC_PRIMARY_FEED") ??
    (deployment.primaryFeed as `0x${string}`),
  secondaryOracle:
    readEnvAddress("NEXT_PUBLIC_SECONDARY_ORACLE") ??
    (deployment.secondaryOracle as `0x${string}`),
};

export const abis = {
  lendingPool: lendingPoolAbi,
  erc20: erc20Abi,
} as const;

export const PROTOCOL = {
  name: "Cascade Lend",
  collateralSymbol: "WETH",
  debtSymbol: "DAI",
  liquidationThreshold: 80,
  liquidationBonusBps: 500,
  minHealthFactor: 1,
} as const;
