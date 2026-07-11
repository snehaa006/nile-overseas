import { ImageOff, Quote } from "lucide-react";
import type { SiteSettings } from "@/shared/types/models";
import { Reveal } from "@/shared/components/Reveal";

const FALLBACK_QUOTE =
  "Every blanket we send out the door is a promise of warmth, softness and lasting comfort.";

/** Pulls a short pull-quote from the About text, falling back to a default line. */
function pullQuote(aboutText: string | null | undefined): string {
  if (!aboutText) return FALLBACK_QUOTE;
  const firstSentence = aboutText.split(/(?<=[.!?])\s/)[0]?.trim();
  return firstSentence && firstSentence.length > 12 ? firstSentence : FALLBACK_QUOTE;
}

/**
 * Quote + photo layout for the About page, ported from the design-agency
 * reference: a wide work photo, a pull-quote credited to the company, and a
 * narrower portrait photo. Photos are managed from Website Settings.
 */
export function QuoteAndPhotos({ settings }: { settings: SiteSettings | undefined }) {
  const quote = pullQuote(settings?.about_text);
  const companyName = settings?.company_name ?? "Nile Overseas";

  return (
    <section className="container py-16">
      <Reveal className="overflow-hidden rounded-2xl">
        <PhotoOrPlaceholder src={settings?.about_photo_1_url} className="aspect-[16/9]" />
      </Reveal>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:items-center sm:gap-12">
        <Reveal delay={80}>
          <Quote className="h-8 w-8 fill-accent text-accent" />
          <blockquote className="mt-4 font-serif text-2xl italic leading-snug text-primary sm:text-3xl">
            {quote}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— {companyName}</p>
        </Reveal>

        <Reveal delay={160} className="overflow-hidden rounded-2xl">
          <PhotoOrPlaceholder src={settings?.about_photo_2_url} className="aspect-[3/4]" />
        </Reveal>
      </div>
    </section>
  );
}

function PhotoOrPlaceholder({ src, className }: { src?: string | null; className?: string }) {
  return (
    <div className={`w-full border bg-secondary ${className ?? ""}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-muted text-muted-foreground">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm">Photo coming soon</span>
        </div>
      )}
    </div>
  );
}
