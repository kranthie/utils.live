# utils.live — Implementation Plan

> Step-by-step implementation guide for building the complete utils.live platform.

---

## Overview

This plan covers the complete implementation of utils.live with all 815 tools. The work is organized into phases that can be executed sequentially.

---

## Phase 1: Project Foundation

### 1.1 Initialize Monorepo

```bash
# Tasks:
- [ ] Initialize pnpm workspace
- [ ] Set up Turborepo for build orchestration
- [ ] Create package structure (apps/web, packages/tools, packages/mcp, packages/ui)
- [ ] Configure shared TypeScript config
- [ ] Configure shared ESLint config
- [ ] Configure Prettier
- [ ] Set up Husky + lint-staged for pre-commit hooks
```

**Files to create:**
- `pnpm-workspace.yaml`
- `turbo.json`
- `package.json` (root)
- `packages/config/eslint/index.js`
- `packages/config/typescript/base.json`
- `.husky/pre-commit`
- `.prettierrc`

### 1.2 Initialize Next.js App

```bash
# Tasks:
- [ ] Create Next.js 14 app with App Router
- [ ] Configure TypeScript strict mode
- [ ] Set up Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up path aliases
- [ ] Configure next.config.js for standalone output
- [ ] Add security headers
```

**Files to create:**
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/tailwind.config.js`
- `apps/web/next.config.js`
- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/components.json` (shadcn config)

### 1.3 Set Up Database

```bash
# Tasks:
- [ ] Install Prisma
- [ ] Define schema (users, api_keys, usage_history, favorites, credit_transactions)
- [ ] Set up Cloud SQL PostgreSQL instance
- [ ] Configure connection string
- [ ] Run initial migration
- [ ] Create Prisma client singleton
```

**Files to create:**
- `apps/web/prisma/schema.prisma`
- `apps/web/lib/db/index.ts`
- `apps/web/prisma/migrations/...`

### 1.4 Set Up Authentication

```bash
# Tasks:
- [ ] Install NextAuth.js
- [ ] Configure Prisma adapter
- [ ] Set up Google OAuth provider
- [ ] Set up GitHub OAuth provider
- [ ] Create auth config
- [ ] Create auth API routes
- [ ] Create login/signup pages
- [ ] Add session provider to layout
```

**Files to create:**
- `apps/web/lib/auth/config.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/signup/page.tsx`
- `apps/web/components/providers/auth-provider.tsx`

### 1.5 Set Up Core Infrastructure

```bash
# Tasks:
- [ ] Configure Upstash Redis client
- [ ] Set up rate limiting with @upstash/ratelimit
- [ ] Configure Sentry for error tracking
- [ ] Set up PostHog for analytics
- [ ] Configure Google Analytics
- [ ] Create health check endpoint
```

**Files to create:**
- `apps/web/lib/cache/redis.ts`
- `apps/web/lib/api/rate-limit.ts`
- `apps/web/lib/monitoring/sentry.ts`
- `apps/web/lib/analytics/posthog.ts`
- `apps/web/app/api/health/route.ts`

---

## Phase 2: Tool Engine

### 2.1 Create Tools Package

```bash
# Tasks:
- [ ] Initialize packages/tools
- [ ] Define core types (Tool, ToolResult, ToolInput)
- [ ] Create tool registry
- [ ] Create category definitions
- [ ] Set up Zod for schema validation
- [ ] Create tool template generator script
```

**Files to create:**
- `packages/tools/package.json`
- `packages/tools/tsconfig.json`
- `packages/tools/src/index.ts`
- `packages/tools/src/types.ts`
- `packages/tools/src/registry.ts`
- `packages/tools/src/categories.ts`
- `scripts/generate-tool.ts`

### 2.2 Implement Tool Categories (All 815 Tools)

Each tool follows this pattern:

```typescript
// Example: packages/tools/src/json/formatter.ts
export const inputSchema = z.object({...});
export const outputSchema = z.object({...});
export const metadata: Tool = {...};
export function execute(input: Input): ToolResult<Output> {...}
```

**Categories to implement:**

#### Data Formats & Conversion (61 tools)
```bash
- [ ] JSON Tools (15): formatter, minify, validator, diff, path-query, jmespath,
      flatten, unflatten, sort-keys, remove-nulls, to-string, from-string,
      merge, size-analyzer, tree-viewer
- [ ] YAML Tools (8): formatter, validator, to-json, from-json, diff, merge, lint, splitter
- [ ] XML Tools (10): formatter, minify, validator, to-json, from-json, xpath,
      xslt, escape, to-csv, dtd-validator
- [ ] CSV Tools (12): viewer, to-json, from-json, to-sql, to-xml, formatter,
      column-extractor, merger, deduplicator, to-tsv, to-markdown, statistics
- [ ] TOML/INI Tools (6): toml-formatter, toml-validator, toml-to-json,
      json-to-toml, ini-to-json, json-to-ini
- [ ] Other Data Formats (10): properties-to-json, json-to-properties, ndjson-parser,
      json-to-ndjson, hjson-to-json, json5-to-json, jsonc-stripper,
      messagepack-viewer, protobuf-viewer, avro-viewer
```

