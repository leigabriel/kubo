import type { ComponentPropsWithoutRef } from "react";

type ModelViewerProps = {
  src?: string;
  alt?: string;
  "camera-orbit"?: string;
  "camera-target"?: string;
  "field-of-view"?: string;
  "camera-controls"?: boolean | "";
  "disable-zoom"?: boolean | "";
  "auto-rotate"?: boolean | "";
  "auto-rotate-delay"?: string | number;
  "rotation-per-second"?: string;
  "interaction-prompt"?: string;
  "interaction-prompt-style"?: string;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  "environment-image"?: string;
  exposure?: string | number;
  "tone-mapping"?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
  poster?: string;
} & ComponentPropsWithoutRef<"model-viewer">;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
