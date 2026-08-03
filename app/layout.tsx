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
  metadataBase: new URL("https://same-sky-live.vnmoorthy.chatgpt.site"),
  title: {
    default: "Same Sky — One set. Two skies.",
    template: "%s · Same Sky",
  },
  description: "Livestreams transmit video. Same Sky transmits presence—a private festival ritual between one person there and one person anywhere.",
  applicationName: "Same Sky",
  keywords: ["Outside Lands", "music festival", "livestream", "fan connection", "accessibility"],
  openGraph: {
    type: "website",
    title: "Same Sky — One set. Two skies.",
    description: "Livestreams transmit video. Same Sky transmits presence.",
    siteName: "Same Sky",
    images: [{ url: "/hero-festival-v2.png", width: 1536, height: 1024, alt: "Same Sky — one festival moment shared across distance" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Same Sky — One set. Two skies.",
    description: "Livestreams transmit video. Same Sky transmits presence.",
    images: ["/hero-festival-v2.png"],
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
