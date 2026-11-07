const DEFAULT_BUCKET = "models";
const LOCAL_MODELS_PREFIX = "/models";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const storageBucket =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function encodeObjectPath(objectPath: string): string {
  return objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Resolves a model object path to a public Supabase Storage URL.
 *
 * Falls back to the local `public/models` directory when no Supabase project
 * URL is configured, so the app keeps working during local setup.
 */
export function getModelUrl(objectPath: string): string {
  const encodedPath = encodeObjectPath(objectPath);

  if (!supabaseUrl) {
    return `${LOCAL_MODELS_PREFIX}/${encodedPath}`;
  }

  return `${trimTrailingSlash(supabaseUrl)}/storage/v1/object/public/${storageBucket}/${encodedPath}`;
}

/**
 * Adds Supabase's `?download` parameter so the browser saves the file with a
 * custom name. The HTML `download` attribute alone is ignored for
 * cross-origin URLs.
 */
export function getDownloadUrl(publicUrl: string, filename: string): string {
  const separator = publicUrl.includes("?") ? "&" : "?";
  return `${publicUrl}${separator}download=${encodeURIComponent(filename)}`;
}

export function getFileExtension(path: string): string {
  const cleanPath = path.split(/[?#]/)[0];
  const extension = cleanPath.split(".").pop();
  return extension && extension !== cleanPath ? extension.toLowerCase() : "glb";
}
