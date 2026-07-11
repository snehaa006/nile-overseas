import { Link } from "react-router-dom";
import { Quote } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";
import { RatingStars } from "@/shared/components/RatingStars";
import { Button } from "@/shared/components/ui/button";
import { formatMonth } from "@/shared/utils/format";
import type { Review } from "@/shared/types/models";

/**
 * "Customer Reviews" — Home page section. Reviews are submitted by visitors
 * from the Contact page and can be hidden/removed by staff in Website
 * Settings → Customer Reviews.
 */
export function CustomerReviews({ reviews }: { reviews: Review[] }) {
  const shown = reviews.slice(0, 6);

  return (
    <section className="bg-secondary/40 py-16">
      <div className="container">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold text-primary">
            Customer Reviews
          </h2>
          <p className="mt-2 text-muted-foreground">
            What our customers say about Nile Overseas blankets.
          </p>
        </Reveal>

        {shown.length === 0 ? (
          <Reveal className="mx-auto max-w-md text-center">
            <p className="text-muted-foreground">
              No reviews yet — be the first to share your experience.
            </p>
            <Button asChild className="mt-4 transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <Link to="/contact">Write a Review</Link>
            </Button>
          </Reveal>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((review, i) => (
              <Reveal key={review.id} delay={i * 80}>
                <ReviewCard review={review} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <RatingStars rating={review.rating} />
        <Quote className="h-5 w-5 text-accent/50" />
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        “{review.message}”
      </p>
      <div className="mt-5 border-t pt-4">
        <p className="font-serif text-base font-bold text-primary">{review.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatMonth(review.created_at)}
        </p>
      </div>
    </article>
  );
}
