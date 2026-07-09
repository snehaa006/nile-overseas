import { Phone, Mail, MapPin, MessageCircle, ExternalLink } from "lucide-react";
import { useSettings } from "@/shared/hooks/useSettings";
import { LoadingState } from "@/shared/components/StateViews";

export function ContactPage() {
  const { data: s, isLoading } = useSettings();

  if (isLoading) return <div className="container"><LoadingState /></div>;

  const rows = [
    s?.phone && { icon: Phone, label: "Phone", value: s.phone, href: `tel:${s.phone}` },
    s?.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: s.whatsapp,
      href: `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`,
    },
    s?.email && { icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` },
    s?.address && { icon: MapPin, label: "Address", value: s.address, href: s.map_link ?? undefined },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <div className="container max-w-4xl py-16">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-primary">Get in Touch</h1>
        <p className="mt-3 text-muted-foreground">
          We'd love to hear from you. Reach out for orders, pricing or partnership enquiries.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {rows.map((r) => (
          <a
            key={r.label}
            href={r.href}
            target={r.href?.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-start gap-4 rounded-xl border bg-card p-6 transition hover:shadow-md"
          >
            <div className="rounded-lg bg-accent/10 p-3 text-accent">
              <r.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {r.label}
              </p>
              <p className="mt-1 font-medium">{r.value}</p>
            </div>
          </a>
        ))}
      </div>

      {s?.map_link && (
        <a
          href={s.map_link}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          Open in Google Maps <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
