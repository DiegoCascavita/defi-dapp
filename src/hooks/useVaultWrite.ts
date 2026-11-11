"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { hexToSignature } from "viem";
import { abis, contracts } from "@/lib/contracts";
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
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 30);
          const name = assetName || "Mock DAI";
          const signature = await signTypedDataAsync({
            domain: {
              name,
              version: "1",
              chainId: getActiveChainId(),
              verifyingContract: asset,
            },
            types: PERMIT_TYPES,
            primaryType: "Permit",
            message: {
              owner: address,
              spender: vault,
              value: amount!,
              nonce: nonce ?? 0n,
              deadline,
            },
          });
          const { v, r, s } = hexToSignature(signature);
          await writeContractAsync({
            address: vault,
            abi: abis.cascadeVault,
            functionName: "depositWithPermit",
            args: [amount!, address, deadline, Number(v), r, s],
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
