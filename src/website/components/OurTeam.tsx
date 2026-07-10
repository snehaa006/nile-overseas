import { Dribbble, Facebook, Github, Twitter, User } from "lucide-react";
import { Reveal } from "@/shared/components/Reveal";
import type { TeamMember } from "@/shared/types/models";

/* Decorative social row — mirrors the reference design. Icons are visual only
   (there are no per-person social links to manage), so they're non-interactive. */
const SOCIALS = [Facebook, Twitter, Dribbble, Github];

/**
 * "Our Team" — the closing section of the Home page. Members come from the DB
 * (managed in the staff panel under Website Settings → Our Team), so adding,
 * editing or removing a person there updates this section automatically.
 */
export function OurTeam({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <section className="container pb-20">
      <div className="rounded-[2rem] border-[6px] border-primary bg-secondary/40 p-6 sm:p-10 lg:p-14">
        <Reveal>
          <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
            Our Team
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Meet the people who bring warmth, craft and care to every Nile
            Overseas blanket — from the production floor to your doorstep.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, i) => (
            <Reveal key={member.id} delay={i * 100}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 ease-smooth hover:-translate-y-2 hover:border-accent/40 hover:shadow-xl hover:shadow-primary/10">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary">
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground">
            <User className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <h3 className="font-serif text-lg font-bold text-primary">
          {member.name}
        </h3>
        {member.role && (
          <p className="mt-0.5 text-sm font-medium text-accent">{member.role}</p>
        )}
        {member.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {member.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 pt-1 text-muted-foreground">
          {SOCIALS.map((Icon, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="transition-all duration-200 hover:scale-125 hover:text-accent"
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
