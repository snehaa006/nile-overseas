import type { ComponentType } from "react";
import { Layers, Sparkles, Printer, Brush, PackageCheck } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";

type Step = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

/**
 * The five stages a Nile Overseas blanket moves through, from raw yarn to a
 * finished, packed product. Rendered as a winding, road-style timeline that
 * echoes the "5-step process" reference: numbered stages strung along a
 * serpentine dashed path on a deep-midnight background.
 */
const STEPS: Step[] = [
  {
    title: "Raschel",
    description:
      "Premium yarn is knitted on high-gauge Raschel warp-knitting machines, forming the dense, plush base fabric that gives every blanket its signature softness and warmth.",
    icon: Layers,
  },
  {
    title: "Polish",
    description:
      "The knitted fabric is polished to smooth the surface and even out the pile, preparing it for a clean, luxurious finish.",
    icon: Sparkles,
  },
  {
    title: "Printing",
    description:
      "Vibrant, high-definition designs are printed onto the fabric with precision, bringing rich colours and intricate patterns to life.",
    icon: Printer,
  },
  {
    title: "Brushing",
    description:
      "The surface is carefully brushed to raise the fibres, creating the ultra-soft, cozy hand-feel our blankets are known for.",
    icon: Brush,
  },
  {
    title: "Products",
    description:
      "Finished blankets are cut, stitched, quality-checked and packed — ready to ship as premium CloudNine and Paris Royale DRJ products.",
    icon: PackageCheck,
  },
];

export function ProcessesPage() {
  return (
    <section className="bg-primary">
      <div className="container max-w-5xl py-16 md:py-24">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            How It's Made
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-bold text-primary-foreground md:text-5xl">
            Our 5-Step Manufacturing Process
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/70 md:text-base">
            From the first thread on the loom to the final packed blanket, every
            piece travels through five carefully crafted stages.
          </p>
        </Reveal>

        <ol className="relative mt-16 md:mt-20">
          {/* Central serpentine spine (desktop) / left rail (mobile) */}
          <span
            className="absolute top-2 bottom-2 left-6 w-0.5 rounded md:left-1/2 md:-translate-x-1/2"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, hsl(var(--accent)) 0 10px, transparent 10px 22px)",
            }}
            aria-hidden
          />

          {STEPS.map((step, i) => {
            const left = i % 2 === 0;
            return (
              <li key={step.title} className="relative">
                <Reveal
                  delay={i * 90}
                  className={[
                    "relative flex items-start gap-5 pb-12 last:pb-0 pl-16",
                    "md:w-1/2 md:pl-0",
                    left
                      ? "md:mr-auto md:pr-14 md:flex-row-reverse md:text-right"
                      : "md:ml-auto md:pl-14 md:translate-y-16",
                  ].join(" ")}
                >
                  {/* Numbered icon node sitting on the spine */}
                  <div
                    className={[
                      "absolute top-0 left-6 z-10 -translate-x-1/2",
                      left ? "md:left-full" : "md:left-0",
                    ].join(" ")}
                  >
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-primary text-primary-foreground shadow-lg"
                      style={{ boxShadow: "0 0 0 6px hsl(var(--accent) / 0.18)" }}
                    >
                      <step.icon className="h-6 w-6" />
                    </span>
                  </div>

                  {/* Content card */}
                  <div
                    className={[
                      "flex-1 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.06] p-6 backdrop-blur-sm transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-accent/40 hover:bg-primary-foreground/[0.1]",
                      left ? "md:mr-8" : "md:ml-8",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "font-serif text-5xl font-bold leading-none text-accent/50",
                      ].join(" ")}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-xl font-bold uppercase tracking-wide text-primary-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
