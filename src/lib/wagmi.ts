"use client";

import { http, createConfig, createStorage, cookieStorage, type CreateConnectorFn } from "wagmi";
import { anvil, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors/injected";
import { anvilLocalWallet } from "./anvilConnector";
import { contracts } from "./contracts";
import { isAnvilMode, isSepoliaMode } from "./network";

const connectors: CreateConnectorFn[] = [];

// Local Anvil burner (account #0) — Anvil mode only; keeps PR #1 path intact.
if (isAnvilMode) {
  connectors.push(anvilLocalWallet);
}

connectors.push(injected({ shimDisconnect: true }));

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
if (wcProjectId) {
  // Lazy path keeps WalletConnect out of the default Anvil bundle unless configured.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { walletConnect } = require("wagmi/connectors/walletConnect") as typeof import("wagmi/connectors/walletConnect");
  connectors.push(
    walletConnect({
      projectId: wcProjectId,
      showQrModal: true,
      metadata: {
        name: "Cascade Lend",
        description: "Overcollateralized lending desk against LendingPool",
        url: "https://github.com/DiegoCascavita/defi-dapp",
        icons: [],
      },
    }),
  );
}

const anvilRpc = isAnvilMode ? contracts.rpcUrl : "http://127.0.0.1:8545";
const sepoliaRpc = isSepoliaMode
  ? contracts.rpcUrl
  : "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Env-driven wagmi config (Anvil + Sepolia registered).
 * Default desk target is Anvil (31337). Set NEXT_PUBLIC_NETWORK=sepolia
 * (or CHAIN_ID=11155111) to connect/switch to Sepolia with NEXT_PUBLIC_*
 * / deployments/sepolia.json addresses. Anvil account connector stays Anvil-only.
 */
export const config = createConfig({
  chains: isSepoliaMode ? [sepolia, anvil] : [anvil, sepolia],
  connectors,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [anvil.id]: http(anvilRpc),
    [sepolia.id]: http(sepoliaRpc),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
