/**
 * @regen/design-tokens
 *
 * STARTER design system for Regen Accelerator. The CSS custom properties +
 * Tailwind v4 `@theme` block live in `tokens.css`. Import it from an app's
 * entry stylesheet:
 *
 *   @import "@regen/design-tokens/tokens.css";
 *
 * Design doc T2 expands this into a framework-and-tool-agnostic portable
 * system (neutral `design-tokens.json` source of truth + Figma/Canva export).
 * The JS export below exists so non-CSS consumers (charts, canvas, OG images)
 * can read the same raw values.
 */
export const tokensCss = new URL("./tokens.css", import.meta.url).href;

export const tokens = {
  color: {
    ink: "#14161a",
    graphite: "#3a3f47",
    paper: "#f6f5f2",
    surface: "#ffffff",
    accent: "#2f7d5b",
    accentInk: "#ffffff",
  },
  font: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    serif: '"Source Serif 4", Georgia, serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  radius: {
    sm: "0.25rem",
    base: "0.5rem",
    lg: "1rem",
  },
} as const;
