# utils.live — Technical Architecture

> Detailed technical architecture for the utils.live platform.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                      │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│   Web Browser   │    MCP Server   │   CLI (future)  │   Third-party     │
│   (Next.js App) │   (AI Agents)   │                 │   Integrations    │
└────────┬────────┴────────┬────────┴────────┬────────┴─────────┬─────────┘
         │                 │                 │                  │
         ▼                 ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE CDN                                   │
│                    (Static assets, Edge caching)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE CLOUD RUN                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     NEXT.JS APPLICATION                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │   React UI   │  │  API Routes  │  │ Server       │           │   │
│  │  │  (Frontend)  │  │  (/api/v1)   │  │ Components   │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │                           │                                       │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              TOOL ENGINE (Isomorphic)                     │   │   │
│  │  │   /lib/tools/* - Pure functions, runs in browser + Node  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                           │
         ▼                    ▼                           ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│ CLOUD SQL       │  │ UPSTASH REDIS   │  │ EXTERNAL SERVICES           │
│ (PostgreSQL)    │  │ (Cache + Rate)  │  │ ┌─────────┐ ┌─────────┐    │
│                 │  │                 │  │ │OpenRouter│ │ Stripe  │    │
│ • Users         │  │ • Tool cache    │  │ │(Gemini)  │ │         │    │
│ • API Keys      │  │ • Rate limits   │  │ └─────────┘ └─────────┘    │
│ • History       │  │ • Sessions      │  │ ┌─────────┐ ┌─────────┐    │
│ • Credits       │  │                 │  │ │ Sentry  │ │ PostHog │    │
│ • Transactions  │  │                 │  │ └─────────┘ └─────────┘    │
└─────────────────┘  └─────────────────┘  └─────────────────────────────┘
```

---

## 2. Monorepo Structure

```
utils.live/
├── apps/
│   └── web/                        # Next.js application
│       ├── app/                    # App Router
│       │   ├── (marketing)/        # Landing, pricing, docs
│       │   │   ├── page.tsx        # Landing page
│       │   │   ├── pricing/
│       │   │   └── docs/
│       │   ├── (dashboard)/        # Protected routes
│       │   │   └── dashboard/
│       │   │       ├── page.tsx
│       │   │       ├── history/
│       │   │       ├── favorites/
│       │   │       ├── api-keys/
│       │   │       ├── credits/
│       │   │       └── settings/
│       │   ├── tools/              # Tool pages
│       │   │   ├── page.tsx        # All tools grid
│       │   │   └── [category]/
│       │   │       ├── page.tsx    # Category page
│       │   │       └── [tool]/
│       │   │           └── page.tsx # Tool page
│       │   ├── api/                # API routes
│       │   │   └── v1/
│       │   │       ├── tools/
│       │   │       │   └── [category]/
│       │   │       │       └── [tool]/
│       │   │       │           └── route.ts
│       │   │       ├── auth/
│       │   │       │   └── [...nextauth]/
│       │   │       ├── user/
│       │   │       └── payments/
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                 # shadcn/ui components
│       │   ├── tools/              # Tool-specific components
│       │   ├── layout/             # Layout components
│       │   └── shared/             # Shared components
│       ├── lib/
│       │   ├── db/                 # Database (Prisma)
│       │   ├── auth/               # Auth utilities
│       │   ├── api/                # API utilities
│       │   └── utils/              # General utilities
│       ├── hooks/                  # React hooks
│       ├── styles/                 # Global styles
│       ├── public/
│       │   ├── fonts/
│       │   └── images/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── tools/                      # Core tool logic (isomorphic)
│   │   ├── src/
│   │   │   ├── index.ts            # Exports all tools
│   │   │   ├── registry.ts         # Tool registry/metadata
│   │   │   ├── types.ts            # Shared types
│   │   │   ├── json/               # JSON tools
│   │   │   │   ├── index.ts
│   │   │   │   ├── formatter.ts
│   │   │   │   ├── validator.ts
│   │   │   │   ├── minify.ts
│   │   │   │   └── ...
│   │   │   ├── encoding/           # Encoding tools
│   │   │   ├── crypto/             # Crypto tools
│   │   │   ├── text/               # Text tools
│   │   │   └── ... (24 categories)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mcp/                        # MCP Server
│   │   ├── src/
│   │   │   ├── index.ts            # MCP server entry
│   │   │   ├── server.ts           # Server implementation
│   │   │   ├── tools.ts            # Tool definitions
│   │   │   └── client.ts           # API client
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                         # Shared UI components
│   │   ├── src/
│   │   │   ├── code-editor.tsx     # Monaco wrapper
│   │   │   ├── tool-layout.tsx     # Tool page layout
│   │   │   └── ...
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                     # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION.md
│   └── catalog.md
│
├── scripts/
│   ├── generate-tools.ts           # Generate tool boilerplate
│   ├── generate-openapi.ts         # Generate OpenAPI spec
│   └── seed-database.ts
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-preview.yml
│       └── deploy-production.yml
│
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 3. Tool Architecture

### 3.1 Isomorphic Tool Design

Each tool is a pure function that works in both browser and Node.js:

```typescript
// packages/tools/src/json/formatter.ts

import { z } from 'zod';
import { Tool, ToolResult } from '../types';

// Input schema (used for validation + OpenAPI generation)
export const inputSchema = z.object({
  input: z.string().min(1, 'Input is required'),
  indent: z.number().min(0).max(8).default(2),
  sortKeys: z.boolean().default(false),
});

export type Input = z.infer<typeof inputSchema>;

// Output schema
export const outputSchema = z.object({
  output: z.string(),
  stats: z.object({
    inputSize: z.number(),
    outputSize: z.number(),
    keys: z.number(),
    depth: z.number(),
  }),
});

export type Output = z.infer<typeof outputSchema>;

// Tool metadata
export const metadata: Tool = {
  id: 'json/formatter',
  name: 'JSON Formatter',
  description: 'Pretty print JSON with syntax highlighting',
  category: 'json',
  tier: 'client', // 'client' | 'server-light' | 'server-heavy' | 'ai'
  credits: 0,
  keywords: ['json', 'format', 'beautify', 'pretty print'],
  inputSchema,
  outputSchema,
};

// Pure function - the actual tool logic
export function execute(input: Input): ToolResult<Output> {
  try {
    // Validate input
    const parsed = inputSchema.parse(input);

    // Parse JSON
    const obj = JSON.parse(parsed.input);

    // Sort keys if requested
    const sorted = parsed.sortKeys ? sortObjectKeys(obj) : obj;

    // Format
    const output = JSON.stringify(sorted, null, parsed.indent);

    // Calculate stats
    const stats = {
      inputSize: parsed.input.length,
      outputSize: output.length,
      keys: countKeys(obj),
      depth: getDepth(obj),
    };

    return {
      success: true,
      data: { output, stats },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: error instanceof Error ? error.message : 'Invalid JSON',
      },
    };
  }
}

// Helper functions
function sortObjectKeys(obj: unknown): unknown { /* ... */ }
function countKeys(obj: unknown): number { /* ... */ }
function getDepth(obj: unknown): number { /* ... */ }
```

### 3.2 Tool Registry

```typescript
// packages/tools/src/registry.ts

