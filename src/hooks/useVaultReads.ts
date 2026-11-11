"use client";

import { useAccount, useReadContracts } from "wagmi";
import { abis, contracts, vaultConfigured } from "@/lib/contracts";

export function useVaultReads() {
  const { address, isConnected } = useAccount();
  const enabled = vaultConfigured;

  const market = useReadContracts({
    contracts: enabled
      ? [
          {
            address: contracts.cascadeVault,
            abi: abis.cascadeVault,
            functionName: "totalAssets",
          },
          {
            address: contracts.cascadeVault,
            abi: abis.cascadeVault,
            functionName: "totalSupply",
          },
          {
            address: contracts.cascadeVault,
            abi: abis.cascadeVault,
            functionName: "withdrawalFeeBps",
          },
          {
            address: contracts.cascadeVault,
            abi: abis.cascadeVault,
            functionName: "asset",
          },
        ]
      : [],
    query: { enabled, refetchInterval: 8_000 },
  });

  const position = useReadContracts({
    contracts:
      enabled && address
        ? [
            {
              address: contracts.cascadeVault,
              abi: abis.cascadeVault,
              functionName: "balanceOf",
              args: [address],
            },
            {
              address: contracts.cascadeVault,
              abi: abis.cascadeVault,
              functionName: "maxWithdraw",
              args: [address],
            },
            {
              address: contracts.vaultAsset,
              abi: abis.erc20,
              functionName: "balanceOf",
              args: [address],
            },
            {
              address: contracts.vaultAsset,
              abi: abis.erc20,
              functionName: "allowance",
              args: [address, contracts.cascadeVault],
            },
            {
              address: contracts.vaultAsset,
              abi: abis.erc20,
              functionName: "nonces",
              args: [address],
            },
            {
              address: contracts.vaultAsset,
              abi: abis.erc20,
              functionName: "name",
            },
          ]
        : [],
    query: { enabled: enabled && Boolean(address), refetchInterval: 6_000 },
  });

  const shares = position.data?.[0]?.result as bigint | undefined;
  const shareAssets =
    shares !== undefined && shares > 0n
      ? undefined // filled below via convert when needed
      : 0n;

  const convert = useReadContracts({
    contracts:
      enabled && shares !== undefined && shares > 0n
        ? [
            {
              address: contracts.cascadeVault,
              abi: abis.cascadeVault,
              functionName: "convertToAssets",
              args: [shares],
            },
          ]
        : [],
    query: {
      enabled: enabled && shares !== undefined && shares > 0n,
      refetchInterval: 6_000,
    },
  });

  return {
    address,
    isConnected,
    configured: vaultConfigured,
    totalAssets: market.data?.[0]?.result as bigint | undefined,
    totalSupply: market.data?.[1]?.result as bigint | undefined,
    withdrawalFeeBps: market.data?.[2]?.result as bigint | undefined,
    assetAddress: (market.data?.[3]?.result as `0x${string}` | undefined) ?? contracts.vaultAsset,
    shares,
    maxWithdraw: position.data?.[1]?.result as bigint | undefined,
    assetBalance: position.data?.[2]?.result as bigint | undefined,
    assetAllowance: position.data?.[3]?.result as bigint | undefined,
    assetNonce: position.data?.[4]?.result as bigint | undefined,
    assetName: position.data?.[5]?.result as string | undefined,
    shareAssets: (convert.data?.[0]?.result as bigint | undefined) ?? shareAssets,
    refetchAll: async () => {
      await Promise.all([market.refetch(), position.refetch(), convert.refetch()]);
    },
  };
}
