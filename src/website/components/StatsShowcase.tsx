import type { LucideIcon } from "lucide-react";
import { Factory, HeartHandshake, Layers, Sparkles } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";

type Tile = { icon: LucideIcon; value: string; label: string; tint: string };

/**
 * Real-numbers stat strip for the About page, styled after the icon-tile
 * testimonial-stats reference — using our own business numbers rather than
 * invented reviewer names/photos.
 */
export function StatsShowcase({
  companyName,
  blanketVarieties,
  clientsServed,
  yearsOfCraft,
  brandCount,
}: {
  companyName: string;
  blanketVarieties: number;
  clientsServed: number;
  yearsOfCraft: number;
  brandCount: number;
}) {
  const tiles: Tile[] = [
    { icon: Layers, value: `${blanketVarieties}+`, label: "Blanket Varieties", tint: "bg-accent/10 text-accent" },
    { icon: HeartHandshake, value: `${clientsServed}+`, label: "Clients Served", tint: "bg-brand-ocean/15 text-brand-ocean" },
    { icon: Sparkles, value: `${yearsOfCraft}+`, label: "Years of Craftsmanship", tint: "bg-primary/10 text-primary" },
    { icon: Factory, value: `${brandCount}`, label: "Signature Brands", tint: "bg-brand-midnight/10 text-brand-midnight" },
  ];

  return (
    <section className="bg-secondary/40 py-16">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            By the Numbers
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-primary md:text-4xl">
            {companyName} at a Glance
          </h2>
          <p className="mt-3 text-muted-foreground">
            Quality and consistency, measured in every blanket we send out the door.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {tiles.map((tile, i) => (
            <Reveal key={tile.label} delay={i * 80}>
              <div className="flex h-full flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-sm transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tile.tint}`}>
                  <tile.icon className="h-5 w-5" />
                </span>
                <p className="font-serif text-2xl font-bold text-primary">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
