# Cascade Lend (defi-dapp)

Next.js + TypeScript portfolio dApp for the overcollateralized lending market in [DiegoCascavita/defi-lending](https://github.com/DiegoCascavita/defi-lending).

Stack: **wagmi / viem**, injected wallet (MetaMask) + optional WalletConnect, **Anvil** (`31337`, default) or **Sepolia** (`11155111`) via env.

## Cascade Suite

Related DeFi portfolio (stablecoin → lending → UI):

| Repo | Role |
|---|---|
| [defi-stablecoin](https://github.com/DiegoCascavita/defi-stablecoin) | Overcollateralized DSC + `OracleLib` (chapter 1) |
| [defi-lending](https://github.com/DiegoCascavita/defi-lending) | Dual-oracle `LendingPool`, liquidations, Foundry tests |
| [defi-dapp](https://github.com/DiegoCascavita/defi-dapp) (this repo) | Cascade Lend desk — wagmi/viem frontend |

```
defi-stablecoin  →  defi-lending  →  defi-dapp (Cascade Lend)
     DSCEngine         LendingPool         Next.js UI
```

## Features

- Connect wallet (injected; WalletConnect if `NEXT_PUBLIC_WC_PROJECT_ID` is set)
- **Anvil account** local burner (PR #1) when `NEXT_PUBLIC_NETWORK=anvil` (default)
- Supply / withdraw DAI liquidity
- Deposit / withdraw WETH collateral
- Borrow / repay DAI
- Live health factor + USD collateral/debt
- Optional liquidate panel (HF &lt; 1)
- Local Anvil mint helpers for mock WETH / DAI
- Env-driven **Sepolia public mode** (addresses from `NEXT_PUBLIC_*` or `deployments/sepolia.json`)
- Vendored ABIs under `vendor/abis/` + typed copies in `src/lib/abis/`

## Architecture

```
Browser (Cascade Lend)
   │  wagmi / viem
   ▼
LendingPool  ←── dual oracle (Chainlink + secondary)
   ├── WETH collateral
   └── DAI liquidity / debt
```

Addresses load from `deployments/anvil.json` or `deployments/sepolia.json` (chosen by network mode), overridable via `NEXT_PUBLIC_*` (see `.env.example`).

## Prerequisites

1. Node 20+ and npm
2. [Foundry](https://book.getfoundry.sh/getting-started/installation) (`anvil`, `forge`, `cast`) for the protocol
3. A browser wallet (MetaMask for Sepolia; Anvil account works without an extension on local)
4. Clone of [defi-lending](https://github.com/DiegoCascavita/defi-lending) beside this repo (or any path you pass to `sync:anvil`)

## How to run (Anvil — default)

```bash
git clone https://github.com/DiegoCascavita/defi-dapp.git
cd defi-dapp
npm install
cp .env.example .env.local   # optional overrides; leave NETWORK unset for Anvil
npm run dev                  # http://localhost:3000
```

### Forge / Anvil integration

Terminal A — local chain:

```bash
anvil
```

Terminal B — deploy the lending protocol:

```bash
cd ../defi-lending   # or your clone path
forge script script/DeployLending.s.sol:DeployLending \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  -vvvv
```

Terminal C — sync addresses into this dApp:

```bash
cd ../defi-dapp
LENDING_REPO=../defi-lending npm run sync:anvil
# restart npm run dev if it was already running
```

`scripts/sync-anvil-addresses.mjs` reads `broadcast/DeployLending.s.sol/31337/run-latest.json` and rewrites `deployments/anvil.json`.

MetaMask: add network RPC `http://127.0.0.1:8545`, chain id `31337`, currency `ETH`. Import Anvil account #0 if needed:

`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

Or use the in-UI **Anvil account** button (no MetaMask required).

Suggested demo flow in the UI:

1. Connect wallet on Anvil
2. Mint 10 WETH + 100k DAI (faucet buttons)
3. Supply DAI liquidity → deposit WETH collateral → borrow DAI
4. Watch health factor; repay or withdraw; optionally liquidate another account

## Point the UI at Sepolia

Sepolia mode is env-driven. Live Cascade lending addresses ship in `deployments/sepolia.json` (from [defi-lending](https://github.com/DiegoCascavita/defi-lending) Sepolia deploy / PR #3).

| Contract | Address |
|---|---|
| LendingPool | `0x732D2D5E745203eff3a4084d771ceB27B84f665B` |
| WETH (canonical) | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` |
| DAI (ERC20Mock) | `0x3e98D8700FfD75078F918870BA13f32a177a7cbd` |
| Primary ETH/USD (Chainlink) | `0x694AA1769357215DE4FAC081bf1f309aDC325306` |
| Secondary oracle (mock) | `0xaC1F2E02A7bdb40FC3521d6b6Cbffbd6BC6d3c09` |

1. Create `.env.local` for Sepolia (do **not** leave Anvil `NEXT_PUBLIC_*` address vars set — env overrides the JSON file):

```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# Optional overrides (otherwise deployments/sepolia.json is used):
# NEXT_PUBLIC_LENDING_POOL=0x732D2D5E745203eff3a4084d771ceB27B84f665B
# NEXT_PUBLIC_WETH=0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9
# NEXT_PUBLIC_DAI=0x3e98D8700FfD75078F918870BA13f32a177a7cbd
# NEXT_PUBLIC_PRIMARY_FEED=0x694AA1769357215DE4FAC081bf1f309aDC325306
# NEXT_PUBLIC_SECONDARY_ORACLE=0xaC1F2E02A7bdb40FC3521d6b6Cbffbd6BC6d3c09
```

Public env vars only (`NEXT_PUBLIC_*`). Never commit `PRIVATE_KEY`, mnemonics, or write-capable RPC secrets.

2. Restart the Next server (`npm run dev`). The desk subtitle shows **Sepolia · 11155111**; Anvil mint buttons and the Anvil account connector are hidden. A **Sepolia live** banner appears when `contractsConfigured` is true.
3. Connect MetaMask (or WalletConnect) on Sepolia (`11155111`).

Precedence: `NEXT_PUBLIC_*` env wins over `deployments/sepolia.json`.

### Sepolia faucets / tokens

| Asset | Link / notes |
|---|---|
| Sepolia ETH | [Google Cloud Web3 faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) |
| Sepolia ETH | [Alchemy Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia) |
| Sepolia ETH | [Infura faucet](https://www.infura.io/faucet/sepolia) |
| WETH | Canonical Sepolia WETH — wrap ETH with `deposit()` (no `mint`) |
| DAI | Deployed `ERC20Mock` at the address above (see [defi-lending README](https://github.com/DiegoCascavita/defi-lending)) |

In-app **Mint WETH/DAI** buttons are Anvil-only.

## Tests

```bash
# Optional Playwright smoke (install browsers once)
npx playwright install chromium
npm run test:e2e
```

`tests/smoke.spec.ts` asserts the desk panels and connect CTA render. Full wallet E2E against Anvil is left manual (MetaMask or Anvil account).

```bash
npm run lint
npm run build
```

GitHub Actions (`.github/workflows/ci.yml`) runs the same lint + build on every PR to `Master`/`main`, then a Playwright Chromium smoke (`tests/smoke.spec.ts`) against the default Anvil desk env.

## How to try it

1. Install deps: `npm install`.
2. Start Anvil and deploy `defi-lending` with `DeployLending` (commands above).
3. Sync addresses: `LENDING_REPO=../defi-lending npm run sync:anvil`.
4. Start the UI: `npm run dev` → `http://localhost:3000`.
5. Connect with **Anvil account** or MetaMask on chain `31337`.
6. Flow: **Mint** → **Supply DAI** → **Deposit WETH** → **Borrow**; watch health factor.
7. Optional Sepolia: set `NEXT_PUBLIC_NETWORK=sepolia` (and clear Anvil address env overrides); faucet ETH; wrap WETH; no in-app mint.
8. Optional: `npm run test:e2e` for the Playwright smoke.

## Layout

```
src/
  app/                 # Next.js App Router + providers
  components/          # Desk UI (wallet, actions, HF, liquidate)
  hooks/               # Protocol reads / writes
  lib/                 # wagmi, network mode, contracts, formatters, ABIs
vendor/abis/           # JSON ABIs from forge build
deployments/           # anvil.json + sepolia.json (+ examples)
scripts/               # sync-anvil-addresses.mjs
tests/                 # Playwright smoke
```

## Notes

- Protocol ABIs are vendored from `defi-lending` (`forge build` → `out/`). Re-copy when the Solidity API changes.
- Fresh Anvil = new addresses. Always re-sync before demoing.
- Sepolia addresses: see `deployments/sepolia.json` / `sepolia.example.json` (Cascade lending live deploy).
- English UI and docs only. No third-party watermark badges in this repo.
