import type { ComponentType } from "react";
import { Eye, Pencil, ListChecks, Settings, CheckCircle2 } from "lucide-react";
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
   A soft dark slate backdrop (not a flat saturated blue), a clean white road
   with a grey dashed centre line, and white line-icons in dark badges — the
   look of the reference infographic. */
const ROAD_WHITE = "#FFFFFF";
const DASH_GREY = "#9CA3AF";
const BADGE_DARK = "#16294D"; // brand midnight navy

const VB_W = 600;
const VB_H = 1520;

/* Lanes the road switches between, and the mid-points where it jogs across. */
const LANE_R = 440;
const LANE_L = 160;
const R = 44; // corner radius

/**
 * The five stages a Nile Overseas blanket travels through, from raw yarn to a
 * finished, packed product — laid out on a winding, rounded-rectangular road
 * that switchbacks down the page, mirroring the reference "5-step" graphic.
 */
const STEPS: Step[] = [
  {
    title: "Raschel",
    description:
      "Premium yarn is knitted on high-gauge Raschel machines, forming the dense, plush base fabric.",
    icon: Eye,
    x: LANE_R,
    y: 210,
  },
  {
    title: "Polish",
    description:
      "The fabric is polished to smooth the surface and even out the pile for a clean finish.",
    icon: Pencil,
    x: LANE_L,
    y: 520,
  },
  {
    title: "Printing",
    description:
      "Vibrant, high-definition designs are printed on with precision, bringing colour to life.",
    icon: ListChecks,
    x: LANE_R,
    y: 830,
  },
  {
    title: "Brushing",
    description:
      "The surface is brushed to raise the fibres, creating the ultra-soft, cozy hand-feel.",
    icon: Settings,
    x: LANE_L,
    y: 1140,
  },
  {
    title: "Products",
    description:
      "Finished blankets are cut, stitched, quality-checked and packed — ready to ship.",
    icon: CheckCircle2,
    x: LANE_R,
    y: 1450,
  },
];

/* Rounded-rectangular switchback: straight vertical runs down each lane joined
   by short horizontal jogs with quarter-round corners (Q). Every node sits on a
   straight vertical run so the badges rest squarely on the road. */
const ROAD_PATH = [
  `M ${LANE_R} 40`,
  `L ${LANE_R} ${365 - R}`,
  `Q ${LANE_R} 365 ${LANE_R - R} 365`,
  `L ${LANE_L + R} 365`,
  `Q ${LANE_L} 365 ${LANE_L} ${365 + R}`,
  `L ${LANE_L} ${675 - R}`,
  `Q ${LANE_L} 675 ${LANE_L + R} 675`,
  `L ${LANE_R - R} 675`,
  `Q ${LANE_R} 675 ${LANE_R} ${675 + R}`,
  `L ${LANE_R} ${985 - R}`,
  `Q ${LANE_R} 985 ${LANE_R - R} 985`,
  `L ${LANE_L + R} 985`,
  `Q ${LANE_L} 985 ${LANE_L} ${985 + R}`,
  `L ${LANE_L} ${1295 - R}`,
  `Q ${LANE_L} 1295 ${LANE_L + R} 1295`,
  `L ${LANE_R - R} 1295`,
  `Q ${LANE_R} 1295 ${LANE_R} ${1295 + R}`,
  `L ${LANE_R} 1450`,
].join(" ");

export function ProcessesPage() {
  return (
    <section className="bg-secondary">
      <div className="container max-w-4xl py-16 md:py-24">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            How It's Made
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-bold text-primary md:text-5xl">
            Our 5-Step Manufacturing Process
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            From the first thread on the loom to the final packed blanket, every
            piece travels through five carefully crafted stages.
          </p>
        </Reveal>

        {/* The brand-blue lives only inside this rounded panel, framed by the
            light page — so the timeline reads as a contained infographic rather
            than a wall of blue. Road + overlaid stops share one SVG viewBox, so
            road and content scale together on every screen size. */}
        <div className="mx-auto mt-12 w-full max-w-2xl rounded-3xl bg-primary px-4 py-12 shadow-xl md:px-10">
          <div className="relative w-full">
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
                  dy="7"
                  stdDeviation="9"
                  floodColor="#000"
                  floodOpacity="0.4"
                />
              </filter>
            </defs>
            {/* Road surface */}
            <path
              d={ROAD_PATH}
              stroke={ROAD_WHITE}
              strokeWidth={34}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#road-shadow)"
            />
            {/* Dashed centre line */}
            <path
              d={ROAD_PATH}
              stroke={DASH_GREY}
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
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 ease-smooth hover:scale-110 md:h-16 md:w-16"
                    style={{
                      backgroundColor: BADGE_DARK,
                      border: `3px solid ${ROAD_WHITE}`,
                      boxShadow: "0 0 0 6px rgba(255,255,255,0.14)",
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
                  <span className="font-serif text-4xl font-bold leading-none text-white md:text-6xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 text-base font-bold uppercase tracking-wide text-white md:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/65 md:mt-2 md:text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
