// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Phase 1: fully static output. The learning surface ships zero backend.
// Future phases (dashboard, intake, Reggie-on-demand status) switch this to
// `output: "server"` + an adapter and use Astro Server Islands / Actions.
// See the design doc, "Long-term architecture: frontend stack."
export default defineConfig({
  output: "static",
  site: "https://regen-accelerator-web.pages.dev", // placeholder — set real domain at deploy
  vite: {
    plugins: [tailwindcss()],
  },
});
