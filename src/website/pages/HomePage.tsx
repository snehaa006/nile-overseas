import { Link } from "react-router-dom";
import { ArrowRight, Award, ImageOff, Layers, Truck, Users } from "lucide-react";
import { useCatalogue } from "@/shared/hooks/useCatalogue";
import { useSettings } from "@/shared/hooks/useSettings";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BrandCard } from "../components/BrandCard";
import { FeaturedCarousel } from "../components/FeaturedCarousel";
import { ClientsTimeline } from "../components/ClientsTimeline";
import { OurTeam } from "../components/OurTeam";
import { useClients } from "@/shared/hooks/useClients";
import { useTeamMembers } from "@/shared/hooks/useTeam";
import { Reveal } from "@/shared/components/Reveal";
import type { BlanketWithImages } from "@/shared/types/models";

const TAGLINES: Record<string, string> = {
  DRJ: "Timeless warmth, everyday luxury.",
  Cloud9: "Sink into cloud-soft comfort.",
  "Paris Royale DRJ": "Timeless warmth, everyday luxury.",
  CloudNine: "Sink into cloud-soft comfort.",
};

const FEATURES = [
  {
    icon: Award,
    title: "Est. 2014",
    body: "Over a decade of craftsmanship behind every blanket we make.",
  },
  {
    icon: Layers,
    title: "Premium Materials",
    body: "Mink, plush and everyday fabrics chosen for lasting softness and warmth.",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    body: "Reliable dispatch to retailers and bulk buyers nationwide.",
  },
  {
    icon: Users,
    title: "Bulk & Wholesale Friendly",
    body: "Flexible ordering for retailers, distributors and large accounts.",
  },
];

export function HomePage() {
  const { data: brands, isLoading } = useCatalogue();
  const { data: settings } = useSettings();
  const { data: clients } = useClients();
  const { data: team } = useTeamMembers();

  const allBlankets: { blanket: BlanketWithImages; brand: string }[] =
    (brands ?? []).flatMap((b) =>
      b.blankets.map((bl) => ({ blanket: bl, brand: b.name })),
    );
  const carouselItems = allBlankets.slice(0, 10);

  // A single showcase image for the hero (KBI-style). Use the first blanket
  // that has a photo; falls back to a styled placeholder if none is uploaded.
  const heroImage =
    allBlankets
      .map(({ blanket }) => {
        const primary =
          blanket.images?.find((i) => i.is_primary) ?? blanket.images?.[0];
        return primary?.image_url ?? null;
      })
      .find((url): url is string => Boolean(url)) ?? null;

  const establishedYear = settings?.established_year ?? 2014;
  const yearsOfCraft = new Date().getFullYear() - establishedYear;
  const totalBlankets = (brands ?? []).reduce((n, b) => n + b.blankets.length, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/60 to-background">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-ocean/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-midnight/15 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="container relative grid gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                {settings?.company_name ?? "Nile Overseas"}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Award className="h-3 w-3" /> Est. {establishedYear}
              </span>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-primary md:text-6xl text-balance">
              Blankets crafted for warmth that lasts.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Manufacturers of the CloudNine and Paris Royale DRJ ranges — premium
              mink, plush and everyday blankets, made with care since {establishedYear}.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="transition-transform hover:scale-[1.03] active:scale-[0.98]">
                <Link to="/products">
                  Explore Products <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="transition-transform hover:scale-[1.03] active:scale-[0.98]">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block animate-scale-in" style={{ animationDelay: "150ms" }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-ocean/20 via-brand-midnight/10 to-primary/10" />
            <div className="relative flex h-full items-center justify-center p-4">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/10">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt="Nile Overseas blankets"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-muted text-muted-foreground">
                    <ImageOff className="h-10 w-10" />
                    <span className="text-sm">Showcase image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <Reveal as="section" className="border-y bg-primary text-primary-foreground">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          <Stat value={`${establishedYear}`} label="Established" />
          <Stat value={`${yearsOfCraft}+`} label="Years of Craftsmanship" />
          <Stat value={isLoading ? "—" : `${brands?.length ?? 0}`} label="Signature Collections" />
          <Stat value={isLoading ? "—" : `${totalBlankets}+`} label="Blanket Varieties" />
        </div>
      </Reveal>

      {/* About strip */}
      <Reveal as="section" className="container py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-primary">
            About {settings?.company_name ?? "Nile Overseas"}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {settings?.about_text ??
              `Nile Overseas is a blanket manufacturer committed to quality craftsmanship and lasting comfort across our CloudNine and Paris Royale DRJ brands, proudly serving customers since ${establishedYear}.`}
          </p>
        </div>
      </Reveal>

      {/* Why choose us */}
      <section className="bg-secondary/40 py-16">
        <div className="container">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold text-primary">Why Nile Overseas</h2>
            <p className="mt-2 text-muted-foreground">
              Quality and reliability, in every blanket we send out the door.
            </p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="flex h-full flex-col items-start gap-3 rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg">
                  <div className="rounded-lg bg-accent/10 p-3 text-accent">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-primary">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Brand cards */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {(brands ?? []).map((b, i) => (
            <Reveal key={b.id} delay={i * 100}>
              <BrandCard
                name={b.name}
                count={b.blankets.length}
                tagline={TAGLINES[b.name] ?? b.description ?? "Explore the range."}
                logoUrl={b.logo_url}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-16">
        <Reveal className="mb-8 flex items-end justify-between">
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
            className="hidden items-center gap-1 text-sm font-medium text-accent transition-colors hover:underline sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : carouselItems.length > 0 ? (
          <FeaturedCarousel items={carouselItems} />
        ) : (
          <p className="text-muted-foreground">Products coming soon.</p>
        )}
      </section>

      {/* Clients timeline */}
      <ClientsTimeline clients={clients ?? []} />

      {/* CTA banner */}
      <Reveal as="section" className="container pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-midnight to-brand-noir px-8 py-14 text-center text-white shadow-lg sm:px-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-ocean/20 blur-3xl" />
          <h2 className="relative font-serif text-3xl font-bold text-balance">
            Ready to stock premium blankets?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/80">
            Reach out for bulk pricing, wholesale orders or a catalogue walkthrough.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <Link to="/contact">Contact Us</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white transition-transform hover:scale-[1.03] hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              <Link to="/products">Browse Catalogue</Link>
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Our Team — closing section, managed from Website Settings */}
      <OurTeam members={team ?? []} />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-3xl font-bold sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-primary-foreground/70 sm:text-sm">{label}</p>
    </div>
  );
}
