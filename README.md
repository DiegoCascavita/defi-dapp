# Cascade Lend (defi-dapp)

Next.js + TypeScript portfolio dApp for the overcollateralized lending market in [DiegoCascavita/defi-lending](https://github.com/DiegoCascavita/defi-lending).

Stack: **wagmi / viem**, injected wallet (MetaMask) + optional WalletConnect, Anvil (`chainId` 31337).

## Features

- Connect wallet (injected; WalletConnect if `NEXT_PUBLIC_WC_PROJECT_ID` is set)
- Supply / withdraw DAI liquidity
- Deposit / withdraw WETH collateral
- Borrow / repay DAI
- Live health factor + USD collateral/debt
- Optional liquidate panel (HF &lt; 1)
- Local Anvil mint helpers for mock WETH / DAI
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

Addresses load from `deployments/anvil.json`, overridable via `NEXT_PUBLIC_*` (see `.env.example`).

## Prerequisites

1. Node 20+ and npm
2. [Foundry](https://book.getfoundry.sh/getting-started/installation) (`anvil`, `forge`, `cast`) for the protocol
3. A browser wallet that can add **Localhost 8545** / chain id **31337**
4. Clone of [defi-lending](https://github.com/DiegoCascavita/defi-lending) beside this repo (or any path you pass to `sync:anvil`)

## How to run

```bash
git clone https://github.com/DiegoCascavita/defi-dapp.git
cd defi-dapp
npm install
cp .env.example .env.local   # optional overrides
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

Suggested demo flow in the UI:

1. Connect wallet on Anvil
2. Mint 10 WETH + 100k DAI (faucet buttons)
3. Supply DAI liquidity → deposit WETH collateral → borrow DAI
4. Watch health factor; repay or withdraw; optionally liquidate another account

## Tests

```bash
# Optional Playwright smoke (install browsers once)
npx playwright install chromium
npm run test:e2e
```

`tests/smoke.spec.ts` asserts the desk panels and connect CTA render. Full wallet E2E against Anvil is left manual (MetaMask).

```bash
npm run lint
npm run build
```

## Cómo probar

1. Instala dependencias: `npm install`.
2. Levanta Anvil y despliega `defi-lending` con el script `DeployLending` (comandos arriba).
3. Sincroniza direcciones: `LENDING_REPO=../defi-lending npm run sync:anvil`.
4. Arranca la UI: `npm run dev` y abre `http://localhost:3000`.
5. En MetaMask, red local 31337; conecta la cuenta de Anvil.
6. Usa **Mint** → **Supply DAI** → **Deposit WETH** → **Borrow**; revisa el health factor.
7. (Opcional) `npm run test:e2e` para el smoke de Playwright.

## Layout

```
src/
  app/                 # Next.js App Router + providers
  components/          # Desk UI (wallet, actions, HF, liquidate)
  hooks/               # Protocol reads / writes
  lib/                 # wagmi config, contracts, formatters, ABIs
vendor/abis/           # JSON ABIs from forge build
deployments/           # anvil.json + example
scripts/               # sync-anvil-addresses.mjs
tests/                 # Playwright smoke
```

## Notes

- Protocol ABIs are vendored from `defi-lending` (`forge build` → `out/`). Re-copy when the Solidity API changes.
- Fresh Anvil = new addresses. Always re-sync before demoing.
- English comments only. No third-party watermark badges in this repo.
