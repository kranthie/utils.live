# @utils-live/tools

The core tool engine for [utils.live](https://utils.live) -- a free, open-source collection of 700+ developer utilities implemented as stateless pure functions.

## Overview

This package contains:

- **Tool definitions** -- every tool is defined via `defineTool()` with Zod schemas for input/output validation
- **Tool registry** -- a global registry that indexes all tools by ID, category, and keywords
- **Tool executor** -- validates input, runs the tool with tier-based timeouts, and returns typed results
- **Category definitions** -- 34 categories organizing the tools
- **Error handling** -- structured error types for validation, execution, and timeout failures

## Architecture

```
src/
├── core/
│   ├── define-tool.ts      # defineTool() factory function
│   ├── executor.ts         # executeTool() with validation and timeouts
│   ├── registry.ts         # Global tool registry
│   └── errors.ts           # Tool error types
├── tools/
│   ├── json/               # JSON tools (format, validate, diff, etc.)
│   ├── text/               # Text tools (encode, decode, transform, etc.)
│   ├── encoding/           # Encoding tools (base64, URL, hex, etc.)
│   ├── crypto/             # Cryptography tools (hash, encrypt, etc.)
│   ├── ...                 # 34 categories total
│   └── register.ts         # Side-effect registration of all tools
├── categories/
│   └── categories.ts       # Category metadata definitions
└── types/
    └── index.ts            # TypeScript type definitions
```

## Usage

```typescript
import { executeTool, globalRegistry } from "@utils-live/tools";

// Get a tool by ID
const tool = globalRegistry.getTool("json/format");

// Execute a tool
const result = executeTool(tool, { input: '{"a":1}' }, { indent: 2 });

if (result.success) {
  console.log(result.data.output);
} else {
  console.error(result.error);
}
```

## Tool Tiers

All tools are **CLIENT** tier -- they run entirely in the browser with no server round-trips.

| Tier     | Environment | Timeout | Use Case                     |
| -------- | ----------- | ------- | ---------------------------- |
| `CLIENT` | Browser     | 5s      | All tools (client-side only) |

## Adding a New Tool

```bash
# From the repository root
pnpm generate:tool -- --name my-tool --category json
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed instructions.

## Testing

```bash
# Run all tests
pnpm test

# Run a specific test
pnpm test my-tool

# Watch mode
pnpm test:watch

# Coverage (100% threshold enforced)
pnpm test:coverage
```
