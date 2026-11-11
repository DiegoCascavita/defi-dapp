"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { hexToSignature } from "viem";
import { abis, contracts, vaultAssetSupportsPermit } from "@/lib/contracts";
import { getActiveChainId } from "@/lib/network";

export type VaultAction =
  | "approveAsset"
  | "deposit"
  | "withdraw"
  | "depositWithPermit"
  | "mintVaultAsset";

type WriteArgs = {
  action: VaultAction;
  amount?: bigint;
  assetName?: string;
  nonce?: bigint;
};

const MAX_UINT256 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export function useVaultWrite(onSettled?: () => void) {
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending, error, reset } =
    useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const receipt = useWaitForTransactionReceipt({ hash });
  const [lastAction, setLastAction] = useState<VaultAction | null>(null);

  const run = useCallback(
    async ({ action, amount, assetName, nonce }: WriteArgs) => {
      if (!address) throw new Error("Connect a wallet first");
      setLastAction(action);

      const vault = contracts.cascadeVault;
      const asset = contracts.vaultAsset;

      switch (action) {
        case "approveAsset":
          await writeContractAsync({
            address: asset,
            abi: abis.erc20,
            functionName: "approve",
            args: [vault, MAX_UINT256],
          });
          break;
        case "deposit":
          await writeContractAsync({
            address: vault,
            abi: abis.cascadeVault,
            functionName: "deposit",
            args: [amount!, address],
          });
          break;
        case "withdraw":
          await writeContractAsync({
            address: vault,
            abi: abis.cascadeVault,
            functionName: "withdraw",
            args: [amount!, address, address],
          });
          break;
        case "depositWithPermit": {
          // Canonical Sepolia WETH has no EIP-2612 — never prompt a useless signature.
          if (!vaultAssetSupportsPermit) {
            throw new Error(
              "Vault asset does not support EIP-2612 permit — use approve + deposit",
            );
          }
          // Refuse silent domain/nonce fallbacks — a wrong EIP-712 name or stale/zero
          // nonce produces a signature that can still be prompted in the wallet.
          if (!assetName?.trim()) {
            throw new Error("Vault asset EIP-712 name not loaded yet — wait and retry");
          }
          if (nonce === undefined) {
            throw new Error("Vault asset permit nonce not loaded yet — wait and retry");
          }
          if (amount === undefined) {
            throw new Error("Permit deposit requires an amount");
          }
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 30);
          const signature = await signTypedDataAsync({
            domain: {
              name: assetName,
              version: "1",
              chainId: getActiveChainId(),
              verifyingContract: asset,
            },
            types: PERMIT_TYPES,
            primaryType: "Permit",
            message: {
              owner: address,
              spender: vault,
              value: amount,
              nonce,
              deadline,
            },
          });
          const { v, r, s } = hexToSignature(signature);
          await writeContractAsync({
            address: vault,
            abi: abis.cascadeVault,
            functionName: "depositWithPermit",
            args: [amount, address, deadline, Number(v), r, s],
          });
          break;
        }
        case "mintVaultAsset":
          await writeContractAsync({
            address: asset,
            abi: abis.erc20,
            functionName: "mint",
            args: [address, amount!],
          });
          break;
      }

      onSettled?.();
    },
    [address, onSettled, signTypedDataAsync, writeContractAsync],
  );

  return {
    run,
    hash,
    isPending: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: error ?? receipt.error,
    lastAction,
    reset,
  };
}
