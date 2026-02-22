# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                          # Install dependencies
pnpm dev                              # Start dev server (Next.js on :4000)
pnpm turbo build                      # Build all packages (static export to apps/web/out/)
pnpm turbo test                       # Run all tests (Vitest)
pnpm turbo lint                       # Lint all packages
pnpm turbo typecheck                  # Type check all packages

# Scoped commands (run against a specific package)
pnpm --filter @utils-live/tools test                    # Test tools package only
pnpm --filter @utils-live/tools test base64-encode      # Run a single test file (matches filename)
pnpm --filter @utils-live/tools test:watch              # Watch mode
pnpm --filter @utils-live/tools test:coverage           # Coverage (100% threshold enforced)
pnpm --filter @utils-live/web test:e2e                  # Playwright E2E tests

# Tool scaffold generator
pnpm generate:tool -- --name my-tool --category json    # Generate new tool + test
pnpm generate:tool -- --name my-tool --category json --tier client --keywords "foo,bar"

# Formatting
pnpm format                           # Prettier write
pnpm format:check                     # Prettier check
```

## Architecture

**Monorepo** (Turborepo + pnpm workspaces): `apps/web` (Next.js 16, static export) + `packages/tools` (core engine) + `packages/config` (shared ESLint/Prettier).

**Deployment**: Static site on **Cloudflare Pages**. Build output: `apps/web/out/`. No server, database, or auth — all tools run client-side in the browser.

### Tool System (the core abstraction)

Every tool is a **stateless pure function** defined via `defineTool()` in `packages/tools/src/tools/{category}/{tool-name}.ts`. A tool has:

- `meta` — id (`category/tool-name`), name, description, category, tier, keywords, icon
- `inputSchema` / `outputSchema` / `optionsSchema` — Zod schemas
- `execute(input, options)` — pure function, sync or async

All tools are **CLIENT** tier — they run entirely in the browser with no server round-trips.

**Tool registration** is side-effect based: `packages/tools/src/tools/register.ts` imports all tools and calls `globalRegistry.registerTool()`. After creating a new tool, you must: (1) export it from `src/tools/{category}/index.ts`, and (2) add it to the `ALL_TOOLS` array in `register.ts`.

**Tool execution**: `executeTool(tool, input, options)` in `packages/tools/src/core/executor.ts` validates input/options via Zod, runs `execute()` with a tier-based timeout, and returns `ToolResult<T>`.

### How Tools Render in the Web App

URL pattern: `/tools/{category}/{tool-slug}` — server component in `apps/web/app/tools/[category]/[tool]/page.tsx` loads tool data via `getTool()` (which converts Zod schemas to JSON Schema via `zod-to-json-schema`), then passes props to `ToolPageClient`.

**Three layout variants** determined by tool name/schema patterns:

- **Standard** — single input editor → output editor
- **Diff** — two input editors → diff view
- **Generator** — form-based inputs → generated output

All tool pages are **statically generated** at build time via `generateStaticParams()`.

The Monaco Editor wrapper lives at `apps/web/components/editor/code-editor.tsx` — it syncs themes with `next-themes` and supports configurable language, readOnly, minimap, etc.

**UI configuration** per tool is derived from schemas: `inputLanguage`, `outputRenderer` (code/diff/json-tree/markdown/table/html/image/color/diagram), file upload settings.

### Categories

34 categories defined in `packages/tools/src/categories/categories.ts`. Tool IDs must match pattern `^[a-z]+\/[a-z0-9-]+$` and the category portion must exist in the `CATEGORIES` array.

### Environment Variables

Minimal env config. Copy `apps/web/.env.example` → `apps/web/.env.local`. Optional: `NEXT_PUBLIC_APP_URL` (defaults to `https://utils.live`), `NEXT_PUBLIC_STATICFORMS_API_KEY` (contact form).

## Code Conventions

- Tools are **pure functions** — no side effects, no network calls, no DOM access in `packages/tools`
- Components live in `apps/web/components/` (not `packages/ui`)
- Husky + lint-staged runs ESLint + Prettier on commit
- Vitest for unit tests; Playwright for E2E. Tools package enforces **100% coverage thresholds**
- Tool test files mirror source: `packages/tools/tests/tools/{category}/{tool-name}.test.ts`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
