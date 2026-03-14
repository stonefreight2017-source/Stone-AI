import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Stone AI — Local-First AI Chat",
    template: "%s | Stone AI",
  },
  description:
    "Private, fast AI chat powered by local GPU inference. No data leaves your infrastructure unless you choose.",
  openGraph: {
    title: "Stone AI — Local-First AI Chat",
    description:
      "Private, fast AI chat powered by local GPU inference. 42 specialized AI agents. No data leaves your infrastructure unless you choose.",
    url: "https://stone-ai.net",
    siteName: "Stone AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stone AI — Local-First AI Chat",
    description:
      "Private, fast AI chat powered by local GPU inference. 42 specialized AI agents.",
  },
  metadataBase: new URL("https://stone-ai.net"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
          suppressHydrationWarning
        >
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-[9999] focus:top-4 focus:left-4 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg">
            Skip to main content
          </a>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster />
          <Analytics />
          <SpeedInsights />
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
