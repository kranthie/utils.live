<div align="center">

# utils.live

**Free, open-source developer utilities that run entirely in your browser.**

[Live Site](https://utils.live) &bull; [Report Bug](https://github.com/kranthie/utils.live/issues) &bull; [Request Feature](https://github.com/kranthie/utils.live/issues)

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-blueviolet)](https://turbo.build/)

</div>

---

700+ developer tools across 34 categories -- JSON formatters, encoders, converters, hash generators, regex testers, and more. Every tool runs client-side with zero server round-trips. Your data never leaves your device.

## Features

- **700+ tools** across 34 categories (JSON, text, encoding, crypto, regex, color, datetime, and more)
- **Privacy-first** -- all tools run entirely in your browser, no data leaves your device
- **Instant results** -- zero latency, no loading spinners, no server round-trips
- **Open source** -- MIT licensed, fully transparent, community-driven
- **Static site** -- deployed on Cloudflare Pages for fast global delivery
- **Dark mode** -- full light/dark theme support
- **Keyboard shortcuts** -- Cmd/Ctrl+K search, Cmd/Ctrl+Enter to execute

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 10.0.0

### Setup

```bash
git clone https://github.com/kranthie/utils.live.git
cd utils.live
pnpm install
pnpm dev
```

The app will be available at [http://localhost:4000](http://localhost:4000).

### Build

```bash
pnpm turbo build           # Static export to apps/web/out/
npx serve apps/web/out     # Preview locally
```

## Architecture

Monorepo managed by [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) workspaces:

```
utils.live/
├── apps/
│   └── web/                  # Next.js 16 static site
│       ├── app/              # App Router pages
│       ├── components/       # React components
│       └── public/           # Static assets + Cloudflare config
├── packages/
│   ├── tools/                # Core tool engine (pure functions)
│   │   ├── src/tools/        # Tool implementations by category
│   │   ├── src/core/         # Executor, registry, validation
│   │   └── tests/            # Unit tests (100% coverage enforced)
│   └── config/               # Shared ESLint/Prettier config
```

### How Tools Work

Every tool is a **stateless pure function** defined via `defineTool()`:

- **Schemas** -- Zod-based input, output, and options validation
- **Execute** -- a pure function that transforms input to output
- **Meta** -- id, name, description, category, keywords, icon

All tools are client-tier only -- no server, no database, no API calls.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, static export) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Monorepo | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) |
| Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

The fastest way to contribute is to add a new tool:

```bash
pnpm generate:tool -- --name my-tool --category json
```

This scaffolds the tool implementation and test file. See the contributing guide for details.

## Scripts

```bash
pnpm dev                    # Start development server
pnpm turbo build            # Build all packages
pnpm turbo test             # Run all tests
pnpm turbo lint             # Lint all packages
pnpm turbo typecheck        # Type check all packages
pnpm format                 # Format with Prettier
pnpm generate:tool          # Scaffold a new tool
```

## License

This project is licensed under the [MIT License](LICENSE).