#### Text & String Manipulation (52 tools)
```bash
- [ ] Text Transformation (18): case-converter, slugify, reverser, line-sorter,
      deduplicator, shuffler, numberer, empty-line-remover, whitespace-cleaner,
      trimmer, find-replace, wrapper, prefix-suffix, column-aligner, truncator,
      palindrome-checker, anagram-generator, rot13
- [ ] Text Analysis (12): word-counter, character-counter, reading-time,
      word-frequency, statistics, keyword-extractor, readability,
      sentence-counter, paragraph-counter, letter-frequency, ngram, language-detector
- [ ] Text Comparison (6): diff, unified-diff, character-diff, semantic-diff,
      similarity-score, plagiarism-highlighter
- [ ] Text Generation (8): lorem-ipsum, random-words, random-sentences,
      random-paragraphs, fake-name, fake-address, fake-company, dummy-text
- [ ] Text Extraction (8): email-extractor, url-extractor, phone-extractor,
      ip-extractor, hashtag-extractor, mention-extractor, number-extractor, date-extractor
```

#### Markdown & Documentation (32 tools)
```bash
- [ ] Markdown Tools (14): preview, to-html, from-html, formatter, toc-generator,
      link-extractor, image-extractor, table-generator, table-formatter, linter,
      to-plain-text, escaper, link-checker, frontmatter-editor
- [ ] Documentation Formats (10): to-slack, from-slack, to-jira, from-jira,
      to-confluence, to-discord, to-bbcode, rst-to-md, asciidoc-to-md, textile-to-md
- [ ] README Generators (8): readme-generator, license-picker, changelog-generator,
      contributing-guide, code-of-conduct, issue-template, pr-template, badge-generator
```

#### HTML & Web (46 tools)
```bash
- [ ] HTML Tools (14): formatter, minify, validator, to-text, entity-encoder,
      entity-decoder, tag-stripper, attribute-remover, preview, playground,
      table-generator, list-generator, color-picker, favicon-generator
- [ ] CSS Tools (12): formatter, minify, validator, scss-to-css, less-to-css,
      css-to-scss, specificity, gradient-generator, box-shadow, border-radius,
      flexbox-generator, grid-generator
- [ ] SEO & Meta (12): meta-generator, og-generator, twitter-card, schema-org,
      robots-txt-generator, robots-txt-validator, sitemap-generator,
      sitemap-validator, canonical-builder, hreflang, meta-preview, social-preview
- [ ] Web Security (8): csp-builder, csp-validator, cors-builder, sri-generator,
      security-headers-check, hsts-builder, permissions-policy, xss-filter-tester
```

#### Code Formatting & Minification (34 tools)
```bash
- [ ] Code Formatters (16): js-formatter, ts-formatter, json-formatter,
      html-formatter, css-formatter, sql-formatter, graphql-formatter,
      md-formatter, yaml-formatter, xml-formatter, python-formatter,
      go-formatter, rust-formatter, java-formatter, csharp-formatter, php-formatter
- [ ] Minifiers (10): js-minify, css-minify, html-minify, json-minify,
      svg-minify, xml-minify, sql-minify, graphql-minify, ts-minify, batch-minify
- [ ] Code Analysis (8): js-obfuscator, js-beautifier, complexity,
      syntax-highlighter, line-counter, code-to-image, comment-stripper, dead-code-finder
```

#### Encoding & Decoding (46 tools)
```bash
- [ ] Base Encoding (12): base64-encode, base64-decode, base64url-encode,
      base64url-decode, base32, base58, base62, hex-encode, hex-decode,
      binary-to-text, text-to-binary, octal
- [ ] URL Encoding (8): url-encode, url-decode, url-encode-full, url-parser,
      url-builder, query-string-parser, query-string-builder, data-url-builder
- [ ] Text Encoding (10): unicode-escape, unicode-unescape, html-entity-encode,
      html-entity-decode, js-escape, js-unescape, json-escape, json-unescape,
      punycode-encode, punycode-decode
- [ ] Character Sets (8): utf8-to-utf16, utf16-to-utf8, latin1-converter,
      ascii-table, unicode-lookup, character-inspector, charset-detector, bom-remover
- [ ] Number Encodings (8): decimal-to-hex, hex-to-decimal, decimal-to-binary,
      binary-to-decimal, decimal-to-octal, any-base-converter, roman-numeral,
      scientific-notation
```

#### Cryptography & Security (46 tools)
```bash
- [ ] Hash Generators (14): md5, sha1, sha256, sha384, sha512, sha3, blake2,
      ripemd160, crc32, adler32, xxhash, murmurhash, hash-identifier, multi-hash
- [ ] HMAC & KDF (6): hmac-sha256, hmac-sha512, pbkdf2, bcrypt-generator,
      bcrypt-verifier, argon2
- [ ] Encryption (8): aes-encrypt, aes-decrypt, rsa-encrypt, rsa-decrypt,
      chacha20-encrypt, chacha20-decrypt, triple-des, blowfish
- [ ] Keys & Certificates (10): rsa-key-generator, ec-key-generator,
      ed25519-generator, ssh-key-generator, pem-parser, jwk-converter,
      csr-decoder, certificate-decoder, pgp-key-generator, key-fingerprint
- [ ] Password Tools (8): password-generator, passphrase-generator,
      password-strength, pin-generator, memorable-password,
      password-hash-check, password-entropy, api-key-generator
```

