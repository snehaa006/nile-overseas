import type { ComponentType } from "react";
import { Layers, Sparkles, Printer, Brush, PackageCheck } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";

type Step = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  /** Node coordinates on the road, in viewBox units. */
  x: number;
  y: number;
};

/* ── Palette ──────────────────────────────────────────────────────────────
   Deep midnight navy background (brand) paired with its complementary warm
   gold for the road markings, numbers and icon rings — high-contrast and
   in the same family as the reference infographic. */
const NAVY = "#16294D";
const PEARL = "#F4EFDC";
const GOLD = "#E7B24C";

const VB_W = 600;
const VB_H = 1320;

/**
 * The five stages a Nile Overseas blanket travels through, from raw yarn to a
 * finished, packed product — laid out on a winding road that weaves down the
 * page, mirroring the "5-step process" reference infographic.
 */
const STEPS: Step[] = [
  {
    title: "Raschel",
    description:
      "Premium yarn is knitted on high-gauge Raschel machines, forming the dense, plush base fabric.",
    icon: Layers,
    x: 460,
    y: 200,
  },
  {
    title: "Polish",
    description:
      "The fabric is polished to smooth the surface and even out the pile for a clean finish.",
    icon: Sparkles,
    x: 150,
    y: 450,
  },
  {
    title: "Printing",
    description:
      "Vibrant, high-definition designs are printed on with precision, bringing colour to life.",
    icon: Printer,
    x: 460,
    y: 700,
  },
  {
    title: "Brushing",
    description:
      "The surface is brushed to raise the fibres, creating the ultra-soft, cozy hand-feel.",
    icon: Brush,
    x: 150,
    y: 950,
  },
  {
    title: "Products",
    description:
      "Finished blankets are cut, stitched, quality-checked and packed — ready to ship.",
    icon: PackageCheck,
    x: 460,
    y: 1200,
  },
];

/* Cubic-bezier road threaded vertically through every node, so the tangent at
   each stop is vertical and the S-curves stay smooth. */
const ROAD_PATH = [
  "M 300 40",
  "C 300 130, 460 120, 460 200",
  "C 460 320, 150 330, 150 450",
  "C 150 570, 460 580, 460 700",
  "C 460 820, 150 830, 150 950",
  "C 150 1070, 460 1080, 460 1200",
].join(" ");

export function ProcessesPage() {
  return (
    <section style={{ backgroundColor: NAVY }}>
      <div className="container max-w-3xl py-16 md:py-24">
        <Reveal className="text-center">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: GOLD }}
          >
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

        {/* Road + overlaid stops. The SVG sets the intrinsic aspect ratio; the
            icon badges and text are positioned as percentages of the same box,
            so road and content scale together on every screen size. */}
        <div className="relative mx-auto mt-12 w-full">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="block h-auto w-full"
            fill="none"
            aria-hidden
          >
            <defs>
              <filter id="road-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="8"
                  floodColor="#000"
                  floodOpacity="0.35"
                />
              </filter>
            </defs>
            {/* Road surface */}
            <path
              d={ROAD_PATH}
              stroke={PEARL}
              strokeWidth={34}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#road-shadow)"
            />
            {/* Dashed centre line */}
            <path
              d={ROAD_PATH}
              stroke={GOLD}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="16 20"
            />
          </svg>

          {STEPS.map((step, i) => {
            const leftPct = (step.x / VB_W) * 100;
            const topPct = (step.y / VB_H) * 100;
            const onRight = step.x > VB_W / 2;

            return (
              <div key={step.title}>
                {/* Icon badge, centred exactly on the road node */}
                <div
                  className="absolute z-10"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-300 ease-smooth hover:scale-110 md:h-16 md:w-16"
                    style={{
                      backgroundColor: PEARL,
                      border: `3px solid ${GOLD}`,
                      color: NAVY,
                      boxShadow: `0 0 0 6px ${GOLD}33`,
                    }}
                  >
                    <step.icon className="h-5 w-5 md:h-7 md:w-7" />
                  </span>
                </div>

                {/* Text block, on the opposite side of the road from the node */}
                <div
                  className={[
                    "absolute w-[42%]",
                    onRight ? "left-[2%] text-right" : "right-[2%] text-left",
                  ].join(" ")}
                  style={{ top: `${topPct}%`, transform: "translateY(-50%)" }}
                >
                  <span
                    className="font-serif text-4xl font-bold leading-none md:text-6xl"
                    style={{ color: GOLD }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 text-base font-bold uppercase tracking-wide text-primary-foreground md:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/70 md:mt-2 md:text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
