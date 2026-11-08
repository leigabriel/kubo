import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PixelGrid } from "@/components/layout/PixelGrid";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "Pixel Playground — Kubo",
  description:
    "A full-page pixel art playground for drawing, erasing, and experimenting with color.",
};

export default function PixelPlaygroundPage() {
  return (
    <main className="pixel-playground-page" id="pixel-playground">
      <SiteHeader />
      <PageMotion />

      <section
        className="pixel-playground"
        aria-labelledby="pixel-playground-title"
      >
        <div className="pixel-playground-intro">
          <h1 id="pixel-playground-title">Pixel Playground</h1>
          <p>
            Pick a color and draw. Drag to paint, or use the arrow keys and
            Enter.
          </p>
        </div>

        <PixelGrid describedBy="pixel-playground-help" />

        <p className="sr-only" id="pixel-playground-help">
          Use the palette to choose a color. Select a cell to paint it. Use the
          arrow keys to move between cells, and Enter or Space to paint. Choose
          Erase to remove color, or Clear to reset the canvas.
        </p>
      </section>
    </main>
  );
}
