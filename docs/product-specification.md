# utils.live — Product Specification

> Complete technical specification for building the utils.live developer utilities platform.

---

## 1. Executive Summary

**utils.live** is a comprehensive developer utilities platform offering 815 tools across 24 categories. The platform provides:

- **Web Interface**: Modern, fast, accessible tool UI
- **REST API**: Programmatic access for automation
- **MCP Server**: Integration with AI assistants (Claude, etc.)

### Business Model

- **Freemium**: Most tools free with limits
- **Free**: All tools run in the browser, no server required
- **No subscription**: One-time credit purchases

---

## 2. Technical Decisions Summary

| Aspect            | Decision                             |
| ----------------- | ------------------------------------ |
| **Framework**     | Next.js 14+ (App Router)             |
| **Language**      | TypeScript (strict mode)             |
| **Hosting**       | Google Cloud Run                     |
| **Database**      | Cloud SQL PostgreSQL + Prisma        |
| **Auth**          | NextAuth.js (Google + GitHub OAuth)  |
| **Payments**      | Stripe (one-time credit purchases)   |
| **Caching**       | Upstash Redis                        |
| **Rate Limiting** | Upstash Ratelimit                    |
| **UI Components** | shadcn/ui + Tailwind CSS             |
| **Theme**         | Dark mode + system toggle            |
| **API Style**     | REST + OpenAPI spec                  |
| **API Auth**      | API Keys + JWT                       |
| **Monitoring**    | Sentry + GCP Cloud Logging           |
| **Analytics**     | GA4 + PostHog                        |
| **Testing**       | Vitest + Playwright                  |
| **File Handling** | Client-side only (no server uploads) |
| **i18n**          | English only (initially)             |

---

## 3. User Tiers & Limits

### 3.1 Anonymous Users (No Login)

```
├── Access: Client-side tools only (🟢)
├── Limit: 50 operations/day
├── Max Input: 100KB per operation
├── Batch: Not available
├── API Access: Not available
└── Ads: Displayed
```

### 3.2 Logged-In Users (Free)

```
├── Access: Client-side tools (🟢)
├── Limit: 200 operations/day
├── Max Input: 500KB per operation
├── Batch: Up to 5 items
├── API Access: Not available
├── Ads: Displayed
└── Features: Usage history saved, favorites sync
```

### 3.3 Credit Users (Any Purchase)

```
├── Access: All tools (🟢🟡🟠🔴)
├── Limit: Unlimited client-side operations
├── Max Input: 10MB per operation
├── Batch: Unlimited items
├── API Access: Full access with API key
├── Ads: None (while credits > 0)
└── Features: Priority support, full history
```

### 3.4 Credit Costs

| Tool Type                 | Icon | Credits |
| ------------------------- | ---- | ------- |
| All tools (browser-based) | 🟢   | 0       |

### 3.5 Credit Packages

| Package  | Credits | Price | Per Credit |
| -------- | ------- | ----- | ---------- |
| Starter  | 100     | $1    | $0.010     |
| Basic    | 500     | $5    | $0.010     |
| Standard | 1,200   | $10   | $0.0083    |
| Pro      | 3,500   | $25   | $0.0071    |
| Power    | 8,000   | $50   | $0.0063    |

---

## 4. Feature Requirements

### 4.1 Core Features

#### Tool Execution

- [x] 815 tools across 24 categories
- [x] Dual-pane layout (input/output)
- [x] Side-by-side on desktop, stacked on mobile
- [x] Real-time transformation preview
- [x] Copy to clipboard functionality
- [x] Download output as file
- [x] Shareable URLs with encoded input

#### Navigation & Discovery

- [x] Global search (Cmd+K)
- [x] Category browsing
- [x] Tool favorites (starred)
- [x] Recent tools history
- [x] Related tools suggestions
- [x] Keyboard shortcuts (global + per-tool)

#### User Features

- [x] Google OAuth login
- [x] GitHub OAuth login
- [x] Usage history (logged-in users)
- [x] API key generation
- [x] Credit balance display
- [x] Credit purchase flow

### 4.2 Landing Page

