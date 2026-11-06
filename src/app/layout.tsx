import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "@/styles/globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Kubo — Discover Creative Assets",
  description:
    "A creative digital space designed to help discover, organize, and explore digital assets through a simple, immersive experience.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
