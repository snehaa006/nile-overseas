import type { CSSProperties } from "react";
import { ImageOff } from "lucide-react";
import type { Client } from "@/shared/types/models";

/* Scrapbook-style rotations, cycled per card (ported from KBI's timeline). */
const TOP_ROT = [-2, 1.5, -1, 2];
const BOT_ROT = [2.5, -1.5, 1, -2];
const COL_W = 168; // px per timeline column

/**
 * Horizontal "Our Clients" timeline — a 1:1 structural port of the KBI
 * about-page journey timeline: alternating top/bottom cards strung along a
 * centre line with dots. Clients come from the DB (managed in the staff panel),
 * so adding a client there makes it appear here automatically.
 */
export function ClientsTimeline({ clients }: { clients: Client[] }) {
  if (clients.length === 0) return null;

  return (
    <section className="overflow-hidden bg-primary py-16 md:py-20">
      <div className="container">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Our Clients
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
          Trusted by Brands We're Proud to Serve
        </h2>
      </div>

      <div
        className="mt-10 overflow-x-auto pb-2"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%)",
          scrollbarWidth: "none",
        }}
      >
        <div className="mx-auto grid min-w-max grid-rows-[auto_auto_auto] px-6">
          {/* ── Top row (even-indexed clients) ── */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${clients.length}, ${COL_W}px)` }}
          >
            {clients.map((c, i) => (
              <div
                key={c.id}
                className="relative flex items-end justify-center px-2 pb-5"
                style={{ minHeight: 210 }}
              >
                {i % 2 === 0 && (
                  <>
                    <TimelineCard
                      client={c}
                      rotate={TOP_ROT[(i / 2) % TOP_ROT.length]}
                    />
                    <span className="absolute bottom-0 left-1/2 h-5 w-0.5 -translate-x-1/2 rounded bg-accent" />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ── Centre line + dots ── */}
          <div className="relative flex h-9 items-center">
            <span
              className="absolute inset-x-0 h-0.5 rounded"
              style={{
                background:
                  "linear-gradient(to right, hsl(var(--accent) / 0.25), hsl(var(--accent)), hsl(var(--accent) / 0.25))",
              }}
            />
            <div
              className="relative z-10 grid"
              style={{ gridTemplateColumns: `repeat(${clients.length}, ${COL_W}px)` }}
            >
              {clients.map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1">
                  <span
                    className="h-4 w-4 rounded-full border-[3px] border-accent bg-primary transition-transform duration-200 hover:scale-125"
                    style={{ boxShadow: "0 0 0 4px hsl(var(--accent) / 0.22)" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom row (odd-indexed clients) ── */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${clients.length}, ${COL_W}px)` }}
          >
            {clients.map((c, i) => (
              <div
                key={c.id}
                className="relative flex items-start justify-center px-2 pt-5"
                style={{ minHeight: 210 }}
              >
                {i % 2 === 1 && (
                  <>
                    <span className="absolute top-0 left-1/2 h-5 w-0.5 -translate-x-1/2 rounded bg-accent" />
                    <TimelineCard
                      client={c}
                      rotate={BOT_ROT[((i - 1) / 2) % BOT_ROT.length]}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineCard({
  client,
  rotate,
}: {
  client: Client;
  rotate: number;
}) {
  return (
    <div
      className="tl-card flex w-[154px] flex-col gap-2"
      style={{ ["--rot" as string]: `${rotate}deg` } as CSSProperties}
    >
      <div
        className="h-[110px] w-full overflow-hidden rounded-xl bg-secondary"
        style={{ boxShadow: "0 6px 22px rgba(13,26,58,.35)" }}
      >
        {client.image_url ? (
          <img
            src={client.image_url}
            alt={client.name}
            loading="lazy"
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </div>
      <p className="text-center text-xs font-bold text-primary-foreground">
        {client.name}
      </p>
    </div>
  );
}
