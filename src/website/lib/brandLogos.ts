// Fallback logos in /public/logos, used only until an admin uploads a real
// logo for the brand (stored on products.logo_url via Website Settings).
const FALLBACK_LOGOS: Record<string, string> = {
  cloud9: "/logos/cloudnine.svg",
  cloudnine: "/logos/cloudnine.svg",
  drj: "/logos/paris-royale.svg",
  parisroyale: "/logos/paris-royale.svg",
};

export function brandLogo(name: string, uploadedUrl?: string | null): string | undefined {
  return uploadedUrl ?? FALLBACK_LOGOS[name.toLowerCase().replace(/[^a-z0-9]/g, "")];
}
