import { anvil, sepolia, type Chain } from "wagmi/chains";

export type NetworkMode = "anvil" | "sepolia";

const SEPOLIA_ID = sepolia.id;
const ANVIL_ID = anvil.id;

/**
 * Active UI network: env-driven.
 * - NEXT_PUBLIC_NETWORK=sepolia|anvil (preferred)
 * - else NEXT_PUBLIC_CHAIN_ID=11155111 → sepolia
 * - default: anvil (local desk; PR #1 path unchanged)
 */
export function resolveNetworkMode(): NetworkMode {
  const named = (process.env.NEXT_PUBLIC_NETWORK ?? "").trim().toLowerCase();
  if (named === "sepolia") return "sepolia";
  if (named === "anvil" || named === "local") return "anvil";

  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  if (chainId === SEPOLIA_ID) return "sepolia";
  if (chainId === ANVIL_ID) return "anvil";

  return "anvil";
}

export const networkMode: NetworkMode = resolveNetworkMode();

export const isAnvilMode = networkMode === "anvil";
export const isSepoliaMode = networkMode === "sepolia";

export function getActiveChain(): Chain {
  return isSepoliaMode ? sepolia : anvil;
}

export type ActiveChainId = typeof anvil.id | typeof sepolia.id;

export function getActiveChainId(): ActiveChainId {
  return isSepoliaMode ? sepolia.id : anvil.id;
}

export function networkLabel(mode: NetworkMode = networkMode): string {
  return mode === "sepolia" ? "Sepolia" : "Anvil";
}
