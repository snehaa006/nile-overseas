import { ImageOff, Users } from "lucide-react";
import { useClients } from "@/shared/hooks/useClients";
import { useSettings } from "@/shared/hooks/useSettings";
import { Reveal } from "@/shared/components/Reveal";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { Client } from "@/shared/types/models";

export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const { data: settings } = useSettings();
  const company = settings?.company_name ?? "Nile Overseas";

  return (
    <>
      {/* Hero band — soft gradient glow behind the heading, generous top
          spacing so it clears the sticky nav instead of tucking under it. */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/70 via-secondary/25 to-background">
        <div className="pointer-events-none absolute left-1/2 top-4 -z-0 h-72 w-[46rem] max-w-[92vw] -translate-x-1/2 rounded-full bg-brand-ocean/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-20 -z-0 h-56 w-[30rem] max-w-[80vw] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="container relative z-10 pb-16 pt-20 text-center md:pb-20 md:pt-28">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Users className="h-3 w-3" /> Our Clients
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-serif text-4xl font-bold text-primary md:text-5xl">
            Trusted by Brands We're Proud to Serve
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We value the relationships behind every blanket we make — from
            established names to growing partners. Here are a few of the
            companies {company} has been privileged to work with.
          </p>
        </div>
      </section>

      {/* Logo grid — denser layout with defined, tinted tiles. */}
      <section className="container pb-20 pt-12 md:pt-14">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[5/4] rounded-2xl" />
            ))}
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {clients.map((c, i) => (
              <Reveal key={c.id} delay={i * 50}>
                <ClientBox client={c} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed bg-secondary/30 p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-serif text-lg font-semibold text-primary">
              Clients coming soon
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Client logos will appear here as they're added.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function ClientBox({ client }: { client: Client }) {
  return (
    <div
      className="group flex aspect-[5/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-accent/20 bg-gradient-to-br from-secondary to-secondary/40 p-5 shadow-[0_3px_14px_-4px_hsl(var(--primary)/0.22)] transition-all duration-300 ease-smooth will-change-transform hover:-translate-y-1.5 hover:border-accent/60 hover:from-white hover:to-secondary/30 hover:shadow-[0_20px_38px_-14px_hsl(var(--primary)/0.4)]"
      title={client.name}
    >
      <div className="flex h-20 w-full items-center justify-center sm:h-24">
        {client.image_url ? (
          <img
            src={client.image_url}
            alt={client.name}
            loading="lazy"
            className="max-h-20 max-w-[88%] object-contain grayscale transition-all duration-300 group-hover:scale-105 group-hover:grayscale-0 sm:max-h-24"
          />
        ) : (
          <ImageOff className="h-9 w-9 text-muted-foreground" />
        )}
      </div>
      <p className="text-center text-sm font-semibold text-primary/80 transition-colors group-hover:text-primary">
        {client.name}
      </p>
    </div>
  );
}
