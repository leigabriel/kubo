import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "Components — Kubo",
  description: "Interface components from the Kubo archive.",
};

export default function ComponentsPage() {
  return (
    <main className="collection-page" id="components">
      <SiteHeader />
      <PageMotion />

      <section
        className="collection-empty"
        aria-labelledby="components-title"
        data-intro
      >
        <p className="collection-kicker">Explore / Components</p>
        <h1 className="collection-title" id="components-title">
          Components
        </h1>
        <p className="collection-note">
          Nothing to see here — yet. Components are still being assembled.
        </p>
        <Link className="collection-back" href="/explore">
          Back to all assets <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
