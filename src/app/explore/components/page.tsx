import type { Metadata } from "next";
import { DiscSleeve } from "@/components/explore/DiscSleeve";

export const metadata: Metadata = {
  title: "Components — Kubo",
  description: "Interface components from the Kubo archive.",
};

export default function ComponentsPage() {
  return (
    <main className="components-studio-page" id="components">
      <h1 className="sr-only" id="components-title">
        Components
      </h1>
      <DiscSleeve />
    </main>
  );
}
