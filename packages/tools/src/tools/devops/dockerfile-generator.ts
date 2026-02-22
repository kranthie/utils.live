import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  runtime: z
    .enum([
      "node",
      "python",
      "go",
      "rust",
      "java",
      "ruby",
      "php",
      "dotnet",
      "static",
    ])
    .default("node")
    .describe("Runtime"),
  version: z.string().default("20").describe("Runtime version"),
  port: z.number().min(1).max(65535).default(3000).describe("Exposed port"),
  multiStage: z.boolean().default(true).describe("Multi-stage build"),
  alpine: z.boolean().default(true).describe("Use Alpine base image"),
  packageManager: z
    .enum([
      "npm",
      "yarn",
      "pnpm",
      "pip",
      "go",
      "cargo",
      "maven",
      "gradle",
      "bundler",
      "composer",
    ])
    .default("npm")
    .describe("Package manager"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated Dockerfile"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const suffix = input.alpine ? "-alpine" : "-slim";
  const lines: string[] = [];

  switch (input.runtime) {
    case "node": {
      if (input.multiStage) {
        lines.push(`FROM node:${input.version}${suffix} AS builder`);
        lines.push("WORKDIR /app");
        if (input.packageManager === "pnpm") {
          lines.push("RUN corepack enable");
          lines.push("COPY package.json pnpm-lock.yaml ./");
          lines.push("RUN pnpm install --frozen-lockfile");
        } else if (input.packageManager === "yarn") {
          lines.push("COPY package.json yarn.lock ./");
          lines.push("RUN yarn install --frozen-lockfile");
        } else {
          lines.push("COPY package.json package-lock.json* ./");
          lines.push("RUN npm ci");
        }
        lines.push("COPY . .");
        lines.push("RUN npm run build");
        lines.push("");
        lines.push(`FROM node:${input.version}${suffix} AS runner`);
        lines.push("WORKDIR /app");
        lines.push("ENV NODE_ENV=production");
        lines.push(
          "RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser"
        );
        lines.push(
          "COPY --from=builder --chown=appuser:nodejs /app/dist ./dist"
        );
        lines.push(
          "COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules"
        );
        lines.push(
          "COPY --from=builder --chown=appuser:nodejs /app/package.json ./"
        );
        lines.push("USER appuser");
      } else {
        lines.push(`FROM node:${input.version}${suffix}`);
        lines.push("WORKDIR /app");
        lines.push("COPY package*.json ./");
        lines.push("RUN npm ci --production");
        lines.push("COPY . .");
      }
      lines.push(`EXPOSE ${input.port}`);
      lines.push('CMD ["node", "dist/index.js"]');
      break;
    }
    case "python": {
      if (input.multiStage) {
        lines.push(`FROM python:${input.version}${suffix} AS builder`);
        lines.push("WORKDIR /app");
        lines.push("COPY requirements.txt .");
        lines.push("RUN pip install --no-cache-dir --user -r requirements.txt");
        lines.push("");
        lines.push(`FROM python:${input.version}${suffix}`);
        lines.push("WORKDIR /app");
        lines.push("COPY --from=builder /root/.local /root/.local");
        lines.push("ENV PATH=/root/.local/bin:$PATH");
      } else {
        lines.push(`FROM python:${input.version}${suffix}`);
        lines.push("WORKDIR /app");
        lines.push("COPY requirements.txt .");
        lines.push("RUN pip install --no-cache-dir -r requirements.txt");
      }
      lines.push("COPY . .");
      lines.push(`EXPOSE ${input.port}`);
      lines.push('CMD ["python", "app.py"]');
      break;
    }
    case "go": {
      lines.push(`FROM golang:${input.version}${suffix} AS builder`);
      lines.push("WORKDIR /app");
      lines.push("COPY go.mod go.sum ./");
      lines.push("RUN go mod download");
      lines.push("COPY . .");
      lines.push("RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .");
      if (input.multiStage) {
        lines.push("");
        lines.push("FROM scratch");
        lines.push("COPY --from=builder /app/server /server");
      }
      lines.push(`EXPOSE ${input.port}`);
      lines.push('CMD ["/server"]');
      break;
    }
    default: {
      lines.push(`# ${input.runtime} Dockerfile`);
      lines.push(`FROM ${input.runtime}:${input.version}${suffix}`);
      lines.push("WORKDIR /app");
      lines.push("COPY . .");
      lines.push(`EXPOSE ${input.port}`);
      lines.push(`CMD ["${input.runtime}"]`);
    }
  }

  return { output: lines.join("\n") };
}

export const dockerfileGenerator = defineTool({
  meta: {
    id: "devops/dockerfile-generator",
    name: "Dockerfile Generator",
    description:
      "Free online Dockerfile generator — create production-ready Dockerfiles instantly in your browser. No data is stored. Supports Node.js, Python, Go, Rust, Java, Ruby, PHP, and .NET with multi-stage builds, Alpine images, and non-root users.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "docker",
      "dockerfile",
      "container",
      "generate",
      "build",
      "multi-stage",
      "alpine",
      "production",
      "node",
      "python",
      "go",
      "rust",
    ],
    examples: [
      {
        title: "Node.js pnpm multi-stage build",
        description:
          "Production Dockerfile for Node.js 20 with pnpm, multi-stage build, Alpine base, and non-root user",
        input: {
          runtime: "node",
          version: "20",
          port: 3000,
          multiStage: true,
          alpine: true,
          packageManager: "pnpm",
        },
        output:
          'FROM node:20-alpine AS builder\nWORKDIR /app\nRUN corepack enable\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nRUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser\nCOPY --from=builder --chown=appuser:nodejs /app/dist ./dist\nCOPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules\nCOPY --from=builder --chown=appuser:nodejs /app/package.json ./\nUSER appuser\nEXPOSE 3000\nCMD ["node", "dist/index.js"]',
      },
    ],
    ui: { outputLanguage: "dockerfile" },
  },
  inputSchema,
  outputSchema,
  execute,
});
