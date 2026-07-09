import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { useBlanket } from "@/shared/hooks/useBlankets";
import { useSettings } from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatCurrency, formatWeight } from "@/shared/utils/format";
import { ImageGallery } from "../components/ImageGallery";

export function BlanketDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const { data: blanket, isLoading, isError, error, refetch } = useBlanket(sku);
  const { data: settings } = useSettings();

  if (isLoading) return <div className="container"><LoadingState /></div>;
  if (isError) return <div className="container py-16"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!blanket)
    return (
      <div className="container py-16">
        <EmptyState
          title="Blanket not found"
          description="This product may have been removed."
          action={
            <Button asChild variant="outline">
              <Link to="/products">Back to products</Link>
            </Button>
          }
        />
      </div>
    );

  const whatsappHref = settings?.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi, I'm interested in the ${blanket.name} (${blanket.sku ?? ""}).`,
      )}`
    : null;

  return (
    <div className="container py-10">
      <Link
        to="/products"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="animate-fade-in-up">
          <ImageGallery images={blanket.images} />
        </div>

        <div className="flex animate-fade-in-up flex-col" style={{ animationDelay: "120ms" }}>
          <Badge variant="secondary" className="w-fit">
            {blanket.brand.name}
          </Badge>
          <h1 className="mt-4 font-serif text-4xl font-bold text-primary">
            {blanket.name}
          </h1>
          {blanket.sku && (
            <p className="mt-1 text-sm text-muted-foreground">
              SKU: {blanket.sku}
            </p>
          )}

          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(blanket.rate)}
            </span>
            <span className="text-muted-foreground">
              {formatWeight(blanket.weight_kg)}
            </span>
          </div>

          <div className="mt-8 rounded-xl border bg-secondary/40 p-6 transition-shadow hover:shadow-md">
            <p className="text-sm text-muted-foreground">
              Interested in this blanket or need bulk pricing? Reach out and our
              team will help you with orders and availability.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {whatsappHref && (
                <Button asChild>
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {settings?.phone && (
                <Button asChild variant="outline">
                  <a href={`tel:${settings.phone}`}>
                    <Phone className="h-4 w-4" /> {settings.phone}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
