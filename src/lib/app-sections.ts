/** The sections of the logged-in app, in navigation order. */
export const appSections = [
  { key: "home", href: "/home" },
  { key: "inventory", href: "/inventory" },
  { key: "patterns", href: "/patterns" },
  { key: "projects", href: "/projects" },
  { key: "offers", href: "/offers" },
  { key: "finances", href: "/finances" },
  { key: "settings", href: "/settings" },
] as const;

export type AppSection = (typeof appSections)[number];