import * as jsonFormatter from './json/formatter';
import * as jsonValidator from './json/validator';
// ... import all 815 tools

export const tools = {
  'json/formatter': jsonFormatter,
  'json/validator': jsonValidator,
  // ... all tools
} as const;

export type ToolId = keyof typeof tools;

export function getTool(id: ToolId) {
  return tools[id];
}

export function getAllTools() {
  return Object.values(tools).map(t => t.metadata);
}

export function getToolsByCategory(category: string) {
  return Object.values(tools)
    .filter(t => t.metadata.category === category)
    .map(t => t.metadata);
}
```

### 3.3 Categories

```typescript
// packages/tools/src/categories.ts

export const categories = [
  { id: 'json', name: 'JSON Tools', icon: 'braces', count: 15 },
  { id: 'yaml', name: 'YAML Tools', icon: 'file-code', count: 8 },
  { id: 'xml', name: 'XML Tools', icon: 'code', count: 10 },
  { id: 'csv', name: 'CSV & TSV', icon: 'table', count: 12 },
  { id: 'toml', name: 'TOML & INI', icon: 'settings', count: 6 },
  { id: 'data', name: 'Other Data Formats', icon: 'database', count: 10 },
  { id: 'text', name: 'Text Transformation', icon: 'type', count: 18 },
  { id: 'text-analysis', name: 'Text Analysis', icon: 'bar-chart', count: 12 },
  { id: 'text-compare', name: 'Text Comparison', icon: 'git-compare', count: 6 },
  { id: 'text-generate', name: 'Text Generation', icon: 'wand', count: 8 },
  { id: 'text-extract', name: 'Text Extraction', icon: 'filter', count: 8 },
  { id: 'markdown', name: 'Markdown', icon: 'file-text', count: 14 },
  { id: 'docs', name: 'Documentation', icon: 'book', count: 10 },
  { id: 'readme', name: 'README & Docs', icon: 'book-open', count: 8 },
  { id: 'html', name: 'HTML', icon: 'code', count: 14 },
  { id: 'css', name: 'CSS', icon: 'palette', count: 12 },
  { id: 'seo', name: 'SEO & Meta', icon: 'search', count: 12 },
  { id: 'security', name: 'Web Security', icon: 'shield', count: 8 },
  { id: 'formatters', name: 'Code Formatters', icon: 'code', count: 16 },
  { id: 'minifiers', name: 'Minifiers', icon: 'minimize', count: 10 },
  { id: 'code-analysis', name: 'Code Analysis', icon: 'scan', count: 8 },
  { id: 'encoding', name: 'Base Encoding', icon: 'binary', count: 12 },
  { id: 'url-encoding', name: 'URL Encoding', icon: 'link', count: 8 },
  { id: 'text-encoding', name: 'Text Encoding', icon: 'type', count: 10 },
  { id: 'charsets', name: 'Character Sets', icon: 'globe', count: 8 },
  { id: 'number-encoding', name: 'Number Encoding', icon: 'hash', count: 8 },
  { id: 'hashing', name: 'Hashing', icon: 'key', count: 14 },
  { id: 'hmac', name: 'HMAC & KDF', icon: 'lock', count: 6 },
  { id: 'encryption', name: 'Encryption', icon: 'shield', count: 8 },
  { id: 'keys', name: 'Keys & Certificates', icon: 'key', count: 10 },
  { id: 'passwords', name: 'Password Tools', icon: 'lock', count: 8 },
  { id: 'jwt', name: 'JWT Tools', icon: 'key', count: 10 },
  { id: 'ids', name: 'ID Generators', icon: 'fingerprint', count: 14 },
  { id: 'tokens', name: 'Other Tokens', icon: 'ticket', count: 6 },
  { id: 'regex', name: 'Regex Tools', icon: 'regex', count: 12 },
  { id: 'regex-library', name: 'Regex Library', icon: 'library', count: 8 },
  { id: 'date-convert', name: 'Date Conversion', icon: 'calendar', count: 12 },
  { id: 'date-calc', name: 'Date Calculation', icon: 'calculator', count: 10 },
  { id: 'time', name: 'Time Tools', icon: 'clock', count: 8 },
  { id: 'cron', name: 'Cron & Scheduling', icon: 'timer', count: 8 },
  { id: 'calendar', name: 'Calendar Tools', icon: 'calendar', count: 6 },
  { id: 'units', name: 'Unit Conversion', icon: 'scale', count: 16 },
  { id: 'numbers', name: 'Number Tools', icon: 'hash', count: 12 },
  { id: 'math', name: 'Math Operations', icon: 'calculator', count: 14 },
  { id: 'color-convert', name: 'Color Conversion', icon: 'palette', count: 12 },
  { id: 'color-generate', name: 'Color Generation', icon: 'palette', count: 10 },
  { id: 'color-analysis', name: 'Color Analysis', icon: 'eye', count: 8 },
  { id: 'diagrams', name: 'Diagrams', icon: 'git-branch', count: 10 },
  { id: 'qr', name: 'QR Codes', icon: 'qr-code', count: 8 },
  { id: 'barcodes', name: 'Barcodes', icon: 'barcode', count: 10 },
  { id: 'charts', name: 'Charts & Graphs', icon: 'bar-chart', count: 8 },
  { id: 'image-convert', name: 'Image Conversion', icon: 'image', count: 10 },
  { id: 'image-edit', name: 'Image Editing', icon: 'crop', count: 12 },
  { id: 'image-effects', name: 'Image Effects', icon: 'sparkles', count: 10 },
  { id: 'image-analysis', name: 'Image Analysis', icon: 'scan', count: 8 },
  { id: 'svg', name: 'SVG Operations', icon: 'pen-tool', count: 12 },
  { id: 'svg-generate', name: 'SVG Generators', icon: 'shapes', count: 8 },
  { id: 'api', name: 'API & HTTP', icon: 'globe', count: 14 },
  { id: 'codegen', name: 'Code Generation', icon: 'code', count: 12 },
  { id: 'config', name: 'Config Tools', icon: 'settings', count: 12 },
  { id: 'git', name: 'Git Tools', icon: 'git-branch', count: 8 },
  { id: 'docker', name: 'Docker & K8s', icon: 'container', count: 10 },
  { id: 'openapi', name: 'OpenAPI Tools', icon: 'book', count: 10 },
  { id: 'schema', name: 'Schema Tools', icon: 'database', count: 8 },
  { id: 'sql', name: 'SQL Tools', icon: 'database', count: 12 },
  { id: 'database', name: 'Database Tools', icon: 'database', count: 8 },
  { id: 'dns', name: 'DNS Tools', icon: 'globe', count: 8 },
  { id: 'ssl', name: 'SSL/TLS Tools', icon: 'lock', count: 8 },
  { id: 'http', name: 'HTTP Tools', icon: 'globe', count: 8 },
  { id: 'ip', name: 'IP Tools', icon: 'network', count: 10 },
  { id: 'validators', name: 'Format Validators', icon: 'check', count: 16 },
  { id: 'data-validators', name: 'Data Validators', icon: 'check-circle', count: 10 },
  { id: 'rss', name: 'RSS/Atom Tools', icon: 'rss', count: 8 },
  { id: 'structured-data', name: 'Structured Data', icon: 'code', count: 8 },
  { id: 'email', name: 'Email Tools', icon: 'mail', count: 8 },
  { id: 'messaging', name: 'Messaging Formats', icon: 'message-circle', count: 6 },
  { id: 'ai-text', name: 'AI Text Tools', icon: 'sparkles', count: 8 },
  { id: 'ai-code', name: 'AI Code Tools', icon: 'code', count: 8 },
  { id: 'ai-other', name: 'Other AI Tools', icon: 'wand', count: 6 },
  { id: 'string', name: 'String Utilities', icon: 'type', count: 8 },
  { id: 'fun', name: 'Fun Tools', icon: 'smile', count: 8 },
  { id: 'reference', name: 'Reference Tools', icon: 'book', count: 8 },
  { id: 'generators', name: 'Generators', icon: 'file-plus', count: 6 },
] as const;
```

---

## 4. API Architecture

### 4.1 API Route Handler

```typescript
// apps/web/app/api/v1/tools/[category]/[tool]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTool } from '@utils-live/tools';
import { validateApiKey, checkRateLimit, deductCredits } from '@/lib/api';
import { trackUsage } from '@/lib/analytics';

