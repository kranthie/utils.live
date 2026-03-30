# Contributing to utils.live

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/<your-username>/utils.live.git
   cd utils.live
   ```

2. **Install dependencies** (requires [Node.js](https://nodejs.org/) >= 20 and [pnpm](https://pnpm.io/) >= 10):

   ```bash
   pnpm install
   ```

3. **Start the dev server**:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:4000](http://localhost:4000) to see the site.

## Adding a New Tool

This is the easiest and most impactful way to contribute.

### 1. Scaffold the tool

```bash
pnpm generate:tool -- --name my-tool --category json --keywords "foo,bar"
```

This creates two files:

- `packages/tools/src/tools/{category}/{tool-name}.ts` -- implementation
- `packages/tools/tests/tools/{category}/{tool-name}.test.ts` -- tests

### 2. Implement the tool

Every tool is a **stateless pure function** defined with `defineTool()`. Look at existing tools in the same category for patterns. Key rules:

- Tools must be **pure functions** -- no side effects, no network calls, no DOM access
- Use **Zod schemas** for input, output, and options validation
- All tools run **client-side only** (tier: `client`)

### 3. Register the tool

After implementing:

1. Export it from `packages/tools/src/tools/{category}/index.ts`
2. Add it to the `ALL_TOOLS` array in `packages/tools/src/tools/register.ts`

### 4. Write tests

The tools package enforces **100% code coverage**. Your tests should cover:

- Happy path with typical input
- Edge cases (empty input, large input, special characters)
- All options/modes
- Error cases

Run tests:

```bash
pnpm --filter @utils-live/tools test my-tool          # Run your test
pnpm --filter @utils-live/tools test:coverage          # Check coverage
```

### 5. Verify everything

```bash
pnpm turbo typecheck        # No type errors
pnpm turbo lint             # No lint errors
pnpm turbo test             # All tests pass
```

## Project Structure

```
apps/web/           # Next.js frontend (static export)
packages/tools/     # Core tool engine (pure functions + tests)
packages/config/    # Shared ESLint/Prettier config
```

## Dependency Version Policy

All dependencies in this repo use **exact (fixed) version pinning** — no `^` or `~` range specifiers.

- `.npmrc` sets `save-exact=true` so `pnpm add <pkg>` automatically records the exact installed version.
- Catalog entries in `pnpm-workspace.yaml` are also pinned exactly.
- When upgrading a dependency, update the version number explicitly in `package.json` (and in the catalog if it's a catalog entry). Do not restore range specifiers.

This policy prevents unexpected behavior from patch/minor bumps on reinstall and ensures every contributor and CI run uses identical dependency versions.

## Code Style

- **Formatting**: Prettier runs automatically on commit via Husky + lint-staged
- **Linting**: ESLint with TypeScript rules
- **Naming**: Tool IDs follow `category/tool-name` pattern (lowercase, hyphens)
- **No comments** unless the logic isn't self-evident

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Run `pnpm turbo typecheck && pnpm turbo test && pnpm turbo lint`
4. Open a PR with a clear description of what you changed and why

## Categories

There are 34 categories defined in `packages/tools/src/categories/categories.ts`. If your tool doesn't fit an existing category, open an issue to discuss adding a new one.

## Deployment

utils.live is hosted on **Cloudflare Pages**. Deployment is fully automatic — there is **no deploy CI step needed**.

- **Every commit to `main`** is automatically built and deployed by Cloudflare Pages.
- Cloudflare Pages detects the push via its GitHub integration and runs `pnpm turbo build`, serving the output from `apps/web/out/`.
- Preview deployments are created automatically for every pull request.
- Do **not** add a GitHub Actions deploy workflow — it is unnecessary and will cause double-builds.

To check deployment status, visit the [Cloudflare Pages dashboard](https://dash.cloudflare.com/) for the `utils-live` project.

## Questions?

Open an [issue](https://github.com/kranthie/utils.live/issues) -- we're happy to help.