```
┌─────────────────────────────────────────────────────────┐
│  Logo                              [Sign In] [Get Started] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│     Every developer tool you need, in one place.         │
│                                                           │
│     [🔍 Search 815 tools...                    ] (Cmd+K) │
│                                                           │
├─────────────────────────────────────────────────────────┤
│  Categories                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │  JSON   │ │  Text   │ │ Crypto  │ │  Date   │  ...   │
│  │ 15 tools│ │52 tools │ │46 tools │ │44 tools │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│  Popular Tools                                           │
│  • JSON Formatter  • Base64 Encode  • UUID Generator    │
│  • JWT Decoder     • Regex Tester   • Unix Timestamp    │
├─────────────────────────────────────────────────────────┤
│  Footer: Pricing | API Docs | GitHub | Twitter          │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Tool Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back   JSON Formatter                    ⭐ [API] [?] │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ INPUT               │  │ OUTPUT                  │  │
│  │                     │  │                         │  │
│  │ [Paste] [Clear]     │  │ [Copy] [Download]       │  │
│  │ [Upload File]       │  │                         │  │
│  │                     │  │                         │  │
│  │ ┌─────────────────┐ │  │ ┌─────────────────────┐ │  │
│  │ │                 │ │  │ │                     │ │  │
│  │ │   Monaco/Code   │ │  │ │   Monaco/Code       │ │  │
│  │ │   Editor        │ │  │ │   Editor            │ │  │
│  │ │                 │ │  │ │                     │ │  │
│  │ └─────────────────┘ │  │ └─────────────────────┘ │  │
│  └─────────────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Options: [ ] Indent with tabs  Spaces: [2 ▾]          │
├─────────────────────────────────────────────────────────┤
│  📖 Documentation                                       │
│  Pretty print JSON with syntax highlighting...          │
│                                                          │
│  API Usage:                                              │
│  POST /api/v1/tools/json/formatter                      │
│  { "input": "...", "options": { "indent": 2 } }        │
├─────────────────────────────────────────────────────────┤
│  Related: JSON Validator | JSON Minify | JSON to YAML   │
└─────────────────────────────────────────────────────────┘
```

### 4.4 API Requirements

#### Endpoints Structure

```
/api/v1/
├── /tools/
│   ├── /json/formatter      POST - Format JSON
│   ├── /json/validator      POST - Validate JSON
│   ├── /encoding/base64     POST - Base64 encode/decode
│   └── /...                 (815 tool endpoints)
├── /auth/
│   ├── /[...nextauth]       NextAuth handlers
│   └── /api-keys            GET, POST, DELETE
├── /user/
│   ├── /profile             GET, PATCH
│   ├── /credits             GET
│   ├── /history             GET
│   └── /favorites           GET, POST, DELETE
├── /payments/
│   ├── /checkout            POST - Create Stripe session
│   └── /webhook             POST - Stripe webhook
└── /health                  GET - Health check
```

#### API Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "creditsUsed": 0,
    "creditsRemaining": 150,
    "executionTime": 12
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": { "retryAfter": 60 }
  }
}
```

#### API Authentication

```
# API Key in header
Authorization: Bearer utl_sk_xxxxxxxxxxxx

# Or as query param (for simple GET requests)
?api_key=utl_sk_xxxxxxxxxxxx
```

### 4.5 MCP Server Requirements

The MCP server exposes all 815 tools for AI assistant integration.

```typescript
// MCP Tool Definition Example
{
  name: "json_formatter",
  description: "Format JSON with pretty printing and syntax highlighting",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string", description: "JSON string to format" },
      indent: { type: "number", default: 2 },
      sortKeys: { type: "boolean", default: false }
    },
    required: ["input"]
  }
}
```

---

## 5. URL Structure

### 5.1 Public Routes

```
/                           Landing page
/tools                      All tools grid
/tools/[category]           Category page (e.g., /tools/json)
/tools/[category]/[tool]    Tool page (e.g., /tools/json/formatter)
/pricing                    Pricing page
/docs                       API documentation
/docs/api                   API reference
/login                      Login page
/signup                     Signup page
```

### 5.2 Protected Routes (Logged In)

```
/dashboard                  User dashboard
/dashboard/history          Usage history
/dashboard/favorites        Favorited tools
/dashboard/api-keys         API key management
/dashboard/credits          Credit balance & purchase
/dashboard/settings         User settings
```

### 5.3 API Routes

```
/api/v1/tools/[category]/[tool]    Tool endpoint
/api/v1/auth/[...nextauth]         Auth endpoints
/api/v1/user/[...]                 User endpoints
/api/v1/payments/[...]             Payment endpoints
```

---

## 6. Database Schema

### 6.1 Core Tables

```sql
-- Users (managed by NextAuth, extended)
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  image           TEXT,
  email_verified  TIMESTAMPTZ,
  credits         INTEGER DEFAULT 0,
  tier            VARCHAR(20) DEFAULT 'free', -- 'free', 'credit'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  key_hash        VARCHAR(64) UNIQUE NOT NULL, -- SHA256 of key
  key_prefix      VARCHAR(12) NOT NULL, -- "utl_sk_xxxx" for display
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Usage History
CREATE TABLE usage_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  tool_id         VARCHAR(100) NOT NULL, -- e.g., "json/formatter"
  credits_used    INTEGER DEFAULT 0,
  input_size      INTEGER, -- bytes
  execution_time  INTEGER, -- milliseconds
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  tool_id         VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

