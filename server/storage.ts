/**
 * Supabase Storage helpers — replaces the Manus S3 proxy
 *
 * Uses the Supabase JS client (service role key) for server-side file operations.
 * Files are stored in a bucket named "media" by default.
 *
 * Bucket setup (run once in Supabase dashboard or via SQL):
 *   INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
 *
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

// Default bucket for all media uploads
const DEFAULT_BUCKET = "media";

/**
 * Lazy Supabase client — created on first use to avoid startup errors
 * when env vars are not yet configured.
 */
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error(
      "[Storage] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for file storage."
    );
  }

  _supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload a file to Supabase Storage.
 *
 * @param relKey - Relative storage path, e.g. "voice-audio/abc123.mp3"
 * @param data   - File content as Buffer, Uint8Array, or string
 * @param contentType - MIME type, e.g. "audio/mpeg"
 * @returns { key, url } where url is the public CDN URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseAdmin();
  const key = normalizeKey(relKey);

  // Convert string data to Buffer
  const body: Buffer | Uint8Array =
    typeof data === "string" ? Buffer.from(data, "utf-8") : data;

  const { error } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(key, body, {
      contentType,
      upsert: true, // overwrite if exists (idempotent uploads)
    });

  if (error) {
    throw new Error(`[Storage] Upload failed for key "${key}": ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(DEFAULT_BUCKET)
    .getPublicUrl(key);

  return { key, url: urlData.publicUrl };
}

/**
 * Get a public URL for a stored file.
 *
 * @param relKey - Relative storage path
 * @returns { key, url } where url is the public CDN URL
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseAdmin();
  const key = normalizeKey(relKey);

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(key);

  return { key, url: data.publicUrl };
}

/**
 * Delete a file from Supabase Storage.
 *
 * @param relKey - Relative storage path
 */
export async function storageDelete(relKey: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const key = normalizeKey(relKey);

  const { error } = await supabase.storage.from(DEFAULT_BUCKET).remove([key]);

  if (error) {
    console.warn(`[Storage] Delete failed for key "${key}": ${error.message}`);
  }
}
