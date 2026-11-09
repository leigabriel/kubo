import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "@/styles/globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { PageTransition } from "@/components/motion/PageTransition";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#232323",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SmoothScroll>
          <PageTransition />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
