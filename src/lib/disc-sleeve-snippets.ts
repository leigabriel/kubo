export const DISC_MODEL_FILENAME = "kubo_objects_disc.glb";
export const DISC_SLEEVE_NAME = "Kubo Disc Sleeve";

export type FrameworkId = "html" | "react" | "vue" | "angular" | "svelte";

export const frameworks: Array<{
  id: FrameworkId;
  label: string;
  filename: string;
  language: string;
}> = [
  { id: "html", label: "HTML", filename: "kubo-disc-sleeve.html", language: "html" },
  { id: "react", label: "React", filename: "DiscSleeve.tsx", language: "tsx" },
  { id: "vue", label: "Vue", filename: "DiscSleeve.vue", language: "vue" },
  { id: "angular", label: "Angular", filename: "disc-sleeve.component.ts", language: "typescript" },
  { id: "svelte", label: "Svelte", filename: "DiscSleeve.svelte", language: "svelte" },
];

export function getDiscModelPath() {
  return DISC_MODEL_FILENAME;
}

export const snippets: Record<FrameworkId, string> = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kubo Disc Sleeve</title>
  <script
    type="module"
    src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js"
  ></script>
  <style>
    .disc-sleeve {
      display: block;
      width: 100%;
      height: 480px;
      background: #000;
      --poster-color: transparent;
    }
  </style>
</head>
<body>
  <model-viewer
    class="disc-sleeve"
    src="kubo_objects_disc.glb"
    alt="Kubo disc sleeve"
    camera-orbit="0deg 90deg auto"
    field-of-view="30deg"
    camera-controls
    disable-zoom
    auto-rotate
    auto-rotate-delay="1200"
    rotation-per-second="10deg"
    interaction-prompt="none"
    shadow-intensity="0.7"
    shadow-softness="1"
    exposure="1.05"
    tone-mapping="aces"
    environment-image="neutral"
    loading="lazy"
  ></model-viewer>
</body>
</html>`,
  react: `// React + model-viewer (@google/model-viewer)
// npm install @google/model-viewer
import "@google/model-viewer";

export function DiscSleeve({ src = "kubo_objects_disc.glb" }: { src?: string }) {
  return (
    <model-viewer
      className="disc-sleeve"
      style={{ display: "block", width: "100%", height: 480, background: "#000" }}
      src={src}
      alt="Kubo disc sleeve"
      camera-orbit="0deg 90deg auto"
      field-of-view="30deg"
      camera-controls
      disable-zoom
      auto-rotate
      auto-rotate-delay="1200"
      rotation-per-second="10deg"
      interaction-prompt="none"
      shadow-intensity="0.7"
      shadow-softness="1"
      exposure="1.05"
      tone-mapping="aces"
      environment-image="neutral"
      loading="lazy"
    />
  );
}`,
  vue: `<!-- Vue 3 <script setup> -->
<template>
  <model-viewer
    class="disc-sleeve"
    :src="src"
    alt="Kubo disc sleeve"
    camera-orbit="0deg 90deg auto"
    field-of-view="30deg"
    camera-controls
    disable-zoom
    auto-rotate
    auto-rotate-delay="1200"
    rotation-per-second="10deg"
    interaction-prompt="none"
    shadow-intensity="0.7"
    shadow-softness="1"
    exposure="1.05"
    tone-mapping="aces"
    environment-image="neutral"
    loading="lazy"
  />
</template>

<script setup lang="ts">
import "@google/model-viewer";

withDefaults(defineProps<{ src?: string }>(), {
  src: "kubo_objects_disc.glb",
});
</script>

<style scoped>
.disc-sleeve {
  display: block;
  width: 100%;
  height: 480px;
  background: #000;
  --poster-color: transparent;
}
</style>`,
  angular: `// Angular — standalone component
// npm install @google/model-viewer
import { Component, Input } from "@angular/core";
import "@google/model-viewer";

@Component({
  selector: "app-disc-sleeve",
  standalone: true,
  template: \`
    <model-viewer
      class="disc-sleeve"
      [attr.src]="src"
      alt="Kubo disc sleeve"
      camera-orbit="0deg 90deg auto"
      field-of-view="30deg"
      camera-controls
      disable-zoom
      auto-rotate
      auto-rotate-delay="1200"
      rotation-per-second="10deg"
      interaction-prompt="none"
      shadow-intensity="0.7"
      shadow-softness="1"
      exposure="1.05"
      tone-mapping="aces"
      environment-image="neutral"
      loading="lazy"
    ></model-viewer>
  \`,
  styles: [\`
    .disc-sleeve {
      display: block;
      width: 100%;
      height: 480px;
      background: #000;
      --poster-color: transparent;
    }
  \`],
})
export class DiscSleeveComponent {
  @Input() src = "kubo_objects_disc.glb";
}`,
  svelte: `<!-- Svelte 4/5 -->
<script>
  import "@google/model-viewer";

  export let src = "kubo_objects_disc.glb";
</script>

<model-viewer
  class="disc-sleeve"
  {src}
  alt="Kubo disc sleeve"
  camera-orbit="0deg 90deg auto"
  field-of-view="30deg"
  camera-controls
  disable-zoom
  auto-rotate
  auto-rotate-delay="1200"
  rotation-per-second="10deg"
  interaction-prompt="none"
  shadow-intensity="0.7"
  shadow-softness="1"
  exposure="1.05"
  tone-mapping="aces"
  environment-image="neutral"
  loading="lazy"
/>

<style>
  .disc-sleeve {
    display: block;
    width: 100%;
    height: 480px;
    background: #000;
    --poster-color: transparent;
  }
</style>`,
};

export function getAiPrompt(modelUrl: string, framework: FrameworkId) {
  return [
    "Build the Kubo Disc Sleeve 3D viewer component.",
    "",
    `Use this GLB model as the asset: ${modelUrl} (save it as kubo_objects_disc.glb next to the component).`,
    "",
    "Requirements:",
    "- Use Google model-viewer with camera-controls, auto-rotate, loading lazy, tone-mapping aces, environment neutral.",
    "- Center the disc, orbit 0deg 90deg, field-of-view 30deg, disable zoom, no interaction prompt.",
    "- Responsive 480px tall on desktop, square aspect on mobile, black background, no poster.",
    "- Accessible alt text \"Kubo disc sleeve\", keyboard-operable viewer.",
    `- Implement it in ${framework} following idiomatic patterns for that framework (component, props for src).`,
    "- Include install notes for @google/model-viewer and meshopt decoder if using compressed GLBs.",
    "",
    "Output only production-ready code plus a short usage example.",
  ].join("\n");
}

export function getReadme(modelUrl: string) {
  return [
    "# Kubo Disc Sleeve",
    "",
    "First Kubo Components drop: a draggable 3D disc-sleeve viewer powered by Google model-viewer.",
    "",
    "## Files",
    "- kubo-disc-sleeve.html — zero-build standalone page",
    "- DiscSleeve.tsx — React",
    "- DiscSleeve.vue — Vue 3",
    "- disc-sleeve.component.ts — Angular standalone",
    "- DiscSleeve.svelte — Svelte",
    `- kubo_objects_disc.glb — model asset (download from ${modelUrl})`,
    "",
    "## Quick start",
    "1. Save the GLB next to the snippet (or host it and update `src`).",
    "2. Install: npm install @google/model-viewer",
    "3. Import the component for your framework and drop it in.",
    "4. For compressed GLBs set MeshoptDecoder location: /vendor/meshopt_decoder.js",
    "",
    "Licence: free use in Kubo projects.",
  ].join("\n");
}
