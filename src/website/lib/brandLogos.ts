// Maps a brand name to its logo asset in /public/logos.
// Keys are matched case-insensitively against the brand's `name`.
const LOGOS: Record<string, string> = {
  cloud9: "/logos/cloudnine.svg",
  cloudnine: "/logos/cloudnine.svg",
  drj: "/logos/paris-royale.svg",
  parisroyale: "/logos/paris-royale.svg",
};

export function brandLogo(name: string): string | undefined {
  return LOGOS[name.toLowerCase().replace(/[^a-z0-9]/g, "")];
}
