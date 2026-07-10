import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { brandLogo, brandSlug } from "../lib/brandLogos";

export function BrandCard({
  name,
  count,
  tagline,
  logoUrl,
}: {
  name: string;
  count: number;
  tagline: string;
  logoUrl?: string | null;
}) {
  const logo = brandLogo(name, logoUrl);
  return (
    <Link
      to={`/products#${brandSlug(name)}`}
      className="group relative isolate flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-secondary to-background p-8 shadow-sm transition-[transform,box-shadow] duration-300 ease-smooth [transform:translateZ(0)] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-1/3 translate-x-1/3 rounded-full bg-accent/0 transition-colors duration-500 group-hover:bg-accent/10" />
      {logo && (
        <img
          src={logo}
          alt={`${name} logo`}
          className="mb-4 h-24 w-auto self-start object-contain"
          loading="lazy"
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Brand
      </p>
      <h3 className="mt-2 font-serif text-3xl font-bold text-primary transition-colors group-hover:text-accent">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
        {count} {count === 1 ? "blanket" : "blankets"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
