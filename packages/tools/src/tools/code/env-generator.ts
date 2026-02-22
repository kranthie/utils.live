import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  framework: z
    .enum([
      "nextjs",
      "react",
      "node",
      "django",
      "rails",
      "laravel",
      "spring",
      "generic",
    ])
    .default("generic")
    .describe("Framework template"),
  database: z
    .enum(["none", "postgresql", "mysql", "mongodb", "redis", "sqlite"])
    .default("none")
    .describe("Database to include"),
  auth: z.boolean().default(false).describe("Include auth variables"),
  email: z.boolean().default(false).describe("Include email/SMTP variables"),
  storage: z
    .boolean()
    .default(false)
    .describe("Include cloud storage variables"),
  logging: z.boolean().default(false).describe("Include logging variables"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated .env template"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = [
    "# ============================================",
    "# Environment Configuration",
    `# Framework: ${input.framework}`,
    `# Generated template - fill in your values`,
    "# ============================================",
    "",
    "# Application",
    "NODE_ENV=development",
    "APP_NAME=my-app",
    "APP_PORT=3000",
    "APP_URL=http://localhost:3000",
    "APP_SECRET=change-me-to-a-random-secret",
    "",
  ];

  if (input.framework === "nextjs" || input.framework === "react") {
    lines.push("# Next.js / React");
    lines.push("NEXT_PUBLIC_API_URL=http://localhost:3000/api");
    lines.push("NEXT_PUBLIC_APP_NAME=my-app");
    lines.push("");
  }

  if (input.database !== "none") {
    lines.push("# Database");
    switch (input.database) {
      case "postgresql":
        lines.push(
          "DATABASE_URL=postgresql://user:password@localhost:5432/mydb"
        );
        lines.push("DB_HOST=localhost");
        lines.push("DB_PORT=5432");
        lines.push("DB_NAME=mydb");
        lines.push("DB_USER=user");
        lines.push("DB_PASSWORD=password");
        break;
      case "mysql":
        lines.push("DATABASE_URL=mysql://user:password@localhost:3306/mydb");
        lines.push("DB_HOST=localhost");
        lines.push("DB_PORT=3306");
        lines.push("DB_NAME=mydb");
        lines.push("DB_USER=user");
        lines.push("DB_PASSWORD=password");
        break;
      case "mongodb":
        lines.push("MONGODB_URI=mongodb://localhost:27017/mydb");
        lines.push("DB_NAME=mydb");
        break;
      case "redis":
        lines.push("REDIS_URL=redis://localhost:6379");
        lines.push("REDIS_HOST=localhost");
        lines.push("REDIS_PORT=6379");
        lines.push("REDIS_PASSWORD=");
        break;
      case "sqlite":
        lines.push("DATABASE_URL=file:./dev.db");
        break;
    }
    lines.push("");
  }

  if (input.auth) {
    lines.push("# Authentication");
    lines.push("JWT_SECRET=your-jwt-secret-here");
    lines.push("JWT_EXPIRES_IN=7d");
    lines.push("# OAuth Providers");
    lines.push("GOOGLE_CLIENT_ID=");
    lines.push("GOOGLE_CLIENT_SECRET=");
    lines.push("GITHUB_CLIENT_ID=");
    lines.push("GITHUB_CLIENT_SECRET=");
    lines.push("NEXTAUTH_URL=http://localhost:3000");
    lines.push("NEXTAUTH_SECRET=your-nextauth-secret");
    lines.push("");
  }

  if (input.email) {
    lines.push("# Email / SMTP");
    lines.push("SMTP_HOST=smtp.example.com");
    lines.push("SMTP_PORT=587");
    lines.push("SMTP_USER=");
    lines.push("SMTP_PASSWORD=");
    lines.push("SMTP_FROM=noreply@example.com");
    lines.push("SMTP_SECURE=true");
    lines.push("");
  }

  if (input.storage) {
    lines.push("# Cloud Storage (AWS S3 / Compatible)");
    lines.push("AWS_ACCESS_KEY_ID=");
    lines.push("AWS_SECRET_ACCESS_KEY=");
    lines.push("AWS_REGION=us-east-1");
    lines.push("AWS_S3_BUCKET=my-bucket");
    lines.push("AWS_S3_ENDPOINT=");
    lines.push("");
  }

  if (input.logging) {
    lines.push("# Logging");
    lines.push("LOG_LEVEL=debug");
    lines.push("LOG_FORMAT=json");
    lines.push("SENTRY_DSN=");
    lines.push("");
  }

  return { output: lines.join("\n").trimEnd() };
}

export const envGenerator = defineTool({
  meta: {
    id: "code/env-generator",
    name: ".env Generator",
    description:
      "Free online .env file generator — create environment variable templates for Next.js, React, Node.js, Django, Rails, Laravel, and Spring instantly in your browser. No data is stored. Includes database, auth, email, storage, and logging presets.",
    category: "code",
    subgroup: "Env Files",
    tier: ToolTier.CLIENT,
    keywords: [
      "env",
      "environment",
      "generate",
      "template",
      "config",
      "dotenv",
    ],
    examples: [
      {
        title: "Next.js with PostgreSQL",
        description:
          "Generate a .env template for a Next.js app with a database",
        input: {
          framework: "nextjs",
          database: "postgresql",
          auth: true,
          email: false,
          storage: false,
          logging: false,
        },
        output:
          "# ============================================\n# Environment Configuration\n# Framework: nextjs\n# Generated template - fill in your values\n# ============================================\n\n# Application\nNODE_ENV=development\nAPP_NAME=my-app\nAPP_PORT=3000\nAPP_URL=http://localhost:3000\nAPP_SECRET=change-me-to-a-random-secret\n\n# Next.js / React\nNEXT_PUBLIC_API_URL=http://localhost:3000/api\nNEXT_PUBLIC_APP_NAME=my-app\n\n# Database\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=mydb\nDB_USER=user\nDB_PASSWORD=password\n\n# Authentication\nJWT_SECRET=your-jwt-secret-here\nJWT_EXPIRES_IN=7d\n# OAuth Providers\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\nGITHUB_CLIENT_ID=\nGITHUB_CLIENT_SECRET=\nNEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=your-nextauth-secret",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
