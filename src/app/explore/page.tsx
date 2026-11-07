import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AssetGrid } from "@/components/explore/AssetGrid";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "Explore Assets — Kubo",
  description: "Browse the Kubo digital asset collection.",
};

export default function ExplorePage() {
  return (
    <main className="explore-page" id="explore">
      <SiteHeader />
      <AssetGrid />
      <PageMotion />
    </main>
  );
}
