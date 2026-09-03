import { fetchAll, supabase } from "@/shared/lib/supabase";
import type { Review } from "@/shared/types/models";
import type { TablesUpdate } from "@/shared/types/database";

/** Approved reviews for the public website, newest first. */
export async function fetchReviews(): Promise<Review[]> {
  return fetchAll((from, to) =>
    supabase
      .from("reviews")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
}

/** Every review, including hidden ones — staff panel only (RLS-gated). */
export async function fetchAllReviews(): Promise<Review[]> {
  return fetchAll((from, to) =>
    supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
}

/** Submit a visitor review from the Contact page; it goes live immediately. */
export async function createReview(input: {
  name: string;
  rating: number;
  message: string;
}): Promise<Review> {
  const { data, error } = await supabase
    .from("reviews")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReview(
  id: string,
  input: TablesUpdate<"reviews">,
): Promise<Review> {
  const { data, error } = await supabase
    .from("reviews")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
