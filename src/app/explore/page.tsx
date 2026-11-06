import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AssetGrid } from "@/components/explore/AssetGrid";

export const metadata: Metadata = {
  title: "Explore Assets — Kubo",
  description: "Browse the Kubo digital asset collection.",
};

export default function ExplorePage() {
  return (
    <main className="explore-page" id="explore">
      <SiteHeader />
      <div className="explore-subnav" aria-label="Collection">
        <span>
          <Link href="/explore" aria-current="page">
            Grid
          </Link>
          {"  /  "}
          <Link href="/explore">Gallery</Link>
          {"  /  "}
          <Link href="/explore">List</Link>
        </span>
      </div>
      <AssetGrid />
    </main>
  );
}
