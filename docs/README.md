# utils.live Documentation

> Technical documentation for the utils.live developer utilities platform.

---

## Documents

| Document | Description |
|----------|-------------|
| [Product Specification](./product-specification.md) | Complete product requirements, features, user tiers, database schema, and security requirements |
| [Architecture](./architecture.md) | System design, monorepo structure, tool engine, API design, and infrastructure |
| [Implementation Plan](./implementation-plan.md) | Step-by-step implementation guide with all 815 tools organized by phase |
| [Tool Catalog](./tool-catalog.md) | Complete catalog of all 815 tools with categories, tiers, and credit costs |

---

## Quick Reference

### Tech Stack

```
Frontend:      Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:       Next.js API Routes + Prisma ORM
Database:      PostgreSQL (GCP Cloud SQL)
Cache:         Upstash Redis
Auth:          NextAuth.js (Google + GitHub OAuth)
Payments:      Stripe
AI:            OpenRouter (Gemini 2.5 Flash)
Hosting:       GCP Cloud Run
Monitoring:    Sentry + PostHog + GA4
Testing:       Vitest + Playwright
```

### Tool Tiers

| Tier | Icon | Count | Cost |
|------|------|-------|------|
| Client-side | 🟢 | ~750 | Free within limits |
| Server Light | 🟡 | ~30 | 1 credit |
| Server Heavy | 🟠 | ~13 | 2-5 credits |
| AI-Powered | 🔴 | ~22 | 1-10 credits |

### User Tiers

| Tier | Daily Ops | Max Input | API Access |
|------|-----------|-----------|------------|
| Anonymous | 50 | 100KB | No |
| Logged-in (Free) | 200 | 500KB | No |
| Credit User | Unlimited | 10MB | Yes |

### Credit Packages

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 100 | $1 |
| Basic | 500 | $5 |
| Standard | 1,200 | $10 |
| Pro | 3,500 | $25 |
| Power | 8,000 | $50 |

---

## Project Structure

```
utils.live/
├── apps/
│   └── web/                    # Next.js application
├── packages/
│   ├── tools/                  # Core tool logic (isomorphic)
│   ├── mcp/                    # MCP server for AI assistants
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configurations
├── docs/                       # Documentation (you are here)
├── scripts/                    # Build and generation scripts
└── .github/                    # CI/CD workflows
```

---

## Key URLs

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/tools` | All tools grid |
| `/tools/[category]` | Category page |
| `/tools/[category]/[tool]` | Tool page |
| `/pricing` | Credit packages |
| `/dashboard` | User dashboard |
| `/api/v1/tools/...` | Tool API endpoints |

---

## Getting Started

See [Implementation Plan](./implementation-plan.md) for the complete build guide.

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- GCP account (for deployment)

### Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/utils.live.git
cd utils.live

# Install dependencies
pnpm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

---

## Implementation Phases

1. **Project Foundation** - Monorepo, Next.js, database, auth
2. **Tool Engine** - All 815 tools with isomorphic architecture
3. **UI Components** - shadcn/ui, custom components, layouts
4. **Pages & Routes** - Marketing, tools, dashboard pages
5. **API Routes** - Tool endpoints, user management, payments
6. **Payments** - Stripe integration, credit system
7. **MCP Server** - AI assistant integration
8. **Testing** - Unit, integration, E2E tests
9. **SEO & Performance** - Optimization, caching, CDN
10. **Deployment** - GCP Cloud Run, CI/CD
11. **Documentation** - User and developer docs
12. **Launch** - Final checks and go-live

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../LICENSE) for details.
