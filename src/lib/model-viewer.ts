type ModelViewerConfig = {
  meshoptDecoderLocation?: string;
};

const MESHOPT_DECODER_LOCATION = "/vendor/meshopt_decoder.js";

let loaderPromise: Promise<typeof import("@google/model-viewer")> | null = null;

/**
 * Loads model-viewer once, after configuring its optional meshopt decoder.
 * The decoder location must be set before the first <model-viewer> element is
 * defined or compressed GLBs will fail to load.
 */
export function loadModelViewer() {
  if (!loaderPromise) {
    if (typeof window !== "undefined") {
      const globalScope = window as typeof window & {
        ModelViewerElement?: ModelViewerConfig;
      };

      globalScope.ModelViewerElement ??= {};
      globalScope.ModelViewerElement.meshoptDecoderLocation =
        MESHOPT_DECODER_LOCATION;
    }

    loaderPromise = import("@google/model-viewer");
  }

  return loaderPromise;
}
