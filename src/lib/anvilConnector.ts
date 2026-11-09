"use client";

import { mock } from "wagmi/connectors/mock";

/**
 * Local Anvil burner via wagmi mock + Anvil's unlocked account #0.
 * eth_sendTransaction is forwarded to the Anvil RPC (no MetaMask required).
 */
export const anvilLocalWallet = mock({
  accounts: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
  features: {
    reconnect: false,
    defaultConnected: false,
  },
});
