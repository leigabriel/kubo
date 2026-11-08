import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "Wallpapers — Kubo",
  description: "Wallpapers from the Kubo archive.",
};

const wallpaperLabels = [
  "Position",
  "Advance",
  "Strike",
  "Turn",
  "Shift",
  "Hold",
  "Release",
  "Block",
  "Pause",
  "Power",
  "Withdraw",
  "Move",
];

const wallpaperSlots = Array.from({ length: 33 }, (_, index) => ({
  index: index + 1,
  label: wallpaperLabels[index % wallpaperLabels.length],
}));

export default function WallpapersPage() {
  return (
    <main className="wallpaper-page" id="wallpapers" data-header-theme="light">
      <SiteHeader />
      <PageMotion />

      <header className="wallpaper-head" data-intro>
        <div>
          <p className="wallpaper-kicker">Explore / Wallpapers</p>
          <h1 className="wallpaper-title">Wallpapers</h1>
        </div>
        <p className="wallpaper-note">
          Nothing to see here — yet. The wallpaper index is being prepared.
        </p>
      </header>

      <div className="wallpaper-grid" data-reveal aria-hidden="true">
        {wallpaperSlots.map((slot) => (
          <article className="wallpaper-cell" key={slot.index}>
            <span className="wallpaper-index">
              {String(slot.index).padStart(2, "0")}
            </span>
            <span className="wallpaper-swatch" />
            <span className="wallpaper-label">{slot.label}</span>
          </article>
        ))}
      </div>
    </main>
  );
}