#### JWT & Tokens (30 tools)
```bash
- [ ] JWT Tools (10): decoder, encoder, validator, debugger, header-viewer,
      payload-viewer, expiry-checker, to-json, claims-builder, rs256-generator
- [ ] ID Generators (14): uuid-v1, uuid-v4, uuid-v5, uuid-v7, ulid, nanoid,
      cuid, cuid2, snowflake, ksuid, objectid, short-id, uuid-validator, bulk-generator
- [ ] Other Tokens (6): paseto-encoder, paseto-decoder, oauth-token-decoder,
      saml-decoder, fernet-encoder, session-token-generator
```

#### Regular Expressions (20 tools)
```bash
- [ ] Regex Tools (12): tester, visualizer, explainer, replace, split, extract,
      groups, flags-tester, escape, glob-to-regex, regex-to-glob, optimizer
- [ ] Regex Library (8): common-patterns, email-regex, url-regex, phone-regex,
      ip-regex, date-regex, credit-card-regex, password-regex
```

#### Date & Time (44 tools)
```bash
- [ ] Date Conversion (12): unix-timestamp, iso8601, rfc2822, epoch,
      date-formatter, date-parser, julian-day, excel-date, relative-time,
      date-to-words, timezone-converter, utc-converter
- [ ] Date Calculation (10): date-difference, date-add-subtract, age-calculator,
      workdays-calculator, week-number, quarter-calculator, day-of-year,
      leap-year-checker, days-in-month, date-range-generator
- [ ] Time Tools (8): timezone-list, world-clock, duration-calculator,
      duration-formatter, time-parser, 12h-24h-converter, countdown, meeting-planner
- [ ] Cron & Scheduling (8): cron-builder, cron-parser, cron-next-runs,
      cron-validator, cron-to-english, english-to-cron, rate-limiter-calc, interval-calc
- [ ] Calendar Tools (6): calendar-generator, holiday-lookup, ical-generator,
      ical-parser, vcard-generator, vcard-parser
```

#### Numbers & Math (42 tools)
```bash
- [ ] Unit Conversion (16): length, weight, temperature, volume, area, speed,
      time, data-size, pressure, energy, power, frequency, angle, force,
      fuel-economy, currency
- [ ] Number Tools (12): formatter, percentage, ratio, fraction, percentage-change,
      tip-calculator, discount, markup, vat, compound-interest, loan, bmi
- [ ] Math Operations (14): expression-evaluator, scientific-calculator,
      matrix-calculator, prime-checker, prime-factorization, gcd-lcm,
      factorial, fibonacci, random-number, statistics, std-deviation,
      permutation-combination, quadratic-solver, bitwise-calculator
```

#### Color Tools (30 tools)
```bash
- [ ] Color Conversion (12): hex-to-rgb, rgb-to-hex, hex-to-hsl, hsl-to-hex,
      rgb-to-hsl, hsl-to-rgb, rgb-to-cmyk, cmyk-to-rgb, hex-to-hsv,
      color-name-to-hex, hex-to-color-name, all-formats
- [ ] Color Generation (10): picker, random-color, palette-generator,
      complementary, analogous, triadic, split-complementary, shades, tints, gradient
- [ ] Color Analysis (8): contrast-checker, color-blindness-simulator,
      brightness, luminance, color-distance, mixer, inverter, image-color-extractor
```

#### Visual & Diagrams (36 tools)
```bash
- [ ] Diagram Rendering (10): mermaid-renderer, mermaid-editor, plantuml,
      graphviz, sequence-diagram, flowchart, er-diagram, gantt-chart,
      mind-map, ascii-diagram
- [ ] QR Codes (8): qr-generator, qr-reader, qr-with-logo, styled-qr,
      wifi-qr, vcard-qr, url-qr, bulk-qr
- [ ] Barcodes (10): code128, code39, ean13, ean8, upc-a, upc-e, itf,
      pdf417, data-matrix, barcode-reader
- [ ] Charts & Graphs (8): line-chart, bar-chart, pie-chart, scatter-plot,
      area-chart, radar-chart, sparkline, json-to-chart
```

#### Image Tools (40 tools)
```bash
- [ ] Image Conversion (10): png-to-jpg, jpg-to-png, to-webp, webp-to-png,
      to-base64, from-base64, svg-to-png, to-data-url, heic-to-jpg, gif-frame-extractor
- [ ] Image Editing (12): resizer, cropper, rotator, flipper, compressor,
      aspect-ratio, border-adder, watermark, round-corners, circle-crop,
      thumbnail-generator, splitter
- [ ] Image Effects (10): grayscale, sepia, invert, brightness, contrast,
      blur, sharpen, pixelate, posterize, duotone
- [ ] Image Analysis (8): image-info, exif-reader, exif-remover,
      color-picker-from-image, dominant-colors, histogram, image-diff, placeholder
```

#### SVG Tools (20 tools)
```bash
- [ ] SVG Operations (12): optimizer, viewer, to-png, to-jpg, to-base64,
      to-data-uri, formatter, minifier, path-editor, to-css, sprite-generator, color-changer
- [ ] SVG Generators (8): wave-generator, blob-generator, pattern-generator,
      icon-search, avatar-generator, divider-generator, background-generator, favicon-from-svg
```

