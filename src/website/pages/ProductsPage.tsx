import { useCatalogue } from "@/shared/hooks/useCatalogue";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/shared/components/StateViews";
import { Reveal } from "@/shared/components/Reveal";
import { BlanketCard } from "../components/BlanketCard";
import { brandLogo } from "../lib/brandLogos";

export function ProductsPage() {
  const { data: brands, isLoading, isError, error, refetch } = useCatalogue();

  return (
    <div className="container py-16">
      <div className="mb-12 text-center animate-fade-in-up">
        <h1 className="font-serif text-4xl font-bold text-primary">
          Our Blankets
        </h1>
        <p className="mt-3 text-muted-foreground">
          Browse our full range across the DRJ and Cloud9 collections.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={refetch} />}

      {brands?.every((b) => b.blankets.length === 0) && (
        <EmptyState
          title="No products yet"
          description="Our catalogue is being updated. Please check back soon."
        />
      )}

      {brands?.map((brand) =>
        brand.blankets.length === 0 ? null : (
          <section
            key={brand.id}
            id={brand.name.toLowerCase()}
            className="mb-16 scroll-mt-20"
          >
            <div className="mb-6 flex items-center gap-4">
              {brandLogo(brand.name) && (
                <img
                  src={brandLogo(brand.name)}
                  alt={`${brand.name} logo`}
                  className="h-14 w-auto object-contain"
                  loading="lazy"
                />
              )}
              <h2 className="font-serif text-3xl font-bold text-primary">
                {brand.name}
              </h2>
              <span className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">
                {brand.blankets.length} items
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {brand.blankets.map((b, i) => (
                <Reveal key={b.id} delay={(i % 4) * 80}>
                  <BlanketCard blanket={b} brandName={brand.name} />
                </Reveal>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
