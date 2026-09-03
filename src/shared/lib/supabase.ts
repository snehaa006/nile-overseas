import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Rows to ask for per request. The server caps a response independently (1000
 * rows by default on Supabase) and does it *silently* — a truncated read is
 * indistinguishable from a genuinely short one, so it surfaces as wrong
 * numbers rather than an error. Every list read pages through `fetchAll`
 * instead of trusting a single call.
 */
const PAGE_SIZE = 1000;

/**
 * Reads a whole table/view a page at a time, so no list can be silently cut
 * short as it grows. Call it with a builder that applies `.range(from, to)`
 * last:
 *
 *     fetchAll((from, to) =>
 *       supabase.from("attendance").select("*").order("id").range(from, to));
 *
 * The query MUST end in a total order — an ordering that cannot tie. Order by
 * the columns you want, then by a unique one (`id`, or the key a view groups
 * on). Rows tied under the sort come back in no fixed order, so ties spanning
 * a page boundary would drop some rows and repeat others.
 *
 * Paging walks by how many rows actually came back, and stops only on an
 * empty page. A short page can mean either "that's the end" or "the server's
 * cap is smaller than PAGE_SIZE", and those are indistinguishable from here —
 * treating a short page as the end is exactly the assumption that made
 * payroll pay half of August. The cost is one empty request per read.
 */
export async function fetchAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const { data, error } = await page(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) return rows;
    rows.push(...data);
  }
}

export const STORAGE_BUCKET = "blanket-images";
export const LOGO_BUCKET = "brand-logos";

/** Resolve a storage object path to its public URL. */
export function publicImageUrl(path: string): string {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
