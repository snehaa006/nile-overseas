import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCatalogue } from "@/shared/hooks/useCatalogue";
import { useSettings } from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BlanketCard } from "../components/BlanketCard";
import { BrandCard } from "../components/BrandCard";
import type { BlanketWithImages } from "@/shared/types/models";

const TAGLINES: Record<string, string> = {
  DRJ: "Timeless warmth, everyday luxury.",
  Cloud9: "Sink into cloud-soft comfort.",
};

export function HomePage() {
  const { data: brands, isLoading } = useCatalogue();
  const { data: settings } = useSettings();

  const featured: { blanket: BlanketWithImages; brand: string }[] =
    (brands ?? [])
      .flatMap((b) => b.blankets.map((bl) => ({ blanket: bl, brand: b.name })))
      .slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/60 to-background">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center animate-fade-in">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {settings?.company_name ?? "Nile Overseas"}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-primary md:text-6xl text-balance">
              Blankets crafted for warmth that lasts.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Manufacturers of the DRJ and Cloud9 ranges — premium mink, plush
              and everyday blankets, made with care.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/products">
                  Explore Products <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-accent/20 to-primary/10" />
            <div className="relative grid h-full grid-cols-2 gap-4 p-4">
              {featured.slice(0, 2).map(({ blanket, brand }) => (
                <div key={blanket.id} className="self-center">
                  <BlanketCard blanket={blanket} brandName={brand} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="container py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-primary">
            About {settings?.company_name ?? "Nile Overseas"}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {settings?.about_text ??
              "Nile Overseas is a blanket manufacturer committed to quality craftsmanship and lasting comfort across our DRJ and Cloud9 brands."}
          </p>
        </div>
      </section>

      {/* Brand cards */}
      <section className="container py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {(brands ?? []).map((b) => (
            <BrandCard
              key={b.id}
              name={b.name}
              count={b.blankets.length}
              tagline={TAGLINES[b.name] ?? b.description ?? "Explore the range."}
            />
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary">
              Featured Blankets
            </h2>
            <p className="mt-2 text-muted-foreground">
              A selection from across our collections.
            </p>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm font-medium text-accent hover:underline sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map(({ blanket, brand }) => (
              <BlanketCard key={blanket.id} blanket={blanket} brandName={brand} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Products coming soon.</p>
        )}
      </section>
    </>
  );
}