export async function POST(
  request: NextRequest,
  { params }: { params: { category: string; tool: string } }
) {
  const toolId = `${params.category}/${params.tool}`;
  const tool = getTool(toolId);

  if (!tool) {
    return NextResponse.json(
      { success: false, error: { code: 'TOOL_NOT_FOUND', message: 'Tool not found' } },
      { status: 404 }
    );
  }

  // Authenticate
  const auth = await validateApiKey(request);
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 401 }
    );
  }

  // Rate limit
  const rateLimit = await checkRateLimit(auth.userId || request.ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: rateLimit.error },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  // Check credits for paid tools
  if (tool.metadata.credits > 0) {
    const hasCredits = await checkCredits(auth.userId, tool.metadata.credits);
    if (!hasCredits) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } },
        { status: 402 }
      );
    }
  }

  // Parse input
  const body = await request.json();

  // Execute tool
  const startTime = Date.now();
  const result = tool.execute(body);
  const executionTime = Date.now() - startTime;

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  // Deduct credits if applicable
  if (tool.metadata.credits > 0) {
    await deductCredits(auth.userId, tool.metadata.credits, toolId);
  }

  // Track usage
  await trackUsage({
    userId: auth.userId,
    toolId,
    creditsUsed: tool.metadata.credits,
    executionTime,
    inputSize: JSON.stringify(body).length,
  });

  // Return result
  return NextResponse.json({
    success: true,
    data: result.data,
    meta: {
      creditsUsed: tool.metadata.credits,
      creditsRemaining: await getCredits(auth.userId),
      executionTime,
    },
  });
}
```

### 4.2 OpenAPI Generation

```typescript
// scripts/generate-openapi.ts

