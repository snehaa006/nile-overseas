import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import {
  useAllReviews,
  useDeleteReview,
  useUpdateReview,
} from "@/shared/hooks/useReviews";
import { RatingStars } from "@/shared/components/RatingStars";
import { Button } from "@/shared/components/ui/button";
import { formatDate } from "@/shared/utils/format";
import type { Review } from "@/shared/types/models";

/**
 * Moderate the customer reviews submitted from the public Contact page.
 * Reviews go live as soon as a visitor submits them; hide or delete any
 * you don't want shown. Embedded as a card inside Website Settings.
 */
export function ReviewsManager() {
  const { data: reviews = [], isLoading } = useAllReviews();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  }
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reviews yet. Visitors can leave one from the Contact page.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const update = useUpdateReview();
  const remove = useDeleteReview();
  const busy = update.isPending || remove.isPending;

  const toggleVisibility = async () => {
    try {
      await update.mutateAsync({
        id: review.id,
        input: { is_approved: !review.is_approved },
      });
      toast.success(
        review.is_approved
          ? "Review hidden from the website"
          : "Review is now visible on the website",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Delete the review from ${review.name}?`)) return;
    try {
      await remove.mutateAsync(review.id);
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${review.is_approved ? "" : "bg-muted/40 opacity-70"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <RatingStars rating={review.rating} />
          <p className="font-medium">{review.name}</p>
          {!review.is_approved && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Hidden
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(review.created_at.slice(0, 10))}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{review.message}</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={toggleVisibility}
          disabled={busy}
        >
          {review.is_approved ? (
            <>
              <EyeOff className="h-4 w-4" /> Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Show
            </>
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          onClick={handleRemove}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
