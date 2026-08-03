import type { Metadata } from "next";
import { SameSkyApp } from "./same-sky-app";

export const metadata: Metadata = {
  title: {
    absolute: "Same Sky — One set. Two skies.",
  },
  description: "Livestreams transmit video. Same Sky transmits presence—a private festival ritual between one person there and one person anywhere.",
};

export default function Home() {
  return <SameSkyApp />;
}
