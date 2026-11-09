"use client";

import { useAccount, useReadContracts } from "wagmi";
import { abis, contracts } from "@/lib/contracts";

export function useProtocolReads() {
  const { address, isConnected } = useAccount();

  const market = useReadContracts({
    contracts: [
      {
        address: contracts.lendingPool,
        abi: abis.lendingPool,
        functionName: "getAvailableLiquidity",
      },
      {
        address: contracts.lendingPool,
        abi: abis.lendingPool,
        functionName: "getTotalLiquidity",
      },
      {
        address: contracts.lendingPool,
        abi: abis.lendingPool,
        functionName: "getTotalDebt",
      },
      {
        address: contracts.lendingPool,
        abi: abis.lendingPool,
        functionName: "getTotalCollateral",
      },
    ],
    query: { refetchInterval: 8_000 },
  });

  const position = useReadContracts({
    contracts: address
      ? [
          {
            address: contracts.lendingPool,
            abi: abis.lendingPool,
            functionName: "getCollateralBalance",
            args: [address],
          },
          {
            address: contracts.lendingPool,
            abi: abis.lendingPool,
            functionName: "getDebtBalance",
            args: [address],
          },
          {
            address: contracts.lendingPool,
            abi: abis.lendingPool,
            functionName: "getLiquiditySupplied",
            args: [address],
          },
          {
            address: contracts.lendingPool,
            abi: abis.lendingPool,
            functionName: "getHealthFactor",
            args: [address],
          },
          {
            address: contracts.lendingPool,
            abi: abis.lendingPool,
            functionName: "getAccountInformation",
            args: [address],
          },
          {
            address: contracts.weth,
            abi: abis.erc20,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: contracts.dai,
            abi: abis.erc20,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: contracts.weth,
            abi: abis.erc20,
            functionName: "allowance",
            args: [address, contracts.lendingPool],
          },
          {
            address: contracts.dai,
            abi: abis.erc20,
            functionName: "allowance",
            args: [address, contracts.lendingPool],
          },
        ]
      : [],
    query: { enabled: Boolean(address), refetchInterval: 6_000 },
  });

  const availableLiquidity = market.data?.[0]?.result as bigint | undefined;
  const totalLiquidity = market.data?.[1]?.result as bigint | undefined;
  const totalDebt = market.data?.[2]?.result as bigint | undefined;
  const totalCollateral = market.data?.[3]?.result as bigint | undefined;

  const collateral = position.data?.[0]?.result as bigint | undefined;
  const debt = position.data?.[1]?.result as bigint | undefined;
  const supplied = position.data?.[2]?.result as bigint | undefined;
  const healthFactor = position.data?.[3]?.result as bigint | undefined;
  const accountInfo = position.data?.[4]?.result as
    | readonly [bigint, bigint]
    | undefined;
  const wethBalance = position.data?.[5]?.result as bigint | undefined;
  const daiBalance = position.data?.[6]?.result as bigint | undefined;
  const wethAllowance = position.data?.[7]?.result as bigint | undefined;
  const daiAllowance = position.data?.[8]?.result as bigint | undefined;

  return {
    address,
    isConnected,
    availableLiquidity,
    totalLiquidity,
    totalDebt,
    totalCollateral,
    collateral,
    debt,
    supplied,
    healthFactor,
    debtUsd: accountInfo?.[0],
    collateralUsd: accountInfo?.[1],
    wethBalance,
    daiBalance,
    wethAllowance,
    daiAllowance,
    refetchAll: async () => {
      await Promise.all([market.refetch(), position.refetch()]);
    },
  };
}
