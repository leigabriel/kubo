import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "UI Icons — Kubo",
  description: "UI icons from the Kubo archive.",
};

export default function UiIconsPage() {
  return (
    <main className="collection-page" id="ui-icons">
      <SiteHeader />
      <PageMotion />

      <section
        className="collection-empty"
        aria-labelledby="ui-icons-title"
        data-intro
      >
        <p className="collection-kicker">Explore / UI Icons</p>
        <h1 className="collection-title" id="ui-icons-title">
          UI Icons
        </h1>
        <p className="collection-note">
          Nothing to see here — yet. The icon set is still being catalogued.
        </p>
        <Link className="collection-back" href="/explore">
          Back to all assets <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
