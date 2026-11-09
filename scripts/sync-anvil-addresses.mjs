#!/usr/bin/env node
/**
 * Parse forge broadcast output from defi-lending and write deployments/anvil.json.
 *
 * Usage:
 *   LENDING_REPO=/path/to/defi-lending npm run sync:anvil
 *   npm run sync:anvil -- /path/to/defi-lending
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lendingRepo =
  process.argv[2] ||
  process.env.LENDING_REPO ||
  resolve(root, "../defi-lending");

const broadcastPath = join(
  lendingRepo,
  "broadcast/DeployLending.s.sol/31337/run-latest.json",
);

if (!existsSync(broadcastPath)) {
  console.error(
    `Broadcast file not found:\n  ${broadcastPath}\n\nDeploy first:\n  cd ${lendingRepo}\n  forge script script/DeployLending.s.sol:DeployLending --rpc-url http://127.0.0.1:8545 --broadcast`,
  );
  process.exit(1);
}

const broadcast = JSON.parse(readFileSync(broadcastPath, "utf8"));
const txs = broadcast.transactions || [];

const byName = {};
for (const tx of txs) {
  if (tx.contractName && tx.contractAddress) {
    byName[tx.contractName] = tx.contractAddress;
  }
}

// HelperConfig deploys two ERC20Mock instances: WETH then DAI (creation order).
const erc20Mocks = txs
  .filter((tx) => tx.contractName === "ERC20Mock" && tx.contractAddress)
  .map((tx) => tx.contractAddress);

const deployment = {
  chainId: 31337,
  rpcUrl: "http://127.0.0.1:8545",
  lendingPool: byName.LendingPool || null,
  weth: erc20Mocks[0] || null,
  dai: erc20Mocks[1] || null,
  primaryFeed: byName.MockV3Aggregator || null,
  secondaryOracle: byName.MockSecondaryOracle || null,
  deployedAt: new Date().toISOString(),
  source: broadcastPath,
};

const outPath = join(root, "deployments/anvil.json");
writeFileSync(outPath, `${JSON.stringify(deployment, null, 2)}\n`);
console.log(`Wrote ${outPath}`);
console.log(deployment);
