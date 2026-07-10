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
      {/* Hero band */}
      <section className="border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="container py-16 text-center md:py-20">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Users className="h-3 w-3" /> Our Clients
          </span>
          <h1 className="mt-4 font-serif text-4xl font-bold text-primary md:text-5xl">
            Trusted by Brands We're Proud to Serve
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We value the relationships behind every blanket we make — from
            established names to growing partners. Here are a few of the
            companies {company} has been privileged to work with.
          </p>
        </div>
      </section>

      {/* Logo grid */}
      <section className="container py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {clients.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
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
      className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 ease-smooth will-change-transform hover:-translate-y-1.5 hover:scale-[1.05] hover:border-accent/40 hover:shadow-xl hover:shadow-primary/10"
      title={client.name}
    >
      <div className="flex h-16 w-full items-center justify-center">
        {client.image_url ? (
          <img
            src={client.image_url}
            alt={client.name}
            loading="lazy"
            className="max-h-16 max-w-[80%] object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
          />
        ) : (
          <ImageOff className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <p className="text-center text-sm font-semibold text-primary/80 transition-colors group-hover:text-primary">
        {client.name}
      </p>
    </div>
  );
}
