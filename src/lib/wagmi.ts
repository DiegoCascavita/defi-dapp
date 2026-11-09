"use client";

import { http, createConfig, createStorage, cookieStorage, type CreateConnectorFn } from "wagmi";
import { anvil } from "wagmi/chains";
import { injected } from "wagmi/connectors/injected";
import { anvilLocalWallet } from "./anvilConnector";
import { contracts } from "./contracts";

const connectors: CreateConnectorFn[] = [
  // Local Anvil burner (account #0) — works without MetaMask on cloud VMs.
  anvilLocalWallet,
  injected({ shimDisconnect: true }),
];

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

/**
 * Anvil-first wagmi config.
 * Prefer "Anvil account" when MetaMask is unavailable; injected still covers MetaMask.
 * Set NEXT_PUBLIC_WC_PROJECT_ID to also register WalletConnect.
 */
export const config = createConfig({
  chains: [anvil],
  connectors,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [anvil.id]: http(contracts.rpcUrl),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
