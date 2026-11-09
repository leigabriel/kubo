import type { Metadata } from "next";
import { ComponentsStudio } from "@/components/explore/studio/ComponentsStudio";

export const metadata: Metadata = {
  title: "Components — Kubo",
  description: "Interface components from the Kubo archive.",
};

export default function ComponentsPage() {
  return (
    <main className="studio-page" id="components">
      <h1 className="sr-only" id="components-title">
        Components
      </h1>
      <ComponentsStudio />
    </main>
  );
}