-- Credit Transactions
CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL, -- positive = purchase, negative = usage
  type            VARCHAR(20) NOT NULL, -- 'purchase', 'usage', 'refund'
  description     TEXT,
  stripe_payment_id VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limit Tracking (for anonymous users by IP)
CREATE TABLE rate_limits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier      VARCHAR(100) NOT NULL, -- IP or user_id
  window_start    TIMESTAMPTZ NOT NULL,
  count           INTEGER DEFAULT 0,
  UNIQUE(identifier, window_start)
);

-- NextAuth Required Tables
CREATE TABLE accounts (...);
CREATE TABLE sessions (...);
CREATE TABLE verification_tokens (...);
```

### 6.2 Indexes

```sql
CREATE INDEX idx_usage_history_user ON usage_history(user_id, created_at DESC);
CREATE INDEX idx_usage_history_tool ON usage_history(tool_id, created_at DESC);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, window_start);
```

---

## 7. Security Requirements

### 7.1 Authentication & Authorization

- [x] OAuth 2.0 with Google and GitHub
- [x] Secure session management (NextAuth)
- [x] API key hashing (SHA-256, only prefix stored readable)
- [x] JWT for API authentication
- [x] CORS configuration for API

### 7.2 Rate Limiting

| User Type        | Limit                      |
| ---------------- | -------------------------- |
| Anonymous        | 50 ops/day, 10 ops/minute  |
| Logged-in (free) | 200 ops/day, 30 ops/minute |
| Credit user      | 1000 ops/minute            |
| API (with key)   | 100 ops/minute per key     |

### 7.3 Input Validation

- Maximum input size enforcement
- Content-type validation
- Sanitization of all outputs
- No server-side file storage (client-side only)

### 7.4 Security Headers

```typescript
// next.config.js security headers
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; ..."
}
```

---

## 8. SEO Requirements

### 8.1 Technical SEO

- [x] Static generation for all tool pages (SSG)
- [x] Dynamic Open Graph images per tool
- [x] Structured data (JSON-LD) for tools
- [x] XML sitemap generation
- [x] robots.txt configuration
- [x] Canonical URLs

### 8.2 Meta Tags Template

```html
<!-- Tool Page Example -->
<title>JSON Formatter - Pretty Print JSON Online | utils.live</title>
<meta
  name="description"
  content="Free online JSON formatter and beautifier. Pretty print JSON with syntax highlighting, collapsible tree view, and validation."
/>
<meta property="og:title" content="JSON Formatter | utils.live" />
<meta
  property="og:description"
  content="Pretty print JSON with syntax highlighting"
/>
<meta
  property="og:image"
  content="https://utils.live/og/tools/json/formatter.png"
