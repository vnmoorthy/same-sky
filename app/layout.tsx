import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://same-sky.chatgpt.site"),
  title: {
    default: "Same Sky — Feel the set from anywhere",
    template: "%s · Same Sky",
  },
  description: "A private, 30-second bridge between someone at Outside Lands and someone watching from home.",
  applicationName: "Same Sky",
  keywords: ["Outside Lands", "music festival", "livestream", "fan connection", "accessibility"],
  openGraph: {
    type: "website",
    title: "Same Sky — Feel the set from anywhere",
    description: "Livestreams transmit video. Same Sky transmits presence.",
    siteName: "Same Sky",
  },
  twitter: {
    card: "summary_large_image",
    title: "Same Sky — Feel the set from anywhere",
    description: "Livestreams transmit video. Same Sky transmits presence.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
