export const PROFILE_TEMPLATES = {
  midnight: {
    bodyClass: "tpl-midnight",
    headlineFont: "font-grotesk",
    label: "Midnight",
    accent: "#F3B130",
    bg: "#0a0a0a",
  },
  neon: {
    bodyClass: "tpl-neon",
    headlineFont: "font-playfair",
    label: "Neon",
    accent: "#A855F7",
    bg: "#0d0d1a",
  },
  studio: {
    bodyClass: "tpl-studio",
    headlineFont: "font-inter",
    label: "Studio",
    accent: "#38BDF8",
    bg: "#080f1a",
  },
} as const;

export type TemplateKey = keyof typeof PROFILE_TEMPLATES;

export const DEFAULT_TEMPLATE: TemplateKey = "midnight";

// Legacy key mapping (DB may still have old values)
export const LEGACY_TEMPLATE_MAP: Record<string, TemplateKey> = {
  dj_dark: "midnight",
  dj_dark_normalized: "midnight",
  "dj-dark": "midnight",
  tech_clean: "studio",
  "tech-clean": "studio",
};
