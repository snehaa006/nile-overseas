import { ImageOff } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";
import { useProcessPhotos } from "@/shared/hooks/useProcessPhotos";
import { MACHINE_ART } from "../components/ProcessMachines";
import type { ProcessPhotoStep } from "@/shared/api/processPhotos";

type Step = {
  key: ProcessPhotoStep;
  title: string;
  description: string;
};

/**
 * The five stages a Nile Overseas blanket travels through, from raw yarn to a
 * finished, packed product. Each stage shows its 3D machine illustration and
 * a real photo from the floor (uploaded in Website Settings → Process photos).
 */
const STEPS: Step[] = [
  {
    key: "raschel",
    title: "Raschel",
    description:
      "Premium yarn is knitted on high-gauge Raschel machines, forming the dense, plush base fabric.",
  },
  {
    key: "polish",
    title: "Polish",
    description:
      "The fabric is polished to smooth the surface and even out the pile for a clean finish.",
  },
  {
    key: "printing",
    title: "Printing",
    description:
      "Vibrant, high-definition designs are printed on with precision, bringing colour to life.",
  },
  {
    key: "brushing",
    title: "Brushing",
    description:
      "The surface is brushed to raise the fibres, creating the ultra-soft, cozy hand-feel.",
  },
  {
    key: "products",
    title: "Products",
    description:
      "Finished blankets are cut, stitched, quality-checked and packed — ready to ship.",
  },
];

const THREAD_GOLD = "#EFCF7B";

export function ProcessesPage() {
  const { data: photos } = useProcessPhotos();

  return (
    <>
      {/* Light intro header */}
      <section className="bg-secondary">
        <div className="container py-16 text-center md:py-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              How It's Made
            </p>
            <h1 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-bold text-primary md:text-5xl">
              Our 5-Step Manufacturing Process
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              From the first thread on the loom to the final packed blanket,
              every piece travels through five carefully crafted stages.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Full-bleed brand-blue band — the timeline runs edge to edge, with a
          golden yarn flowing down the middle, through each machine, until it
          becomes a blanket at the final stop. */}
      <section className="relative overflow-hidden bg-primary py-16 md:py-24">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-ocean/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-brand-ocean/15 blur-3xl" />

        <div className="container relative">
          <div className="relative">
            {/* The continuous yarn down the centre (drawn behind the stops) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-8 -translate-x-1/2 md:block"
            >
              <svg className="h-full w-full">
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="6" />
                <line
                  x1="50%"
                  y1="0"
                  x2="50%"
                  y2="100%"
                  stroke={THREAD_GOLD}
                  strokeWidth="2.5"
                  strokeDasharray="12 24"
                  className="thread-flow"
                />
              </svg>
            </div>

            <div className="space-y-16 md:space-y-24">
              {STEPS.map((step, i) => (
                <StepRow
                  key={step.key}
                  step={step}
                  index={i}
                  photoUrl={photos?.[step.key] ?? null}
                />
              ))}
            </div>
          </div>

          <Reveal className="relative mt-16 text-center md:mt-24">
            <p className="font-serif text-2xl font-bold text-white md:text-3xl">
              From a single thread… to a finished blanket.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function StepRow({
  step,
  index,
  photoUrl,
}: {
  step: Step;
  index: number;
  photoUrl: string | null;
}) {
  const Machine = MACHINE_ART[step.key];
  const photoLeft = index % 2 === 1; // alternate sides down the timeline

  const text = (
    <div className={photoLeft ? "md:text-left" : "md:text-right"}>
      <span className="font-serif text-5xl font-bold leading-none text-white/90 md:text-6xl">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-1 text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
        {step.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65 md:text-base">
        {step.description}
      </p>
    </div>
  );

  const photo = (
    <div className="overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white/15">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${step.title} process`}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-white/10 text-white/50">
          <ImageOff className="h-8 w-8" />
          <span className="text-xs uppercase tracking-wide">Photo coming soon</span>
        </div>
      )}
    </div>
  );

  return (
    <Reveal>
      <div className="relative grid items-center gap-6 text-center md:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1fr)] md:gap-8 md:text-left">
        {/* The 3D machine sits on the yarn line; on mobile it leads the stack */}
        <div className="order-first md:order-none md:col-start-2 md:row-start-1">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-[#24406E] to-[#0C1830] p-3 shadow-xl ring-4 ring-white/15 transition-transform duration-300 ease-smooth hover:scale-105 md:h-44 md:w-44">
            <Machine />
          </div>
        </div>
        <div className={photoLeft ? "md:col-start-3 md:row-start-1" : "md:col-start-1 md:row-start-1"}>
          {text}
        </div>
        <div className={photoLeft ? "md:col-start-1 md:row-start-1" : "md:col-start-3 md:row-start-1"}>
          {photo}
        </div>
      </div>
    </Reveal>
  );
}