/>
<link rel="canonical" href="https://utils.live/tools/json/formatter" />
```

### 8.3 Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "JSON Formatter",
  "url": "https://utils.live/tools/json/formatter",
  "description": "Format and beautify JSON online",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

---

## 9. Accessibility (WCAG 2.1 AA)

### 9.1 Requirements

- [x] Semantic HTML structure
- [x] ARIA labels for interactive elements
- [x] Keyboard navigation for all features
- [x] Focus indicators (visible focus states)
- [x] Color contrast ratio ≥ 4.5:1
- [x] Screen reader compatibility
- [x] Skip links for main content
- [x] Reduced motion support

### 9.2 Keyboard Shortcuts

| Shortcut               | Action                    |
| ---------------------- | ------------------------- |
| `Cmd/Ctrl + K`         | Open search               |
| `Cmd/Ctrl + Enter`     | Execute tool              |
| `Cmd/Ctrl + Shift + C` | Copy output               |
| `Escape`               | Close modals/dialogs      |
| `Tab`                  | Navigate elements         |
| `/`                    | Focus search (on landing) |

---

## 10. Performance Requirements

### 10.1 Targets

| Metric                   | Target  |
| ------------------------ | ------- |
| First Contentful Paint   | < 1.5s  |
| Largest Contentful Paint | < 2.5s  |
| Time to Interactive      | < 3.5s  |
| Cumulative Layout Shift  | < 0.1   |
| First Input Delay        | < 100ms |

### 10.2 Optimization Strategies

- [x] Static generation where possible
- [x] Code splitting per route
- [x] Lazy loading for tool-specific code
- [x] Web Workers for heavy computations
- [x] Image optimization (next/image)
- [x] Font subsetting and preloading
- [x] Edge caching with CDN

---

## 11. Monitoring & Observability

### 11.1 Error Tracking (Sentry)

- Runtime error capture
- Performance tracing
- User feedback collection
- Release tracking

### 11.2 Logging (GCP Cloud Logging)

- Structured JSON logs
- Request/response logging
- Error logs with stack traces
- Audit logs for sensitive actions

### 11.3 Analytics

- **GA4**: Traffic, SEO, user acquisition
- **PostHog**: Product analytics, funnels, retention

### 11.4 Uptime Monitoring

- Health check endpoint: `/api/health`
- External uptime monitoring (UptimeRobot or similar)

---

## 12. Deployment & Infrastructure

### 12.1 GCP Cloud Run Configuration

```yaml
# Cloud Run service configuration
service: utils-live
region: us-central1
memory: 1Gi
cpu: 1
min-instances: 0
max-instances: 10
concurrency: 80
timeout: 60s

env:
  - DATABASE_URL
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GITHUB_CLIENT_ID
  - GITHUB_CLIENT_SECRET
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - UPSTASH_REDIS_URL
  - UPSTASH_REDIS_TOKEN
  - OPENROUTER_API_KEY
  - SENTRY_DSN
  - POSTHOG_KEY
```

### 12.2 CI/CD Pipeline

```yaml
# GitHub Actions workflow
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    - Lint (ESLint, Prettier)
    - Type check (tsc)
    - Unit tests (Vitest)
    - E2E tests (Playwright)

  build:
    - Build Next.js app
    - Build Docker image

  deploy:
    - Push to GCR
    - Deploy to Cloud Run
    - Run smoke tests
```

### 12.3 Environment Setup

```
├── Development (local)
│   └── Local PostgreSQL + local Redis
├── Preview (per PR)
│   └── Cloud Run preview + shared DB
├── Staging
│   └── Full environment, test data
└── Production
    └── Full environment, real data
```

---

## 13. Third-Party Integrations

| Service                  | Purpose                 | Tier         |
| ------------------------ | ----------------------- | ------------ |
| **Google Cloud Run**     | Hosting                 | Pay-per-use  |
| **Cloud SQL PostgreSQL** | Database                | ~$7-10/mo    |
| **Upstash Redis**        | Caching + Rate Limiting | Free tier    |
| **Stripe**               | Payments                | 2.9% + $0.30 |
| **NextAuth.js**          | Authentication          | Free (OSS)   |
| **OpenRouter**           | AI (Gemini 2.5 Flash)   | Pay-per-use  |
| **Sentry**               | Error Monitoring        | Free tier    |
| **PostHog**              | Product Analytics       | Free tier    |
| **Google Analytics**     | Traffic Analytics       | Free         |

---

## 14. Testing Strategy

### 14.1 Unit Tests (Vitest)

- All 815 tool functions
- Utility functions
- API route handlers
- React hooks

### 14.2 Integration Tests

- API endpoint testing
- Database operations
- Auth flows
- Payment flows

### 14.3 E2E Tests (Playwright)

- Critical user journeys
- Tool execution flows
- Auth flows
- Payment flows
- Responsive design

### 14.4 Coverage Targets

| Type        | Target         |
| ----------- | -------------- |
| Unit        | 80%            |
| Integration | 70%            |
| E2E         | Critical paths |

---

## 15. Documentation

### 15.1 User Documentation

- Tool usage guides (inline)
- API documentation (OpenAPI)
- Getting started guide
- FAQ

### 15.2 Developer Documentation

- Architecture overview
- Contributing guide
- Local setup guide
- Deployment guide

---

## 16. Future Considerations

### Phase 2 (Post-Launch)

- [ ] CLI tool (`npx utils-live json-format`)
- [ ] VS Code extension
- [ ] Browser extension
- [ ] Internationalization (i18n)
- [ ] Team/Organization accounts
- [ ] Custom tool builder
- [ ] Webhook integrations

### Phase 3

- [ ] Self-hosted version
- [ ] Enterprise features
- [ ] Advanced analytics
- [ ] Custom branding

---

_This specification is the source of truth for the utils.live project._
