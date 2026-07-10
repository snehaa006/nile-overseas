// Fallback logos in /public/logos, used only until an admin uploads a real
// logo for the brand (stored on products.logo_url via Website Settings).
// Keyed on the alphanumeric-only, lowercased brand name — kept loose (old
// "DRJ"/"Cloud9" names alongside the current "Paris Royale DRJ"/"CloudNine")
// so a brand rename in the database never breaks the fallback lookup.
const FALLBACK_LOGOS: Record<string, string> = {
  cloud9: "/logos/cloudnine.svg",
  cloudnine: "/logos/cloudnine.svg",
  drj: "/logos/paris-royale.svg",
  parisroyale: "/logos/paris-royale.svg",
  parisroyaledrj: "/logos/paris-royale.svg",
};

export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function brandLogo(name: string, uploadedUrl?: string | null): string | undefined {
  return uploadedUrl ?? FALLBACK_LOGOS[name.toLowerCase().replace(/[^a-z0-9]/g, "")];
}
