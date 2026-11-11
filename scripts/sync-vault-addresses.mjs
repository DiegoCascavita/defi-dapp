#!/usr/bin/env node
/**
 * Parse forge create / DeployVault broadcast from defi-vault and merge vault
 * fields into deployments/anvil.json (preserves lending addresses).
 *
 * Usage:
 *   VAULT_REPO=/path/to/defi-vault npm run sync:vault
 *   npm run sync:vault -- /path/to/defi-vault
 *
 * Prefers broadcast/DeployVault.s.sol/31337/run-latest.json when present.
 * Falls back to CREATE-order addresses from a manual forge create sequence:
 *   ERC20Mock (vault asset) → CascadeVault → IdleStrategy
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vaultRepo =
  process.argv[2] ||
  process.env.VAULT_REPO ||
  resolve(root, "../defi-vault");

const broadcastPath = join(
  vaultRepo,
  "broadcast/DeployVault.s.sol/31337/run-latest.json",
);

const outPath = join(root, "deployments/anvil.json");
const existing = existsSync(outPath)
  ? JSON.parse(readFileSync(outPath, "utf8"))
  : {
      chainId: 31337,
      rpcUrl: "http://127.0.0.1:8545",
    };

let cascadeVault = null;
let vaultAsset = null;
let idleStrategy = null;
let source = broadcastPath;

if (existsSync(broadcastPath)) {
  const broadcast = JSON.parse(readFileSync(broadcastPath, "utf8"));
  const txs = broadcast.transactions || [];
  const byName = {};
  for (const tx of txs) {
    if (tx.contractName && tx.contractAddress) {
      byName[tx.contractName] = tx.contractAddress;
    }
  }
  const erc20Mocks = txs
    .filter((tx) => tx.contractName === "ERC20Mock" && tx.contractAddress)
    .map((tx) => tx.contractAddress);

  cascadeVault = byName.CascadeVault || null;
  idleStrategy = byName.IdleStrategy || null;
  vaultAsset = erc20Mocks[0] || byName.ERC20Mock || null;
} else {
  console.warn(
    `Broadcast file not found:\n  ${broadcastPath}\n` +
      `Using documented CREATE-order placeholders for a vault-only Anvil deploy.\n` +
      `Deploy then re-run, or pass VAULT_REPO after forge script --broadcast.`,
  );
  // Fresh Anvil CREATE order for: ERC20Mock → CascadeVault → IdleStrategy
  vaultAsset = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  cascadeVault = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  idleStrategy = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  source = "CREATE-order placeholders (vault-only Anvil); re-run after DeployVault broadcast";
}

const deployment = {
  ...existing,
  chainId: 31337,
  rpcUrl: existing.rpcUrl || "http://127.0.0.1:8545",
  cascadeVault,
  vaultAsset,
  idleStrategy,
  vaultSyncedAt: new Date().toISOString(),
  vaultSource: source,
};

writeFileSync(outPath, `${JSON.stringify(deployment, null, 2)}\n`);
console.log(`Wrote vault fields → ${outPath}`);
console.log({
  cascadeVault,
  vaultAsset,
  idleStrategy,
  source,
});
