import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  createReview,
  deleteReview,
  fetchAllReviews,
  fetchReviews,
  updateReview,
} from "@/shared/api/reviews";
import type { TablesUpdate } from "@/shared/types/database";

/** Approved reviews shown on the public site (Home + Contact). */
export function useReviews() {
  return useQuery({ queryKey: qk.reviews, queryFn: fetchReviews });
}

/** All reviews, hidden included — staff panel. */
export function useAllReviews() {
  return useQuery({ queryKey: qk.reviewsAll, queryFn: fetchAllReviews });
}

function useInvalidateReviews() {
  const qc = useQueryClient();
  // qk.reviews is a prefix of qk.reviewsAll, so both caches refresh.
  return () => qc.invalidateQueries({ queryKey: qk.reviews });
}

export function useCreateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: { name: string; rating: number; message: string }) =>
      createReview(input),
    onSuccess: invalidate,
  });
}

export function useUpdateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (args: { id: string; input: TablesUpdate<"reviews"> }) =>
      updateReview(args.id, args.input),
    onSuccess: invalidate,
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: invalidate,
  });
}
