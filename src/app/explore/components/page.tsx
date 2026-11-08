import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DiscSleeve } from "@/components/explore/DiscSleeve";
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

      <div className="component-page-head">
        <p className="collection-kicker">Explore / Components</p>
        <h1 className="collection-title" id="components-title" data-intro>
          Components
        </h1>
        <p className="collection-note">
          Ship-ready interface pieces from the archive. First up — the Kubo
          Disc Sleeve in React, Vue, Angular, Svelte, and plain HTML.
        </p>
      </div>

      <DiscSleeve />

      <p className="component-backline" data-intro>
        <Link className="collection-back" href="/explore">
          Back to all assets <span aria-hidden="true">↗</span>
        </Link>
      </p>

      <SiteFooter />
    </main>
  );
}
