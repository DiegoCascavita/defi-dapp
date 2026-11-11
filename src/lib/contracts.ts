import anvilDeployment from "../../deployments/anvil.json";
import sepoliaDeployment from "../../deployments/sepolia.json";
import { lendingPoolAbi } from "./abis/lendingPool";
import { cascadeVaultAbi } from "./abis/cascadeVault";
import { erc20Abi } from "./abis/erc20";
import { isAnvilMode, isSepoliaMode, networkMode } from "./network";

export type ProtocolDeployment = {
  chainId: number;
  rpcUrl: string;
  lendingPool: `0x${string}`;
  weth: `0x${string}`;
  dai: `0x${string}`;
  primaryFeed: `0x${string}`;
  secondaryOracle: `0x${string}`;
  /** CascadeVault (ERC-4626) — Anvil demo addresses; Sepolia zero until deployed. */
  cascadeVault: `0x${string}`;
  /** Underlying asset for the vault (vault mock DAI on Anvil — not lending DAI). */
  vaultAsset: `0x${string}`;
  idleStrategy: `0x${string}`;
};

const ZERO = "0x0000000000000000000000000000000000000000" as const;

function readEnvAddress(key: string): `0x${string}` | undefined {
  const value = process.env[key];
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as `0x${string}`;
}

function asAddress(value: string | undefined, fallback: `0x${string}`): `0x${string}` {
  if (value && /^0x[a-fA-F0-9]{40}$/.test(value)) return value as `0x${string}`;
  return fallback;
}

const fileDeployment = isSepoliaMode ? sepoliaDeployment : anvilDeployment;

/**
 * Resolve protocol addresses for the active network.
 * Precedence: NEXT_PUBLIC_* env → deployments/{anvil|sepolia}.json.
 * Sepolia ships with live Cascade lending addresses in deployments/sepolia.json;
 * vault fields stay zero until a Sepolia vault deploy (override via NEXT_PUBLIC_*).
 */
export const contracts: ProtocolDeployment = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? fileDeployment.chainId),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? fileDeployment.rpcUrl,
  lendingPool:
    readEnvAddress("NEXT_PUBLIC_LENDING_POOL") ??
    asAddress(fileDeployment.lendingPool, ZERO),
  weth:
    readEnvAddress("NEXT_PUBLIC_WETH") ??
    asAddress(fileDeployment.weth, ZERO),
  dai:
    readEnvAddress("NEXT_PUBLIC_DAI") ?? asAddress(fileDeployment.dai, ZERO),
  primaryFeed:
    readEnvAddress("NEXT_PUBLIC_PRIMARY_FEED") ??
    asAddress(fileDeployment.primaryFeed, ZERO),
  secondaryOracle:
    readEnvAddress("NEXT_PUBLIC_SECONDARY_ORACLE") ??
    asAddress(fileDeployment.secondaryOracle, ZERO),
  cascadeVault:
    readEnvAddress("NEXT_PUBLIC_CASCADE_VAULT") ??
    asAddress(
      "cascadeVault" in fileDeployment
        ? (fileDeployment as { cascadeVault?: string }).cascadeVault
        : undefined,
      ZERO,
    ),
  vaultAsset:
    readEnvAddress("NEXT_PUBLIC_VAULT_ASSET") ??
    asAddress(
      "vaultAsset" in fileDeployment
        ? (fileDeployment as { vaultAsset?: string }).vaultAsset
        : undefined,
      ZERO,
    ),
  idleStrategy:
    readEnvAddress("NEXT_PUBLIC_IDLE_STRATEGY") ??
    asAddress(
      "idleStrategy" in fileDeployment
        ? (fileDeployment as { idleStrategy?: string }).idleStrategy
        : undefined,
      ZERO,
    ),
};

/** True when core market addresses are non-zero (Sepolia JSON or NEXT_PUBLIC_* overrides). */
export const contractsConfigured =
  contracts.lendingPool !== ZERO &&
  contracts.weth !== ZERO &&
  contracts.dai !== ZERO;

/** True when Cascade Vault addresses are wired (Anvil demo or future Sepolia deploy). */
export const vaultConfigured =
  contracts.cascadeVault !== ZERO && contracts.vaultAsset !== ZERO;

export const abis = {
  lendingPool: lendingPoolAbi,
  cascadeVault: cascadeVaultAbi,
  erc20: erc20Abi,
} as const;

export const PROTOCOL = {
  name: "Cascade Lend",
  collateralSymbol: "WETH",
  debtSymbol: "DAI",
  vaultShareSymbol: "cvDAI",
  vaultAssetSymbol: "mDAI",
  liquidationThreshold: 80,
  liquidationBonusBps: 500,
  minHealthFactor: 1,
  networkMode,
  isAnvilMode,
  isSepoliaMode,
} as const;

/** @deprecated Use ProtocolDeployment — kept for call sites that imported AnvilDeployment. */
export type AnvilDeployment = ProtocolDeployment;
