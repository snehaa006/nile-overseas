import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { useSettings } from "@/shared/hooks/useSettings";

export function Footer() {
  const { data: s } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t bg-primary text-primary-foreground">
      <div className="container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            {s?.logo_url && (
              <img src={s.logo_url} alt="" className="h-9 w-9 object-contain" />
            )}
            <h3 className="font-serif text-xl font-bold">
              {s?.company_name ?? "Nile Overseas"}
            </h3>
          </div>
          <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
            Premium blanket manufacturing — home of the CloudNine and Paris Royale DRJ ranges,
            crafting comfort since {s?.established_year ?? 2014}.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/products" className="hover:text-accent">Products</Link></li>
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
            Get in touch
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            {s?.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {s.phone}
              </li>
            )}
            {s?.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {s.email}
              </li>
            )}
            {s?.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {s.address}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-center text-xs text-primary-foreground/60 sm:flex-row">
          <span>© {year} {s?.company_name ?? "Nile Overseas"}. All rights reserved.</span>
          <Link to="/admin/login" className="text-primary-foreground/40 hover:text-primary-foreground/70">
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
