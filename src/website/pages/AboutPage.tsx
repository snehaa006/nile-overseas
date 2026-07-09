import { useSettings } from "@/shared/hooks/useSettings";
import { Reveal } from "@/shared/components/Reveal";

export function AboutPage() {
  const { data: s } = useSettings();

  return (
    <div className="container max-w-3xl py-16">
      <h1 className="animate-fade-in-up font-serif text-4xl font-bold text-primary">
        About {s?.company_name ?? "Nile Overseas"}
      </h1>
      <div
        className="prose mt-8 max-w-none animate-fade-in-up text-muted-foreground"
        style={{ animationDelay: "100ms" }}
      >
        <p className="whitespace-pre-line text-lg leading-relaxed">
          {s?.about_text ??
            "Nile Overseas is a blanket manufacturing company producing premium blankets under the DRJ and Cloud9 brands. We combine traditional craftsmanship with modern manufacturing to deliver warmth, softness and durability."}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Reveal>
          <div className="rounded-xl border bg-card p-6 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-serif text-2xl font-bold text-primary">DRJ</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Timeless warmth and everyday luxury for every home.
            </p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-xl border bg-card p-6 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-serif text-2xl font-bold text-primary">Cloud9</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cloud-soft comfort in a premium plush finish.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
