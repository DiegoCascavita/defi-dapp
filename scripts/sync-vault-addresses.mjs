#!/usr/bin/env node
/**
 * Parse forge create / DeployVault broadcast from defi-vault and merge vault
 * fields into deployments/anvil.json (preserves lending addresses).
 *
 * Usage:
 *   VAULT_REPO=/path/to/defi-vault npm run sync:vault
 *   npm run sync:vault -- /path/to/defi-vault
 *
 * Requires broadcast/DeployVault.s.sol/31337/run-latest.json (no CREATE-order guesses —
 * those collide with DeployLending mocks on a shared Anvil).
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
  console.error(
    `Broadcast file not found:\n  ${broadcastPath}\n` +
      `Refusing CREATE-order guesses — on a shared Anvil they collide with DeployLending mocks\n` +
      `(and idleStrategy must not reuse primaryFeed). Deploy with forge script --broadcast,\n` +
      `then re-run: VAULT_REPO=… npm run sync:vault`,
  );
  process.exit(1);
}

if (!cascadeVault || !vaultAsset || !idleStrategy) {
  console.error(
    "Broadcast did not include CascadeVault + ERC20Mock/vault asset + IdleStrategy addresses.",
    { cascadeVault, vaultAsset, idleStrategy },
  );
  process.exit(1);
}

if (
  idleStrategy.toLowerCase() === String(existing.primaryFeed || "").toLowerCase() ||
  vaultAsset.toLowerCase() === String(existing.dai || "").toLowerCase() ||
  vaultAsset.toLowerCase() === String(existing.weth || "").toLowerCase()
) {
  console.error(
    "Vault addresses collide with lending deployment fields — deploy vault on this Anvil after lending, then sync the broadcast (do not use fresh-Anvil CREATE-order guesses).",
    { cascadeVault, vaultAsset, idleStrategy, primaryFeed: existing.primaryFeed },
  );
  process.exit(1);
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
