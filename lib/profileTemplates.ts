export const PROFILE_TEMPLATES = {
  tech_clean: {
    bodyClass: "tpl-tech-clean",
    headlineFont: "font-inter",
    label: "Technician / Crew",
  },
  dj_dark: {
    bodyClass: "tpl-dj-dark",
    headlineFont: "font-grotesk",
    label: "DJ / Music Artist",
  },
  dancer_light: {
    bodyClass: "tpl-dancer-light",
    headlineFont: "font-playfair",
    label: "Dancer / Performer",
  },
} as const;

// 👇 THIS is the key part
export type TemplateKey = keyof typeof PROFILE_TEMPLATES;

export const DEFAULT_TEMPLATE: TemplateKey = "tech_clean";
