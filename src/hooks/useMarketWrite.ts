"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { abis, contracts } from "@/lib/contracts";

export type MarketAction =
  | "approveWeth"
  | "approveDai"
  | "depositCollateral"
  | "withdrawCollateral"
  | "supplyLiquidity"
  | "withdrawLiquidity"
  | "borrow"
  | "repay"
  | "liquidate"
  | "mintWeth"
  | "mintDai";

type WriteArgs = {
  action: MarketAction;
  amount?: bigint;
  borrower?: `0x${string}`;
};

const MAX_UINT256 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

export function useMarketWrite(onSettled?: () => void) {
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending, error, reset } =
    useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const [lastAction, setLastAction] = useState<MarketAction | null>(null);

  const run = useCallback(
    async ({ action, amount, borrower }: WriteArgs) => {
      if (!address) throw new Error("Connect a wallet first");
      setLastAction(action);

      const pool = contracts.lendingPool;

      switch (action) {
        case "approveWeth":
          await writeContractAsync({
            address: contracts.weth,
            abi: abis.erc20,
            functionName: "approve",
            args: [pool, MAX_UINT256],
          });
          break;
        case "approveDai":
          await writeContractAsync({
            address: contracts.dai,
            abi: abis.erc20,
            functionName: "approve",
            args: [pool, MAX_UINT256],
          });
          break;
        case "depositCollateral":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "depositCollateral",
            args: [amount!],
          });
          break;
        case "withdrawCollateral":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "withdrawCollateral",
            args: [amount!],
          });
          break;
        case "supplyLiquidity":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "supplyLiquidity",
            args: [amount!],
          });
          break;
        case "withdrawLiquidity":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "withdrawLiquidity",
            args: [amount!],
          });
          break;
        case "borrow":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "borrow",
            args: [amount!],
          });
          break;
        case "repay":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "repay",
            args: [amount!],
          });
          break;
        case "liquidate":
          await writeContractAsync({
            address: pool,
            abi: abis.lendingPool,
            functionName: "liquidate",
            args: [borrower!, amount!],
          });
          break;
        case "mintWeth":
          await writeContractAsync({
            address: contracts.weth,
            abi: abis.erc20,
            functionName: "mint",
            args: [address, amount!],
          });
          break;
        case "mintDai":
          await writeContractAsync({
            address: contracts.dai,
            abi: abis.erc20,
            functionName: "mint",
            args: [address, amount!],
          });
          break;
      }

      onSettled?.();
    },
    [address, onSettled, writeContractAsync],
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
