import type { Metadata } from "next";
import { SameSkyApp } from "./same-sky-app";

export const metadata: Metadata = {
  title: "Same Sky — Feel the set from anywhere",
  description: "A private, 30-second bridge between someone at Outside Lands and someone watching from home.",
};

export default function Home() {
  return <SameSkyApp />;
}
