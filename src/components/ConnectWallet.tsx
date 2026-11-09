"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { anvil } from "wagmi/chains";
import { shortenAddress } from "@/lib/format";

export function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="connect-slot" aria-hidden />;
  }

  if (isConnected && address) {
    const wrongNetwork = chainId !== anvil.id;
    return (
      <div className="wallet-bar">
        {wrongNetwork ? (
          <button
            type="button"
            className="btn btn-warn"
            onClick={() => switchChain({ chainId: anvil.id })}
          >
            Switch to Anvil
          </button>
        ) : (
          <span className="pill mono">{shortenAddress(address)}</span>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => connect({ connector, chainId: anvil.id })}
        >
          {connector.name === "Injected" ? "Connect wallet" : connector.name}
        </button>
      ))}
      {error ? <p className="form-error">{error.message}</p> : null}
    </div>
  );
}
