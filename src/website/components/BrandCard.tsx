import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function BrandCard({
  name,
  count,
  tagline,
}: {
  name: string;
  count: number;
  tagline: string;
}) {
  return (
    <Link
      to={`/products#${name.toLowerCase()}`}
      className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-secondary to-background p-8 shadow-sm transition-all hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Brand
      </p>
      <h3 className="mt-2 font-serif text-3xl font-bold text-primary">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
        {count} {count === 1 ? "blanket" : "blankets"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
