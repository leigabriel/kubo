import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";
import { IconStudio } from "@/components/explore/IconStudio";

export const metadata: Metadata = {
  title: "UI Icons — Kubo",
  description: "Pixel-art UI icons from the Kubo archive.",
};

export default function UiIconsPage() {
  return (
    <main className="collection-page" id="ui-icons">
      <SiteHeader />
      <PageMotion />

      <div className="component-page-head">
        <p className="collection-kicker">Explore / UI Icons</p>
        <h1 className="collection-title" id="ui-icons-title" data-intro>
          UI Icons
        </h1>
        <p className="collection-note">
          Hand-pixelled 16×16 icons for building websites. Pick a format and
          pixel size, then download or copy the SVG.
        </p>
      </div>

      <IconStudio />

      <p className="component-backline" data-intro>
        <Link className="collection-back" href="/explore">
          Back to all assets <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
