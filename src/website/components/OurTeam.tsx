import { User } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";
import type { TeamMember } from "@/shared/types/models";

/**
 * "Ownership and management" — the closing section of the Home page, styled
 * after the reference slide: a navy header band with the title on the left,
 * and white member cards whose circular portraits straddle the band's bottom
 * edge. Members come from the DB (managed in the staff panel under Website
 * Settings), so adding, editing or removing a person there updates this
 * section automatically — the cards wrap and stay centered whatever the count.
 */
export function OurTeam({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <section className="container pb-20">
      {/* Navy band. The generous bottom padding is the space the overlapping
          cards are pulled up into (see the negative margin below). */}
      <div className="rounded-[2rem] bg-primary px-6 pb-48 pt-10 shadow-xl sm:px-10 md:pt-14 lg:px-14">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <h2 className="font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
                Ownership and management.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
                The people who own and run Nile Overseas.
              </p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/70 md:text-right">
              Meet the people who bring warmth, craft and care to every Nile
              Overseas blanket — from the production floor to your doorstep.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Cards overlap the navy band so each portrait sits half on navy, half
          on white — flex-wrap keeps 3, 4 or more cards centered and tidy. */}
      <div className="-mt-40 flex flex-wrap justify-center gap-6 px-4 sm:px-8">
        {members.map((member, i) => (
          <Reveal
            key={member.id}
            delay={i * 100}
            className="w-full max-w-[17rem] sm:w-[17rem]"
          >
            <TeamCard member={member} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <article className="flex h-full flex-col items-center rounded-2xl bg-card px-5 pb-6 pt-6 text-center shadow-lg transition-all duration-300 ease-smooth hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20">
      <div className="h-36 w-36 overflow-hidden rounded-full bg-secondary ring-4 ring-white/20">
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground">
            <User className="h-12 w-12" />
          </div>
        )}
      </div>

      <h3 className="mt-4 font-serif text-lg font-bold text-primary">
        {member.name}
      </h3>
      {member.role && (
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
          {member.role}
        </p>
      )}
      {member.description && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {member.description}
        </p>
      )}
    </article>
  );
}
