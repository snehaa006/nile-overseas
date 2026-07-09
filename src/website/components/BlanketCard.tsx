import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import type { BlanketWithImages } from "@/shared/types/models";
import { formatCurrency, formatWeight } from "@/shared/utils/format";
import { Badge } from "@/shared/components/ui/badge";

function primaryImage(b: BlanketWithImages): string | null {
  const primary = b.images?.find((i) => i.is_primary) ?? b.images?.[0];
  return primary?.image_url ?? null;
}

export function BlanketCard({
  blanket,
  brandName,
}: {
  blanket: BlanketWithImages;
  brandName?: string;
}) {
  const img = primaryImage(blanket);
  const to = `/products/${blanket.sku ?? blanket.id}`;

  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 ease-smooth hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={blanket.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {brandName && (
          <Badge className="absolute left-3 top-3" variant="secondary">
            {brandName}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold leading-snug transition-colors group-hover:text-accent">
          {blanket.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatWeight(blanket.weight_kg)}
        </p>
        <p className="mt-3 text-lg font-semibold text-primary">
          {formatCurrency(blanket.rate)}
        </p>
      </div>
    </Link>
  );
}
