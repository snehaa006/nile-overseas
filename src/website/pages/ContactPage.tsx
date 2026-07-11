import { useState } from "react";
import { Mail, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/shared/hooks/useSettings";
import { useClients } from "@/shared/hooks/useClients";
import { useCreateReview } from "@/shared/hooks/useReviews";
import { LoadingState, Spinner } from "@/shared/components/StateViews";
import { Reveal } from "@/shared/components/Reveal";
import { cn } from "@/shared/utils/cn";
import type { SiteSettings } from "@/shared/types/models";

/**
 * Contact page — a 1:1 structural port of the reference template:
 * hero title band → partner logo strip → enquiry form with a side card
 * (customer reviews instead of the reference's newsletter box) → three
 * contact info cards → embedded map.
 */
export function ContactPage() {
  const { data: s, isLoading } = useSettings();
  const { data: clients } = useClients();

  if (isLoading) return <div className="container"><LoadingState /></div>;

  const infoCards = [
    s?.phone && {
      icon: Phone,
      value: s.phone,
      text: "Call us for orders, bulk pricing and enquiries.",
      href: `tel:${s.phone}`,
    },
    s?.whatsapp && {
      icon: MessageCircle,
      value: s.whatsapp,
      text: "Message us on WhatsApp — we reply quickly.",
      href: `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`,
    },
    s?.email && {
      icon: Mail,
      value: s.email,
      text: "Write to us and we'll get back to you shortly.",
      href: `mailto:${s.email}`,
    },
    s?.address && {
      icon: MapPin,
      value: s.address,
      text: "Find us on the map below.",
      href: s.map_link ?? undefined,
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    value: string;
    text: string;
    href?: string;
  }[];

  const gridCols =
    infoCards.length >= 4
      ? "lg:grid-cols-4"
      : infoCards.length === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-2";

  const logoClients = (clients ?? []).filter((c) => c.image_url).slice(0, 6);

  return (
    <>
      {/* Hero band — big centred title with squiggle underline + chevrons. */}
      <section className="relative overflow-hidden rounded-b-[3rem] bg-secondary/70">
        <ChevronDecor className="absolute left-4 top-8 h-16 w-auto text-primary/15 md:left-16" />
        <ChevronDecor className="absolute -right-5 top-1/2 h-14 w-auto -translate-y-1/2 text-primary/15 md:right-10" />
        <div className="container relative animate-fade-in-up py-16 text-center md:py-20">
          <h1 className="font-serif text-5xl font-bold text-primary md:text-6xl">
            Contact Us
          </h1>
          <Squiggle className="mx-auto mt-3 h-3 w-44 text-primary/60" />
          <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground md:text-base">
            We'd love to hear from you. Reach out for orders, pricing or
            partnership enquiries — crafting blankets since{" "}
            {s?.established_year ?? 2014}.
          </p>
        </div>
      </section>

      {/* Partner logo strip under the hero, like the reference. */}
      {logoClients.length > 0 && (
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-10">
            {logoClients.map((c) => (
              <img
                key={c.id}
                src={c.image_url!}
                alt={c.name}
                title={c.name}
                loading="lazy"
                className="h-10 w-auto max-w-32 object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-12"
              />
            ))}
          </div>
        </div>
      )}

      {/* Enquiry form + customer reviews card. */}
      <section className="container py-12">
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <EnquiryForm settings={s} />
          <ReviewFormCard />
        </div>
      </section>

      {/* Contact info cards. */}
      {infoCards.length > 0 && (
        <section className="container pb-12">
          <div className={cn("grid gap-6 sm:grid-cols-2", gridCols)}>
            {infoCards.map((card, i) => {
              const Comp = card.href ? "a" : "div";
              return (
                <Comp
                  key={card.value}
                  href={card.href}
                  target={card.href?.startsWith("http") ? "_blank" : undefined}
                  rel={card.href?.startsWith("http") ? "noreferrer" : undefined}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={cn(
                    "animate-fade-in-up rounded-3xl p-7 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lg",
                    i < infoCards.length - 1
                      ? "bg-secondary/70"
                      : "border bg-card shadow-sm",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <card.icon
                      className="h-9 w-9 shrink-0 text-primary"
                      strokeWidth={1.25}
                    />
                    <p className="min-w-0 break-words font-semibold text-primary">
                      {card.value}
                    </p>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{card.text}</p>
                </Comp>
              );
            })}
          </div>
        </section>
      )}

      {/* Map embed. */}
      {s?.address && (
        <Reveal as="section" className="container pb-16">
          <iframe
            title={`Map — ${s.address}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`}
            className="h-80 w-full rounded-3xl border"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </Reveal>
      )}
    </>
  );
}

const FIELD =
  "h-12 w-full rounded-full border-0 bg-secondary/70 px-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

/** The main enquiry form — submits via the visitor's mail app (or WhatsApp). */
function EnquiryForm({ settings }: { settings: SiteSettings | null | undefined }) {
  const [form, setForm] = useState({ email: "", phone: "", name: "", message: "" });
  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please add your name and a message");
      return;
    }
    const lines = [`Name: ${form.name.trim()}`];
    if (form.email.trim()) lines.push(`Email: ${form.email.trim()}`);
    if (form.phone.trim()) lines.push(`Phone: ${form.phone.trim()}`);
    lines.push("", form.message.trim());
    const body = lines.join("\n");

    if (settings?.email) {
      const subject = `Website enquiry from ${form.name.trim()}`;
      window.location.href = `mailto:${settings.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (settings?.whatsapp) {
      window.open(
        `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`,
        "_blank",
      );
    } else {
      toast.error("Contact details are not configured yet");
    }
  };

  return (
    <form onSubmit={submit} className="animate-fade-in-up">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="email"
          placeholder="Email"
          className={FIELD}
          value={form.email}
          onChange={set("email")}
        />
        <input
          type="tel"
          placeholder="Phone"
          className={FIELD}
          value={form.phone}
          onChange={set("phone")}
        />
      </div>
      <input
        placeholder="Name"
        className={cn(FIELD, "mt-4")}
        value={form.name}
        onChange={set("name")}
      />
      <textarea
        placeholder="Message"
        rows={7}
        className="mt-4 w-full resize-none rounded-3xl border-0 bg-secondary/70 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={form.message}
        onChange={set("message")}
      />
      <button
        type="submit"
        className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        Submit
      </button>
    </form>
  );
}

/** Side card — customer reviews (in place of the reference's newsletter box). */
function ReviewFormCard() {
  const create = useCreateReview();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Please add your name and review");
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        rating,
        message: message.trim(),
      });
      toast.success("Thank you! Your review is now live on our website.");
      setName("");
      setRating(5);
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit review");
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ animationDelay: "120ms" }}
      className="relative animate-fade-in-up self-start overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground sm:p-8"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-ocean/25 blur-2xl" />
      <h2 className="relative font-serif text-2xl font-bold">Customer Reviews</h2>
      <p className="relative mt-2 text-sm text-primary-foreground/75">
        Loved your Nile Overseas blanket? Share your experience — your review
        appears on our website.
      </p>
      <input
        placeholder="Your name"
        className="relative mt-5 h-11 w-full rounded-full border-0 bg-white px-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="relative mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-6 w-6",
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-primary-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Your review"
        rows={4}
        className="relative mt-4 w-full resize-none rounded-2xl border-0 bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        disabled={create.isPending}
        className="relative mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-noir text-sm font-medium text-white transition-all hover:bg-brand-noir/85 active:scale-[0.98] disabled:opacity-60"
      >
        {create.isPending && <Spinner className="h-4 w-4" />} Submit Review
      </button>
    </form>
  );
}

/** Hand-drawn squiggle under the hero title, as in the reference. */
function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 176 12" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 8c15-6 28-6 43 0s28 6 43 0 28-6 43 0 26 5 43-2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Stacked outline chevrons decorating the hero band, as in the reference. */
function ChevronDecor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 72"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l16 15L6 36" />
      <path d="M30 6l16 15-16 15" />
      <path d="M54 6l16 15-16 15" />
      <path d="M18 36l16 15-16 15" />
      <path d="M42 36l16 15-16 15" />
      <path d="M66 36l16 15-16 15" />
    </svg>
  );
}
