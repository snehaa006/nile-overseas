import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useSettings } from "@/shared/hooks/useSettings";
import { cn } from "@/shared/utils/cn";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/processes", label: "Processes" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="" className="h-9 w-9 object-contain" />
          )}
          <span className="font-serif text-xl font-bold tracking-tight text-primary">
            {settings?.company_name ?? "Nile Overseas"}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative text-sm font-medium transition-colors hover:text-accent",
                  isActive ? "text-accent" : "text-foreground/70",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-px bg-accent transition-all duration-300 ease-smooth",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <button
          className="transition-transform active:scale-90 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 transition-all duration-300 ease-smooth md:hidden",
          open ? "max-h-64 border-opacity-100" : "max-h-0 border-opacity-0",
        )}
      >
        <div className="container flex flex-col py-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "py-3 text-sm font-medium transition-colors",
                  isActive ? "text-accent" : "text-foreground/70",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
