import type { ComponentPropsWithoutRef } from "react";

type ModelViewerProps = {
  src?: string;
  "camera-orbit"?: string;
  "camera-controls"?: boolean | "";
  "auto-rotate"?: boolean | "";
  "interaction-prompt"?: string;
  "shadow-intensity"?: string | number;
  alt?: string;
  "exposure"?: string | number;
  "tone-mapping"?: string;
} & ComponentPropsWithoutRef<"model-viewer">;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
