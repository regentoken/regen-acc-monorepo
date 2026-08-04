# regen-acc-monorepo

The **Regen Accelerator** monorepo. Phase 1 is the **Request for Regens** learning surface — a static Astro site that teaches building regeneration with AI, evidenced by real shipped work.

Structured as a monorepo from day one (pnpm + Turborepo, `apps/*` + `packages/*`), matching the `pokta-care-monorepo` and `godinez-studio` conventions, so future apps/packages/services drop in without a migration.

## Layout

```
regen-acc-monorepo/
├── apps/
│   └── web/                 @regen/web — the Astro learning surface (phase 1)
└── packages/
    └── design-tokens/       @regen/design-tokens — shared design system (starter)
```

Future phases add siblings here: a project-tracking dashboard, a Request for Startups intake form, and Reggie-on-demand status — built in Astro where they fit (Server Islands / Actions), falling back to Next.js (`regen-app`) for wallet/crypto and to Vite/React + Hono for anything heavier. See the design doc, "Long-term architecture: frontend stack."

## Stack

- **Web:** Astro 6 (static output for phase 1), Tailwind 4
- **Design system:** CSS custom properties + Tailwind v4 `@theme`, exported for JS consumers
- **Package manager:** pnpm 10 (`node-linker=hoisted`, see `.npmrc`)
- **Task runner:** Turborepo
- **Node:** 22+

## Develop

```bash
pnpm install
pnpm dev          # all apps via turbo
pnpm dev:web      # just the web app
pnpm build        # build everything
pnpm typecheck
```

The web app dev server runs at `http://localhost:4321`.

## Notes

- **Design tokens are a starter.** `packages/design-tokens` is minimal and real, not final — the full framework-and-tool-agnostic portable system (with a neutral `design-tokens.json` source of truth and Figma/Canva export) is design-doc task T2.
- **Content is placeholder.** `apps/web/src/pages/index.astro` is a structurally-complete learning-surface skeleton with placeholder copy (T3/T4), already respecting the locked word-choice constraints: no capital/funding/grants/investment language, no NDA names, no Token Dad branding.
- **Phase 1 ships zero backend.** When later phases need dynamic behavior, switch `astro.config.mjs` to `output: "server"` + an adapter and use Server Islands / Actions.
