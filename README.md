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

Sepolia mode is env-driven. Placeholder zeros in `deployments/sepolia.json` are intentional until [defi-lending](https://github.com/DiegoCascavita/defi-lending) lands a verified Sepolia deploy — then plug addresses without hardcoding secrets.

1. Copy env and switch network:

```bash
cp .env.example .env.local
```

In `.env.local`:

```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# After lending Sepolia verify — fill these (or edit deployments/sepolia.json):
NEXT_PUBLIC_LENDING_POOL=0x...
NEXT_PUBLIC_WETH=0x...
NEXT_PUBLIC_DAI=0x...
NEXT_PUBLIC_PRIMARY_FEED=0x...
NEXT_PUBLIC_SECONDARY_ORACLE=0x...
```

2. Restart the Next server (`npm run dev`). The desk subtitle shows **Sepolia · 11155111**; Anvil mint buttons and the Anvil account connector are hidden.
3. Connect MetaMask (or WalletConnect) on Sepolia. If addresses are still zero, the UI shows a placeholder status banner — protocol calls will fail until deploy addresses are set.

Precedence: `NEXT_PUBLIC_*` env wins over `deployments/sepolia.json`. Prefer env or JSON file updates; never commit private keys.

### Sepolia faucets

| Asset | Link |
|---|---|
| Sepolia ETH | [Google Cloud Web3 faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) |
| Sepolia ETH | [Alchemy Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia) |
| Sepolia ETH | [Infura faucet](https://www.infura.io/faucet/sepolia) |
| Test tokens | After protocol deploy, use whatever mock/token the lending README documents (or Uniswap Sepolia pools if using public WETH/DAI) |

In-app **Mint WETH/DAI** buttons are Anvil-only (mock ERC20s). On Sepolia, fund the wallet from faucets / the protocol’s documented token path.

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

## Cómo probar

1. Instala dependencias: `npm install`.
2. Levanta Anvil y despliega `defi-lending` con el script `DeployLending` (comandos arriba).
3. Sincroniza direcciones: `LENDING_REPO=../defi-lending npm run sync:anvil`.
4. Arranca la UI: `npm run dev` y abre `http://localhost:3000`.
5. Conecta con **Anvil account** o MetaMask en red 31337.
6. Usa **Mint** → **Supply DAI** → **Deposit WETH** → **Borrow**; revisa el health factor.
7. (Opcional Sepolia) configura `NEXT_PUBLIC_NETWORK=sepolia` + addresses; faucet ETH; sin mint in-app.
8. (Opcional) `npm run test:e2e` para el smoke de Playwright.

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
- Sepolia placeholders: replace after `forge script … --broadcast --verify` on lending; see `deployments/sepolia.example.json`.
- English comments only. No third-party watermark badges in this repo.
