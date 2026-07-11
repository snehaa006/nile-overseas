import { Facebook, Instagram, Twitter, User } from "lucide-react";
import type { SiteSettings } from "@/shared/types/models";
import type { TeamMember } from "@/shared/types/models";
import { Reveal } from "@/shared/components/Reveal";

const SOCIALS = [
  { icon: Instagram, label: "instagram." },
  { icon: Facebook, label: "facebook." },
  { icon: Twitter, label: "twitter." },
];

/**
 * "The Team." — a collage-style team intro for the About page, ported from
 * the KBI reference layout. Photos come from the same team_members data
 * used by the Home page's "Our Team" grid.
 */
export function TeamCollage({
  members,
  settings,
  establishedYear,
  yearsOfCraft,
  brandCount,
}: {
  members: TeamMember[];
  settings: SiteSettings | undefined;
  establishedYear: number;
  yearsOfCraft: number;
  brandCount: number;
}) {
  if (members.length === 0) return null;
  const [a, b, c] = members;

  return (
    <section className="container py-16">
      <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-14">
        <Reveal className="grid grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-4 sm:gap-5">
            <TeamPhoto member={a} className="aspect-[4/5]" />
            {b && <TeamPhoto member={b} className="aspect-[4/3]" />}
          </div>
          {c && (
            <div className="mt-10 sm:mt-16">
              <TeamPhoto member={c} className="aspect-[3/4]" />
            </div>
          )}
        </Reveal>

        <Reveal delay={100}>
          <h2 className="font-serif text-4xl font-black uppercase tracking-tight text-primary sm:text-5xl">
            The Team.
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p className="whitespace-pre-line leading-relaxed">
              {settings?.about_text ??
                `${settings?.company_name ?? "Nile Overseas"} is a blanket manufacturing company producing premium blankets under the CloudNine and Paris Royale DRJ brands. Since ${establishedYear}, we've combined traditional craftsmanship with modern manufacturing to deliver warmth, softness and durability.`}
            </p>
            <p className="leading-relaxed">
              Meet the people who bring warmth, craft and care to every{" "}
              {settings?.company_name ?? "Nile Overseas"} blanket — from the
              production floor to your doorstep.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <TeamStat value={`${establishedYear}`} label="Founded" />
            <TeamStat value={`${yearsOfCraft}+`} label="Years of Craft" />
            <TeamStat value={`${members.length}`} label="Team Members" />
            <TeamStat value={`${brandCount}`} label="Brands" />
          </div>

          <div className="mt-8 flex items-center gap-5">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                aria-hidden="true"
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:text-accent"
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TeamPhoto({ member, className }: { member: TeamMember; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-secondary shadow-lg ${className ?? ""}`}
    >
      {member.image_url ? (
        <img
          src={member.image_url}
          alt={member.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground">
          <User className="h-10 w-10" />
        </div>
      )}
    </div>
  );
}

function TeamStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-3xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
