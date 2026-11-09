"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { config } from "@/lib/wagmi";

type ProvidersProps = {
  children: ReactNode;
  cookie?: string | null;
};

export function Providers({ children, cookie }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(config, cookie);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