#### Developer Tools (56 tools)
```bash
- [ ] API & HTTP (14): curl-converter, curl-builder, http-status-reference,
      http-headers-reference, header-parser, request-builder, response-formatter,
      graphql-formatter, graphql-to-typescript, rest-to-graphql, webhook-tester,
      mock-generator, postman-to-curl, har-analyzer
- [ ] Code Generation (12): json-to-typescript, json-to-go, json-to-rust,
      json-to-python, json-to-java, json-to-csharp, json-schema-generator,
      json-schema-validator, json-schema-to-typescript, openapi-to-typescript,
      sql-to-typescript, graphql-schema-generator
- [ ] Config Tools (12): env-parser, env-generator, env-validator,
      gitignore-generator, gitignore-builder, editorconfig-generator,
      package-json-validator, package-json-merger, tsconfig-generator,
      eslint-config, prettier-config, babel-config
- [ ] Git Tools (8): commit-message, conventional-commits, diff-viewer,
      branch-namer, ignore-checker, command-builder, semver-bumper, changelog-parser
- [ ] Docker & K8s (10): dockerfile-generator, dockerfile-linter,
      compose-validator, compose-generator, k8s-yaml-validator, k8s-yaml-generator,
      helm-values-generator, container-image-parser, aws-arn-parser, cloud-resource-namer
```

#### OpenAPI & Schema Tools (18 tools)
```bash
- [ ] OpenAPI Tools (10): viewer, validator, editor, to-json, from-json,
      diff, mock, swagger2-to-openapi3, merger, splitter
- [ ] Schema Tools (8): json-schema-editor, json-schema-validator,
      json-schema-to-openapi, openapi-to-json-schema, json-schema-faker,
      avro-schema-editor, protobuf-editor, graphql-schema-viewer
```

#### SQL & Database (20 tools)
```bash
- [ ] SQL Tools (12): formatter, minifier, validator, parser, explainer,
      to-nosql, json-to-insert, csv-to-insert, to-json, dialect-converter,
      query-builder, index-suggester
- [ ] Database Tools (8): connection-string-parser, connection-string-builder,
      dsn-parser, redis-command-builder, mongodb-query-builder,
      elasticsearch-query-builder, database-url-converter, er-diagram-generator
```

#### Network Tools (34 tools)
```bash
- [ ] DNS Tools (8): dns-lookup, reverse-dns, mx-lookup, txt-lookup,
      ns-lookup, soa-lookup, whois-lookup, domain-age-checker
- [ ] SSL/TLS Tools (8): ssl-checker, ssl-expiry, ssl-chain, certificate-decoder,
      csr-generator, csr-decoder, ssl-labs-grade, certificate-fingerprint
- [ ] HTTP Tools (8): headers-checker, redirect-checker, response-time,
      robots-txt-checker, sitemap-checker, website-status, page-speed, favicon-fetcher
- [ ] IP Tools (10): ip-lookup, my-ip, ip-to-integer, integer-to-ip,
      cidr-calculator, cidr-to-range, range-to-cidr, ip-in-cidr, ipv6-expander, ipv6-compressor
```

#### Validation Tools (26 tools)
```bash
- [ ] Format Validators (16): email, url, phone, uuid, mac-address, ipv4,
      ipv6, domain, hostname, slug, semver, hex-color, credit-card, isbn, issn, doi
- [ ] Data Validators (10): json, xml, yaml, toml, csv, html, css, javascript, sql, cron
```

#### Feeds & Structured Data (16 tools)
```bash
- [ ] RSS/Atom Tools (8): rss-parser, atom-parser, rss-generator,
      atom-generator, rss-validator, feed-merger, json-feed-parser, opml-parser
- [ ] Structured Data (8): schema-org-generator, schema-org-validator,
      json-ld-editor, microdata-extractor, rich-snippet-preview,
      breadcrumb-generator, faq-schema, product-schema
```

#### Communication Formats (14 tools)
```bash
- [ ] Email Tools (8): header-parser, template-builder, mime-type-lookup,
      to-markdown, address-parser, signature-generator, spf-generator, dkim-validator
- [ ] Messaging Formats (6): slack-formatter, discord-formatter,
      telegram-formatter, teams-formatter, irc-formatter, bbcode-formatter
```

#### AI-Powered Tools (22 tools)
```bash
- [ ] Text AI (8): summarizer, rewriter, grammar-checker, tone-adjuster,
      translator, language-detector, keyword-extractor-ai, sentiment-analyzer
- [ ] Code AI (8): code-explainer, code-commenter, code-reviewer, bug-finder,
      code-converter, regex-generator, sql-generator, test-generator
- [ ] Other AI (6): commit-message-generator, pr-description-generator,
      documentation-generator, name-generator, alt-text-generator, json-to-description
```

#### Miscellaneous Tools (30 tools)
```bash
- [ ] String Utilities (8): string-length, string-hash, string-similarity,
      levenshtein-distance, soundex, metaphone, string-obfuscator, character-repeater
- [ ] Fun Tools (8): morse-code, nato-alphabet, pig-latin, leet-speak,
      emoji-converter, zalgo-text, upside-down-text, fancy-text
- [ ] Reference Tools (8): http-status-reference, mime-type-reference,
      html-entity-reference, keyboard-shortcuts, emoji-reference,
      country-code-reference, currency-code-reference, language-code-reference
- [ ] Generators (6): privacy-policy, terms-of-service, cookie-policy,
      disclaimer, gdpr-statement, copyright-notice
```

