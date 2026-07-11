import { Star } from "lucide-react";
import { cn } from "@/shared/utils/cn";

/** Read-only row of five stars, filled up to `rating`. */
export function RatingStars({
  rating,
  className,
  starClassName,
}: {
  rating: number;
  className?: string;
  starClassName?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cn("flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted",
            starClassName,
          )}
        />
      ))}
    </div>
  );
}
