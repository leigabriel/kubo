import type { CSSProperties, Key, Ref } from "react";

type ModelViewerProps = {
  src?: string;
  alt?: string;
  "camera-orbit"?: string;
  "camera-target"?: string;
  "field-of-view"?: string;
  "camera-controls"?: boolean | "" | "camera-controls";
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
  key?: Key | null;
  id?: string;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLElement>;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