---

## Phase 3: UI Components

### 3.1 Set Up shadcn/ui Components

```bash
# Tasks:
- [ ] Install shadcn/ui CLI
- [ ] Add base components: button, input, label, card, dialog, dropdown-menu,
      tabs, tooltip, toast, skeleton, separator, scroll-area
- [ ] Add form components: form, select, checkbox, switch, textarea
- [ ] Add navigation components: navigation-menu, command (for search)
- [ ] Add feedback components: alert, badge, progress
```

### 3.2 Create Custom Components

```bash
# Tasks:
- [ ] CodeEditor (Monaco wrapper with options)
- [ ] ToolLayout (dual pane with resize)
- [ ] ToolCard (for grid display)
- [ ] CategoryCard
- [ ] SearchCommand (Cmd+K dialog)
- [ ] ToolOptions (per-tool settings)
- [ ] CopyButton
- [ ] DownloadButton
- [ ] ShareButton
- [ ] ThemeToggle
- [ ] UserMenu
- [ ] CreditDisplay
```

**Files to create:**
- `apps/web/components/tools/code-editor.tsx`
- `apps/web/components/tools/tool-layout.tsx`
- `apps/web/components/tools/tool-card.tsx`
- `apps/web/components/tools/category-card.tsx`
- `apps/web/components/search/search-command.tsx`
- `apps/web/components/shared/copy-button.tsx`
- `apps/web/components/shared/download-button.tsx`
- `apps/web/components/shared/share-button.tsx`
- `apps/web/components/layout/header.tsx`
- `apps/web/components/layout/footer.tsx`
- `apps/web/components/layout/user-menu.tsx`
- `apps/web/components/layout/theme-toggle.tsx`
- `apps/web/components/layout/credit-display.tsx`

### 3.3 Create Layout Components

```bash
# Tasks:
- [ ] RootLayout with providers
- [ ] MarketingLayout (for landing, pricing)
- [ ] DashboardLayout (for authenticated routes)
- [ ] ToolsLayout (for tool pages)
- [ ] Sidebar navigation
- [ ] Mobile navigation
- [ ] Breadcrumbs
```

---

## Phase 4: Pages & Routes

### 4.1 Marketing Pages

```bash
# Tasks:
- [ ] Landing page with hero, search, categories, popular tools
- [ ] Pricing page with credit packages
- [ ] About page
- [ ] Contact page
- [ ] 404 page
- [ ] 500 page
```

**Files to create:**
- `apps/web/app/page.tsx`
- `apps/web/app/pricing/page.tsx`
- `apps/web/app/about/page.tsx`
- `apps/web/app/contact/page.tsx`
- `apps/web/app/not-found.tsx`
- `apps/web/app/error.tsx`

### 4.2 Tool Pages

```bash
# Tasks:
- [ ] All tools grid page (/tools)
- [ ] Category pages (/tools/[category])
- [ ] Individual tool pages (/tools/[category]/[tool])
- [ ] Generate static params for all tools
- [ ] Generate metadata for all tools
- [ ] Generate Open Graph images
```

**Files to create:**
- `apps/web/app/tools/page.tsx`
- `apps/web/app/tools/[category]/page.tsx`
- `apps/web/app/tools/[category]/[tool]/page.tsx`
- `apps/web/app/tools/[category]/[tool]/opengraph-image.tsx`

### 4.3 Dashboard Pages

```bash
# Tasks:
- [ ] Dashboard home
- [ ] Usage history
- [ ] Favorites
- [ ] API keys management
- [ ] Credits balance & purchase
- [ ] Settings
```

**Files to create:**
- `apps/web/app/(dashboard)/dashboard/page.tsx`
- `apps/web/app/(dashboard)/dashboard/history/page.tsx`
- `apps/web/app/(dashboard)/dashboard/favorites/page.tsx`
- `apps/web/app/(dashboard)/dashboard/api-keys/page.tsx`
- `apps/web/app/(dashboard)/dashboard/credits/page.tsx`
- `apps/web/app/(dashboard)/dashboard/settings/page.tsx`

### 4.4 Auth Pages

```bash
# Tasks:
- [ ] Login page
- [ ] Signup page (redirect to login with different UI)
- [ ] Auth callback handling
- [ ] Logout handling
```

---

## Phase 5: API Routes

### 5.1 Tool API Routes

```bash
# Tasks:
- [ ] Create dynamic tool route handler
- [ ] Implement input validation
- [ ] Implement rate limiting
- [ ] Implement credit checking/deduction
- [ ] Implement caching for server tools
- [ ] Implement usage tracking
- [ ] Generate OpenAPI spec
```

**Files to create:**
- `apps/web/app/api/v1/tools/[category]/[tool]/route.ts`
- `apps/web/lib/api/validate.ts`
- `apps/web/lib/api/credits.ts`
- `apps/web/lib/api/track.ts`
- `scripts/generate-openapi.ts`

### 5.2 User API Routes

