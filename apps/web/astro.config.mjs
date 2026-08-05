// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// v2: real intake (Server Actions + Drizzle/Postgres) needs SSR.
// See docs/v2-request-for-regens/architecture.md.
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://regen-acc.vercel.app", // Vercel deploy domain; update again once the v1 launch domain is chosen
  vite: {
    plugins: [tailwindcss()],
    envDir: "../..", // read .env.local from the monorepo root (where `vercel env pull` writes it)
  },
});