import { getAllTools } from '@utils-live/tools';
import { zodToJsonSchema } from 'zod-to-json-schema';

function generateOpenAPISpec() {
  const tools = getAllTools();

  const paths: Record<string, any> = {};

  for (const tool of tools) {
    const path = `/api/v1/tools/${tool.id}`;

    paths[path] = {
      post: {
        summary: tool.name,
        description: tool.description,
        tags: [tool.category],
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: zodToJsonSchema(tool.inputSchema),
            },
          },
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: zodToJsonSchema(tool.outputSchema),
                    meta: {
                      type: 'object',
                      properties: {
                        creditsUsed: { type: 'number' },
                        creditsRemaining: { type: 'number' },
                        executionTime: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          // ... error responses
        },
      },
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'utils.live API',
      version: '1.0.0',
      description: '815 developer utility tools as an API',
    },
    servers: [
      { url: 'https://utils.live', description: 'Production' },
    ],
    paths,
    components: {
      securitySchemes: {
        apiKey: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
        },
      },
    },
  };
}
```

---

## 5. MCP Server Architecture

### 5.1 MCP Server Implementation

```typescript
// packages/mcp/src/server.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getAllTools } from '@utils-live/tools';
import { UtilsLiveClient } from './client';

const client = new UtilsLiveClient({
  baseUrl: process.env.UTILS_LIVE_API_URL || 'https://utils.live',
  apiKey: process.env.UTILS_LIVE_API_KEY,
});

