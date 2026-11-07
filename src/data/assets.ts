import { getDownloadUrl, getFileExtension, getModelUrl } from "@/lib/storage";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface Asset {
  id: string;
  index: string;
  title: string;
  description: string;
  /** Public URL of the model file (usually Supabase Storage). */
  src: string;
  sizeMB: number;
  format: string;
}

interface AssetRow {
  id: string;
  index: string;
  title: string;
  description: string;
  src: string;
  size_mb: number;
  format: string;
}

/**
 * Builds a public Storage URL from an object path inside the configured bucket.
 * You can also paste a full URL directly into `src`.
 */
export function assetSrc(objectPath: string): string {
  return getModelUrl(objectPath);
}

/**
 * Local fallback used before the Supabase request resolves, or when Supabase is
 * not configured. The `public.assets` table is the source of truth.
 */
export const assets: Asset[] = [];

/**
 * Loads asset metadata from the Supabase `public.assets` table.
 * Returns `null` when Supabase is not configured or the request fails.
 */
export async function fetchAssets(): Promise<Asset[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("assets")
    .select("id, index, title, description, src, size_mb, format")
    .order("index", { ascending: true });

  if (error) {
    console.error(`Could not load assets from Supabase: ${error.message}`);
    return null;
  }

  return ((data ?? []) as AssetRow[]).map((row) => ({
    id: row.id,
    index: row.index,
    title: row.title,
    description: row.description,
    src: row.src,
    sizeMB: Number(row.size_mb),
    format: row.format,
  }));
}

export function getAssetUrl(asset: Asset): string {
  return asset.src;
}

export function getAssetFilename(asset: Asset): string {
  return `${asset.id}.${getFileExtension(asset.src)}`;
}

export function getAssetDownloadUrl(asset: Asset): string {
  return getDownloadUrl(getAssetUrl(asset), getAssetFilename(asset));
}
