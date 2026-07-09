import type { ReactNode } from "react";
import { useInView } from "@/shared/hooks/useInView";
import { cn } from "@/shared/utils/cn";

type Tag = "div" | "section";

/** Fades + slides a section in the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: Tag;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const style = { transitionDelay: inView ? `${delay}ms` : "0ms", willChange: "transform, opacity" };
  const classes = cn(
    "transition-[transform,opacity] duration-700 ease-out",
    inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
    className,
  );

  if (as === "section") {
    return (
      <section ref={ref} style={style} className={classes}>
        {children}
      </section>
    );
  }
  return (
    <div ref={ref} style={style} className={classes}>
      {children}
    </div>
  );
}