const server = new Server(
  {
    name: 'utils-live-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools
const tools = getAllTools();

server.setRequestHandler('tools/list', async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.id.replace('/', '_'), // e.g., "json_formatter"
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.inputSchema.shape).map(([key, schema]) => [
            key,
            zodToJsonSchema(schema),
          ])
        ),
        required: Object.keys(tool.inputSchema.shape).filter(
          key => !tool.inputSchema.shape[key].isOptional()
        ),
      },
    })),
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  const toolId = name.replace('_', '/');

  try {
    const result = await client.executeTool(toolId, args);

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${result.error.message}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### 5.2 MCP Client

```typescript
// packages/mcp/src/client.ts

export class UtilsLiveClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: { baseUrl: string; apiKey?: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async executeTool(toolId: string, input: unknown) {
    const response = await fetch(`${this.baseUrl}/api/v1/tools/${toolId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(input),
    });

    return response.json();
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Tool Page Component

```typescript
// apps/web/components/tools/tool-page.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { CodeEditor } from '@/components/ui/code-editor';
import { Button } from '@/components/ui/button';
import { Tool } from '@utils-live/tools';

interface ToolPageProps {
  tool: Tool;
  execute: (input: unknown) => Promise<ToolResult>;
}

export function ToolPage({ tool, execute }: ToolPageProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState(getDefaultOptions(tool));

  const debouncedInput = useDebounce(input, 300);

  // Auto-execute on input change (for client-side tools)
  useEffect(() => {
    if (tool.tier === 'client' && debouncedInput) {
      handleExecute();
    }
  }, [debouncedInput, options]);

  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await execute({ input, ...options });

      if (result.success) {
        setOutput(result.data.output);
      } else {
        setError(result.error.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [input, options, execute]);

  // Keyboard shortcut: Cmd+Enter to execute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExecute]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Input Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="text-sm font-medium">Input</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setInput('')}>
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePaste}>
              Paste
            </Button>
          </div>
        </div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language={tool.inputLanguage || 'text'}
          className="flex-1"
        />
      </div>

      {/* Output Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="text-sm font-medium">Output</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              Download
            </Button>
          </div>
        </div>
        {error ? (
          <div className="flex-1 p-4 bg-red-50 dark:bg-red-900/20 text-red-600">
            {error}
          </div>
        ) : (
          <CodeEditor
            value={output}
            language={tool.outputLanguage || 'text'}
            readOnly
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
```

