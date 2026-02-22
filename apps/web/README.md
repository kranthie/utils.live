# @utils-live/web

The Next.js web application for [utils.live](https://utils.live) -- a free, open-source developer utilities platform.

## Overview

This is a [Next.js 16](https://nextjs.org/) application using the App Router with static export. It provides the web interface for 700+ developer tools, including:

- **Tool pages** -- statically generated at build time, one per tool
- **Search** -- Cmd/Ctrl+K command palette with fuzzy search
- **Categories** -- browsable categories with tool counts
- **Themes** -- light/dark mode with `next-themes`

## Architecture

```
app/
├── page.tsx                        # Homepage
├── tools/
│   ├── page.tsx                    # All tools listing
│   └── [category]/[tool]/         # Individual tool pages
└── (marketing)/
    ├── about/                     # About page
    └── contact/                   # Contact page

components/
├── editor/                        # Monaco Editor wrapper
├── layout/                        # Header, footer, nav
├── marketing/                     # Landing page components
├── search/                        # Search command palette
├── shared/                        # Reusable UI components
├── tools/                         # Tool-specific components
└── ui/                            # Base UI components (shadcn/ui)
```

## Development

```bash
# Start dev server
pnpm dev

# Build
pnpm build

# Run E2E tests
pnpm test:e2e

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Environment Variables

No `.env` file is required for development -- all env vars have safe defaults.

Optionally, copy `.env.example` to `.env.local` to customize:

- `NEXT_PUBLIC_APP_URL` -- Application URL (defaults to `https://utils.live`)
- `NEXT_PUBLIC_STATICFORMS_API_KEY` -- Contact form submission (optional, form won't submit without it)

## Deployment

Static site deployed to **Cloudflare Pages**. Build output: `apps/web/out/`.
