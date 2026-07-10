import { Award, Factory, HeartHandshake, Sparkles } from "lucide-react";
import { useSettings } from "@/shared/hooks/useSettings";
import { useCatalogue } from "@/shared/hooks/useCatalogue";
import { useClients } from "@/shared/hooks/useClients";
import { Reveal } from "@/shared/components/Reveal";
import { ClientsTimeline } from "../components/ClientsTimeline";
import { brandLogo } from "../lib/brandLogos";

const BRAND_BLURBS: Record<string, string> = {
  DRJ: "Timeless warmth and everyday luxury for every home.",
  Cloud9: "Cloud-soft comfort in a premium plush finish.",
  "Paris Royale DRJ": "Timeless warmth and everyday luxury for every home.",
  CloudNine: "Cloud-soft comfort in a premium plush finish.",
};

export function AboutPage() {
  const { data: s } = useSettings();
  const { data: brands } = useCatalogue();
  const { data: clients } = useClients();

  const establishedYear = s?.established_year ?? 2014;
  const yearsOfCraft = new Date().getFullYear() - establishedYear;

  return (
    <>
    <div className="container max-w-4xl py-16">
      <div className="animate-fade-in-up">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Award className="h-3 w-3" /> Est. {establishedYear}
        </span>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary">
          About {s?.company_name ?? "Nile Overseas"}
        </h1>
      </div>

      <div
        className="prose mt-8 max-w-none animate-fade-in-up text-muted-foreground"
        style={{ animationDelay: "100ms" }}
      >
        <p className="whitespace-pre-line text-lg leading-relaxed">
          {s?.about_text ??
            `Nile Overseas is a blanket manufacturing company producing premium blankets under the CloudNine and Paris Royale DRJ brands. Since ${establishedYear}, we've combined traditional craftsmanship with modern manufacturing to deliver warmth, softness and durability.`}
        </p>
      </div>

      {/* Stat row */}
      <Reveal delay={150} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Award} value={`${establishedYear}`} label="Founded" />
        <StatCard icon={Sparkles} value={`${yearsOfCraft}+`} label="Years of Craft" />
        <StatCard icon={Factory} value={`${brands?.length ?? 2}`} label="Brands" />
        <StatCard icon={HeartHandshake} value="Pan-India" label="Delivery" />
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {(brands ?? []).map((brand, i) => {
          const logo = brandLogo(brand.name, brand.logo_url);
          return (
            <Reveal key={brand.id} delay={i * 100}>
              <div className="flex flex-col rounded-xl border bg-card p-6 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg">
                {logo && (
                  <img
                    src={logo}
                    alt={`${brand.name} logo`}
                    className="mb-3 h-12 w-auto object-contain"
                    loading="lazy"
                  />
                )}
                <h3 className="font-serif text-2xl font-bold text-primary">{brand.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {BRAND_BLURBS[brand.name] ?? brand.description ?? "Explore the range."}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>

    <ClientsTimeline clients={clients ?? []} />
    </>
  );
}

function StatCard({
  icon: Icon, value, label,
}: { icon: typeof Award; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center shadow-sm">
      <Icon className="h-4 w-4 text-accent" />
      <p className="font-serif text-xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