### 6.2 Web Worker Execution

```typescript
// apps/web/lib/worker/tool-worker.ts

import { getAllTools } from '@utils-live/tools';

self.onmessage = async (event) => {
  const { toolId, input, requestId } = event.data;

  try {
    const tool = getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const result = tool.execute(input);

    self.postMessage({
      requestId,
      success: true,
      result,
    });
  } catch (error) {
    self.postMessage({
      requestId,
      success: false,
      error: error.message,
    });
  }
};

// apps/web/hooks/use-tool-worker.ts

export function useToolWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/lib/worker/tool-worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      const { requestId, success, result, error } = event.data;
      const pending = pendingRequests.current.get(requestId);

      if (pending) {
        if (success) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(error));
        }
        pendingRequests.current.delete(requestId);
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const execute = useCallback((toolId: string, input: unknown): Promise<ToolResult> => {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      pendingRequests.current.set(requestId, { resolve, reject });
      workerRef.current?.postMessage({ toolId, input, requestId });
    });
  }, []);

  return { execute };
}
```

---

## 7. Authentication Architecture

### 7.1 NextAuth Configuration

```typescript
// apps/web/lib/auth/config.ts

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.credits = user.credits;
        session.user.tier = user.tier;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
```

### 7.2 API Key Authentication

```typescript
// apps/web/lib/api/auth.ts

import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: { code: 'MISSING_API_KEY', message: 'API key required' } };
  }

  const apiKey = authHeader.slice(7);
  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!key) {
    return { success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } };
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return { success: false, error: { code: 'EXPIRED_API_KEY', message: 'API key expired' } };
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    success: true,
    userId: key.userId,
    user: key.user,
  };
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `utl_sk_${crypto.randomBytes(32).toString('base64url')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 12);

  return { key, hash, prefix };
}
```

---

## 8. Payment Architecture

### 8.1 Stripe Integration

```typescript
// apps/web/lib/payments/stripe.ts

import Stripe from 'stripe';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const CREDIT_PACKAGES = {
  starter: { credits: 100, price: 100, priceId: 'price_xxx' },
  basic: { credits: 500, price: 500, priceId: 'price_xxx' },
  standard: { credits: 1200, price: 1000, priceId: 'price_xxx' },
  pro: { credits: 3500, price: 2500, priceId: 'price_xxx' },
  power: { credits: 8000, price: 5000, priceId: 'price_xxx' },
};

export async function createCheckoutSession(userId: string, packageId: string) {
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) throw new Error('Invalid package');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: pkg.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId,
      credits: String(pkg.credits),
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/credits?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/credits?canceled=true`,
    customer_email: user.email,
  });

  return session;
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, credits } = session.metadata!;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            credits: { increment: parseInt(credits) },
            tier: 'credit',
          },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: parseInt(credits),
            type: 'purchase',
            description: `Purchased ${credits} credits`,
            stripePaymentId: session.payment_intent as string,
          },
        }),
      ]);
      break;
    }
  }
}
```

---

## 9. Caching & Rate Limiting

### 9.1 Upstash Redis Setup

```typescript
// apps/web/lib/cache/redis.ts

import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache tool results (for server-side tools)
export async function cacheToolResult(
  toolId: string,
  inputHash: string,
  result: unknown,
  ttl: number = 3600
) {
  const key = `tool:${toolId}:${inputHash}`;
  await redis.set(key, JSON.stringify(result), { ex: ttl });
}

export async function getCachedToolResult(toolId: string, inputHash: string) {
  const key = `tool:${toolId}:${inputHash}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached as string) : null;
}
```

### 9.2 Rate Limiting

```typescript
// apps/web/lib/api/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/cache/redis';

const rateLimiters = {
  anonymous: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1m'), // 10 per minute
    prefix: 'rl:anon',
  }),
  authenticated: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1m'), // 30 per minute
    prefix: 'rl:auth',
  }),
  credit: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1m'), // 1000 per minute
    prefix: 'rl:credit',
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1m'), // 100 per minute
    prefix: 'rl:api',
  }),
};