```bash
# Tasks:
- [ ] GET /api/v1/user/profile
- [ ] PATCH /api/v1/user/profile
- [ ] GET /api/v1/user/credits
- [ ] GET /api/v1/user/history
- [ ] GET /api/v1/user/favorites
- [ ] POST /api/v1/user/favorites
- [ ] DELETE /api/v1/user/favorites/[id]
```

### 5.3 API Keys Routes

```bash
# Tasks:
- [ ] GET /api/v1/user/api-keys (list keys)
- [ ] POST /api/v1/user/api-keys (create key)
- [ ] DELETE /api/v1/user/api-keys/[id] (revoke key)
```

### 5.4 Payment Routes

```bash
# Tasks:
- [ ] POST /api/v1/payments/checkout (create Stripe session)
- [ ] POST /api/v1/payments/webhook (handle Stripe events)
- [ ] GET /api/v1/payments/history
```

---

## Phase 6: Payments Integration

### 6.1 Stripe Setup

```bash
# Tasks:
- [ ] Create Stripe account
- [ ] Create products and prices for credit packages
- [ ] Configure webhook endpoint
- [ ] Set up Stripe CLI for local testing
- [ ] Implement checkout session creation
- [ ] Implement webhook handler
- [ ] Test payment flow end-to-end
```

### 6.2 Credit System

```bash
# Tasks:
- [ ] Implement credit checking function
- [ ] Implement credit deduction function
- [ ] Implement transaction logging
- [ ] Create credit balance UI component
- [ ] Create purchase flow UI
- [ ] Handle failed payments
- [ ] Handle refunds
```

---

## Phase 7: MCP Server

### 7.1 Initialize MCP Package

```bash
# Tasks:
- [ ] Initialize packages/mcp
- [ ] Install @modelcontextprotocol/sdk
- [ ] Create MCP server implementation
- [ ] Create API client for utils.live
- [ ] Register all 815 tools
- [ ] Handle authentication
- [ ] Handle errors
```

**Files to create:**
- `packages/mcp/package.json`
- `packages/mcp/tsconfig.json`
- `packages/mcp/src/index.ts`
- `packages/mcp/src/server.ts`
- `packages/mcp/src/client.ts`
- `packages/mcp/src/tools.ts`

### 7.2 MCP Documentation

```bash
# Tasks:
- [ ] Create README for MCP package
- [ ] Document installation
- [ ] Document configuration
- [ ] Document available tools
- [ ] Create example usage
```

---

## Phase 8: Testing

### 8.1 Unit Tests

```bash
# Tasks:
- [ ] Set up Vitest
- [ ] Create test utilities
- [ ] Write tests for all 815 tools
- [ ] Write tests for API routes
- [ ] Write tests for utility functions
- [ ] Write tests for React hooks
- [ ] Configure coverage reporting
```

### 8.2 Integration Tests

```bash
# Tasks:
- [ ] Set up test database
- [ ] Write tests for auth flow
- [ ] Write tests for payment flow
- [ ] Write tests for API key management
- [ ] Write tests for credit system
```

### 8.3 E2E Tests

```bash
# Tasks:
- [ ] Set up Playwright
- [ ] Write tests for landing page
- [ ] Write tests for tool execution
- [ ] Write tests for search
- [ ] Write tests for auth flow
- [ ] Write tests for dashboard
- [ ] Configure CI to run E2E tests
```

---

## Phase 9: SEO & Performance

### 9.1 SEO Implementation

```bash
# Tasks:
- [ ] Generate sitemap.xml
- [ ] Configure robots.txt
- [ ] Add meta tags to all pages
- [ ] Add structured data (JSON-LD)
- [ ] Create Open Graph images
- [ ] Add canonical URLs
- [ ] Configure Google Search Console
```

### 9.2 Performance Optimization

```bash
# Tasks:
- [ ] Configure image optimization
- [ ] Set up font optimization
- [ ] Configure code splitting
- [ ] Set up lazy loading for tools
- [ ] Configure service worker
- [ ] Set up CDN caching
- [ ] Run Lighthouse audits
- [ ] Optimize bundle size
```

---

## Phase 10: Deployment

### 10.1 GCP Setup

```bash
# Tasks:
- [ ] Create GCP project
- [ ] Enable required APIs (Cloud Run, Cloud SQL, Container Registry)
- [ ] Create Cloud SQL instance
- [ ] Configure VPC connector (for Cloud SQL access)
- [ ] Set up secrets in Secret Manager
- [ ] Configure IAM permissions
```

### 10.2 CI/CD Pipeline

```bash
# Tasks:
- [ ] Create GitHub Actions workflow for CI
- [ ] Create workflow for preview deployments
- [ ] Create workflow for production deployment
- [ ] Configure branch protection rules
- [ ] Set up automatic PR previews
- [ ] Configure deployment notifications
```

### 10.3 Monitoring Setup

```bash
# Tasks:
- [ ] Configure Sentry project
- [ ] Set up error alerting
- [ ] Configure PostHog project
- [ ] Set up Google Analytics
- [ ] Create monitoring dashboard
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
```

---

## Phase 11: Documentation

### 11.1 User Documentation

```bash
# Tasks:
- [ ] Create docs site structure
- [ ] Write getting started guide
- [ ] Document each tool category
- [ ] Write API documentation
- [ ] Create API reference (from OpenAPI)
- [ ] Write FAQ
- [ ] Create video tutorials (optional)
```

