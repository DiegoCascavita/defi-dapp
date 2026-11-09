import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Syne, Manrope, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cascade Lend · DeFi dApp",
  description:
    "Next.js + wagmi desk for the DiegoCascavita lending pool: supply, collateral, borrow, repay, health factor, liquidate.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
        <Providers cookie={cookieStore.toString()}>{children}</Providers>
      </body>
    </html>
  );
}