export async function checkRateLimit(
  identifier: string,
  tier: 'anonymous' | 'authenticated' | 'credit' | 'api'
) {
  const limiter = rateLimiters[tier];
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
    retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
  };
}
```

---

## 10. AI Tools Architecture

### 10.1 OpenRouter Integration

```typescript
// apps/web/lib/ai/openrouter.ts

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callAI(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
) {
  const {
    model = 'google/gemini-2.5-flash',
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://utils.live',
      'X-Title': 'utils.live',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Calculate credit cost based on token usage
export function calculateAICreditCost(inputTokens: number): number {
  if (inputTokens <= 1000) return 1;      // Simple: ~750 words
  if (inputTokens <= 4000) return 2;      // Medium: ~3K words
  if (inputTokens <= 10000) return 5;     // Complex: ~7.5K words
  return 10;                               // Large: ~37K words
}
```

### 10.2 AI Tool Example

```typescript
// packages/tools/src/ai/summarizer.ts

import { z } from 'zod';
import { Tool, ToolResult } from '../types';
import { callAI, calculateAICreditCost } from './openrouter';

export const inputSchema = z.object({
  text: z.string().min(1).max(100000),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  style: z.enum(['bullet', 'paragraph']).default('paragraph'),
});

export type Input = z.infer<typeof inputSchema>;

export const metadata: Tool = {
  id: 'ai/summarizer',
  name: 'Text Summarizer',
  description: 'Summarize long text using AI',
  category: 'ai-text',
  tier: 'ai',
  credits: 'dynamic', // Calculated based on input
  keywords: ['summarize', 'summary', 'tldr', 'ai'],
};

export async function execute(input: Input): Promise<ToolResult> {
  const parsed = inputSchema.parse(input);

  const lengthGuide = {
    short: '2-3 sentences',
    medium: '1-2 paragraphs',
    long: '3-4 paragraphs',
  };

  const prompt = `Summarize the following text in ${lengthGuide[parsed.length]}.
Format: ${parsed.style === 'bullet' ? 'Use bullet points' : 'Use paragraphs'}.

Text to summarize:
${parsed.text}`;

  try {
    const summary = await callAI(prompt);
    const inputTokens = Math.ceil(parsed.text.length / 4);
    const creditsUsed = calculateAICreditCost(inputTokens);

    return {
      success: true,
      data: {
        summary,
        inputLength: parsed.text.length,
        outputLength: summary.length,
        creditsUsed,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error.message,
      },
    };
  }
}
```

---

## 11. Database Architecture (Prisma)

```prisma
// apps/web/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Extended User model
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  credits       Int       @default(0)
  tier          UserTier  @default(FREE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts           Account[]
  sessions           Session[]
  apiKeys            ApiKey[]
  usageHistory       UsageHistory[]
  favorites          Favorite[]
  creditTransactions CreditTransaction[]
}

enum UserTier {
  FREE
  CREDIT
}

model ApiKey {
  id         String    @id @default(cuid())
  userId     String
  name       String
  keyHash    String    @unique
  keyPrefix  String
  lastUsedAt DateTime?
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UsageHistory {
  id            String   @id @default(cuid())
  userId        String
  toolId        String
  creditsUsed   Int      @default(0)
  inputSize     Int?
  executionTime Int?
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([toolId, createdAt(sort: Desc)])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  toolId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, toolId])
  @@index([userId])
}

model CreditTransaction {
  id              String   @id @default(cuid())
  userId          String
  amount          Int
  type            TransactionType
  description     String?
  stripePaymentId String?
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
}

enum TransactionType {
  PURCHASE
  USAGE
  REFUND
}
```

---

## 12. Deployment Architecture

### 12.1 GCP Cloud Run

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 12.2 Cloud Build Configuration

```yaml
# cloudbuild.yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/utils-live:$COMMIT_SHA', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/utils-live:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'utils-live'
      - '--image=gcr.io/$PROJECT_ID/utils-live:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--memory=1Gi'
      - '--cpu=1'
      - '--min-instances=0'
      - '--max-instances=10'
      - '--set-env-vars=NODE_ENV=production'

images:
  - 'gcr.io/$PROJECT_ID/utils-live:$COMMIT_SHA'
```

---

*This architecture document provides the technical foundation for building utils.live.*