### 11.2 Developer Documentation

```bash
# Tasks:
- [ ] Write architecture documentation
- [ ] Create contribution guide
- [ ] Document local development setup
- [ ] Write deployment guide
- [ ] Create tool development guide
```

---

## Phase 12: Launch Preparation

### 12.1 Pre-Launch Checklist

```bash
# Tasks:
- [ ] Security audit
- [ ] Performance audit
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Load testing
- [ ] Backup and recovery testing
- [ ] Payment flow testing
- [ ] Error handling verification
```

### 12.2 Launch

```bash
# Tasks:
- [ ] Configure DNS for utils.live
- [ ] Set up SSL certificate
- [ ] Deploy to production
- [ ] Verify all tools working
- [ ] Monitor for errors
- [ ] Announce launch
```

---

## Appendix: Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://utils.live"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Payments
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
STRIPE_PUBLISHABLE_KEY="..."

# Cache
UPSTASH_REDIS_URL="..."
UPSTASH_REDIS_TOKEN="..."

# AI
OPENROUTER_API_KEY="..."

# Monitoring
SENTRY_DSN="..."
POSTHOG_KEY="..."
NEXT_PUBLIC_GA_MEASUREMENT_ID="..."

# App
NEXT_PUBLIC_APP_URL="https://utils.live"
```

---

## Appendix: Dependencies (Latest Versions)

> Versions as of January 2025. Run `npm info <package> version` to check for updates.

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.1 | React framework |
| `react` | 19.2.3 | UI library |
| `react-dom` | 19.2.3 | React DOM renderer |
| `typescript` | 5.9.3 | Type safety |

### Build & Dev Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `turbo` | 2.7.3 | Monorepo build system |
| `eslint` | 9.39.2 | Linting |
| `prettier` | 3.7.4 | Code formatting |
| `husky` | 9.1.7 | Git hooks |
| `lint-staged` | 16.2.7 | Pre-commit linting |

### Styling & UI

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.1.18 | Utility CSS |
| `@radix-ui/react-dialog` | 1.1.15 | Headless UI primitives |
| `lucide-react` | 0.562.0 | Icons |
| `class-variance-authority` | 0.7.1 | Variant styling |
| `clsx` | 2.1.1 | Conditional classes |
| `tailwind-merge` | 3.4.0 | Merge Tailwind classes |
| `next-themes` | 0.4.6 | Theme switching |
| `cmdk` | 1.1.1 | Command menu (Cmd+K) |
| `sonner` | 2.0.7 | Toast notifications |

### Database & Auth

| Package | Version | Purpose |
|---------|---------|---------|
| `prisma` | 7.2.0 | Database ORM |
| `@prisma/client` | 7.2.0 | Prisma client |
| `next-auth` | 4.24.13 | Authentication |
| `@auth/prisma-adapter` | 2.11.1 | NextAuth Prisma adapter |

### Payments & API

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | 20.1.2 | Payment processing |
| `zod` | 4.3.5 | Schema validation |

### Caching & Rate Limiting

| Package | Version | Purpose |
|---------|---------|---------|
| `@upstash/redis` | 1.36.1 | Redis client |
| `@upstash/ratelimit` | 2.0.7 | Rate limiting |

### Monitoring & Analytics

| Package | Version | Purpose |
|---------|---------|---------|
| `@sentry/nextjs` | 10.32.1 | Error tracking |
| `posthog-js` | 1.318.1 | Product analytics |

### Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | 4.0.16 | Unit testing |
| `@playwright/test` | 1.57.0 | E2E testing |

### Code Editor

| Package | Version | Purpose |
|---------|---------|---------|
| `@monaco-editor/react` | 4.7.0 | Code editor component |

### Forms

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | 7.70.0 | Form handling |
| `@hookform/resolvers` | 5.2.2 | Zod integration |

### MCP Server

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | 1.25.2 | MCP SDK |

### AI Integration

| Package | Version | Purpose |
|---------|---------|---------|
| OpenRouter API | - | AI provider (Gemini 2.5 Flash) |

---

### Tool-Specific Libraries

#### Data Formats

| Package | Version | Purpose |
|---------|---------|---------|
| `js-yaml` | 4.1.1 | YAML parsing |
| `xml2js` | 0.6.2 | XML parsing |
| `csv-parse` | 6.1.0 | CSV parsing |
| `@iarna/toml` | 2.2.5 | TOML parsing |
| `ini` | 6.0.0 | INI parsing |
| `jsonpath-plus` | 10.3.0 | JSONPath queries |
| `jmespath` | 0.16.0 | JMESPath queries |

#### Text & Markdown

| Package | Version | Purpose |
|---------|---------|---------|
| `marked` | 17.0.1 | Markdown parsing |
| `turndown` | 7.2.2 | HTML to Markdown |
| `slugify` | 1.6.6 | URL slug generation |
| `diff` | 8.0.2 | Text diffing |

#### Encoding & Crypto

| Package | Version | Purpose |
|---------|---------|---------|
| `jose` | 6.1.3 | JWT handling |
| `bcryptjs` | 3.0.3 | Password hashing |
| `argon2` | 0.44.0 | Argon2 hashing |
| `punycode` | 2.3.1 | Punycode encoding |
| `he` | 1.2.0 | HTML entities |

#### IDs & Generators

| Package | Version | Purpose |
|---------|---------|---------|
| `uuid` | 13.0.0 | UUID generation |
| `nanoid` | 5.1.6 | NanoID generation |
| `ulid` | 3.0.2 | ULID generation |
| `@paralleldrive/cuid2` | 3.0.6 | CUID2 generation |
| `@faker-js/faker` | 10.2.0 | Fake data generation |

#### Date & Time

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | 4.1.0 | Date utilities |
| `cronstrue` | 3.9.0 | Cron to human readable |
| `cron-parser` | 5.4.0 | Cron parsing |

#### Colors & Math

| Package | Version | Purpose |
|---------|---------|---------|
| `chroma-js` | 3.2.0 | Color manipulation |
| `color` | 5.0.3 | Color conversion |
| `mathjs` | 15.1.0 | Math operations |
| `convert-units` | 2.3.4 | Unit conversion |

#### Visual & Diagrams

| Package | Version | Purpose |
|---------|---------|---------|
| `mermaid` | 11.12.2 | Diagram rendering |
| `qrcode` | 1.5.4 | QR code generation |
| `jsbarcode` | 3.12.3 | Barcode generation |

#### Code & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `sql-formatter` | 15.6.12 | SQL formatting |
| `terser` | 5.44.1 | JS minification |
| `svgo` | 4.0.0 | SVG optimization |
| `graphql` | 16.12.0 | GraphQL parsing |
| `validator` | 13.15.26 | String validation |

#### Network & API

| Package | Version | Purpose |
|---------|---------|---------|
| `ip-address` | 10.1.0 | IP address utilities |
| `openapi-types` | 12.1.3 | OpenAPI types |
| `swagger-parser` | 10.0.3 | OpenAPI parsing |
| `rss-parser` | 3.13.0 | RSS/Atom parsing |

#### Image Processing

| Package | Version | Purpose |
|---------|---------|---------|
| `sharp` | 0.34.5 | Image processing (server) |
| `exif-js` | 2.3.0 | EXIF reading (client) |

---

### Install Commands

```bash
# Core dependencies (apps/web)
pnpm add next@16.1.1 react@19.2.3 react-dom@19.2.3

