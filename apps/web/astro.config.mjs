// @ts-check
import { config } from "dotenv";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// Server code reads secrets via `process.env` (a true runtime lookup, not
// baked into the build like `import.meta.env` would be). Locally there's no
// shell env to read from, so load the monorepo root's `.env.local` (where
// `vercel env pull` writes it) into process.env for `astro dev`/`astro build`.
// In production Vercel already injects these directly; this is a no-op there.
config({ path: "../../.env.local" });

// v2: real intake (Server Actions + Drizzle/Postgres) needs SSR.
// See docs/v2-request-for-regens/architecture.md.
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://regen-acc.vercel.app", // Vercel deploy domain; update again once the v1 launch domain is chosen
  vite: {
    plugins: [tailwindcss()],
  },
});
