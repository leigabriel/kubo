import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WallpaperGallery } from "@/components/explore/WallpaperGallery";
import { PageMotion } from "@/components/motion/PageMotion";
import { getModelUrl } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Wallpapers — Kubo",
  description: "Wallpapers from the Kubo archive.",
};

const wallpapers = [
  {
    file: "blue-wallpaper-macos-style-leimxnsquare.jpg",
    label: "Blue",
    title: "Blue — macOS style",
  },
  {
    file: "white-wallpaper-macos-style-leimxnsquare.jpg",
    label: "White",
    title: "White — macOS style",
  },
  {
    file: "yellow-wallpaper-macos-style-leimxnsquare.jpg",
    label: "Yellow",
    title: "Yellow — macOS style",
  },
  {
    file: "yellow-wallpaper-macos-style-v2-leimxnsquare.jpg",
    label: "Yellow V2",
    title: "Yellow V2 — macOS style",
  },
  {
    file: "yellow-wallpaper-macos-style-v3-leimxnsquare.jpg",
    label: "Yellow V3",
    title: "Yellow V3 — macOS style",
  },
  {
    file: "yellow-wallpaper-macos-style-v4-leimxnsquare.jpg",
    label: "Yellow V4",
    title: "Yellow V4 — macOS style",
  },
].map((wallpaper, index) => ({
  ...wallpaper,
  index: index + 1,
  src: getModelUrl(`wallpapers/${wallpaper.file}`),
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
          Six wallpapers from the archive — macOS-style backgrounds, in an
          editorial index. Select one to preview and download.
        </p>
      </header>

      <WallpaperGallery wallpapers={wallpapers} />
    </main>
  );
}
