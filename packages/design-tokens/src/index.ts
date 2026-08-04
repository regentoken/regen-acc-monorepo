/**
 * @regen/design-tokens
 *
 * The Regen Accelerator design system, EXTRACTED from the OG regen.tips system
 * (world-class designer, regen-tips-webapp) as ported to OKLCH + Tailwind v4 in
 * regen-app. CSS custom properties + a Tailwind v4 `@theme` block live in
 * `tokens.css`. Import it from an app's entry stylesheet (after tailwind):
 *
 *   @import "tailwindcss";
 *   @import "@regen/design-tokens/tokens.css";
 *
 * The JS export below mirrors the same values for non-CSS consumers (canvas,
 * OG images, the mycelial-glyph spark animation, etc.).
 */
export const tokensCss = new URL("./tokens.css", import.meta.url).href;

export const tokens = {
  /** OKLCH strings, matching tokens.css :root exactly. Hex refs in comments. */
  color: {
    background: "oklch(0.9918 0.0045 78.3)", // #FEFCF9 Baby Powder
    foreground: "oklch(0.3107 0.0238 314.46)", // #352D39 Raisin Black
    primary: "oklch(0.6135 0.2464 20.91)", // #F5013D Munsell Red
    secondary: "oklch(0.4662 0.0516 284.22)", // #565676 Ultra Violet
    accent: "oklch(0.9047 0.0601 189.65)", // #B2EDE8 Celeste (teal)
    /** the spark / reveal glow — same as accent */
    spark: "oklch(0.9047 0.0601 189.65)",
  },
  /** hex fallbacks for tools that don't take OKLCH */
  hex: {
    background: "#FEFCF9",
    foreground: "#352D39",
    primary: "#F5013D",
    secondary: "#565676",
    accent: "#B2EDE8",
    spark: "#B2EDE8",
  },
  font: {
    headline: '"ivypresto-headline", "Source Serif 4", Georgia, serif',
    display: '"ivypresto-display", "Source Serif 4", Georgia, serif',
    sans: '"stratos", system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, "JetBrains Mono", "SFMono-Regular", monospace',
  },
  radius: "0.5rem",
  /** Adobe Typekit kit that serves ivypresto + stratos. The kit's domain
   *  allowlist must include the deploy domain or the real faces won't load. */
  typekit: "https://use.typekit.net/jfo3jls.css",
} as const;