# Dev dependencies (root)
pnpm add -Dw turbo@2.7.3 typescript@5.9.3 eslint@9.39.2 prettier@3.7.4 husky@9.1.7 lint-staged@16.2.7

# UI dependencies (apps/web)
pnpm add tailwindcss@4.1.18 @radix-ui/react-dialog@1.1.15 lucide-react@0.562.0 class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@3.4.0 next-themes@0.4.6 cmdk@1.1.1 sonner@2.0.7

# Database & Auth (apps/web)
pnpm add prisma@7.2.0 @prisma/client@7.2.0 next-auth@4.24.13 @auth/prisma-adapter@2.11.1

# Payments & Validation (apps/web)
pnpm add stripe@20.1.2 zod@4.3.5

# Caching (apps/web)
pnpm add @upstash/redis@1.36.1 @upstash/ratelimit@2.0.7

# Monitoring (apps/web)
pnpm add @sentry/nextjs@10.32.1 posthog-js@1.318.1

# Testing (root dev)
pnpm add -Dw vitest@4.0.16 @playwright/test@1.57.0

# Forms (apps/web)
pnpm add react-hook-form@7.70.0 @hookform/resolvers@5.2.2

# Editor (apps/web)
pnpm add @monaco-editor/react@4.7.0

# MCP (packages/mcp)
pnpm add @modelcontextprotocol/sdk@1.25.2

# Tool libraries (packages/tools)
pnpm add js-yaml@4.1.1 xml2js@0.6.2 csv-parse@6.1.0 @iarna/toml@2.2.5 ini@6.0.0 jsonpath-plus@10.3.0 jmespath@0.16.0 marked@17.0.1 turndown@7.2.2 slugify@1.6.6 diff@8.0.2 jose@6.1.3 bcryptjs@3.0.3 punycode@2.3.1 he@1.2.0 uuid@13.0.0 nanoid@5.1.6 ulid@3.0.2 @paralleldrive/cuid2@3.0.6 @faker-js/faker@10.2.0 date-fns@4.1.0 cronstrue@3.9.0 cron-parser@5.4.0 chroma-js@3.2.0 color@5.0.3 mathjs@15.1.0 convert-units@2.3.4 mermaid@11.12.2 qrcode@1.5.4 jsbarcode@3.12.3 sql-formatter@15.6.12 terser@5.44.1 svgo@4.0.0 graphql@16.12.0 validator@13.15.26 ip-address@10.1.0 openapi-types@12.1.3 swagger-parser@10.0.3 rss-parser@3.13.0
```

---

## Appendix: Estimated Line Counts

| Component | Estimated Lines |
|-----------|-----------------|
| Tools package (815 tools) | ~80,000 |
| Web app (pages, components) | ~25,000 |
| API routes | ~5,000 |
| MCP server | ~2,000 |
| Tests | ~40,000 |
| Configuration | ~2,000 |
| **Total** | **~154,000** |

---

*This implementation plan provides a complete roadmap for building utils.live from start to finish.*
