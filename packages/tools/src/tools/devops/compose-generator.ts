import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  appService: z.boolean().default(true).describe("Include app service"),
  appPort: z.number().default(3000).describe("App port"),
  database: z
    .enum(["none", "postgres", "mysql", "mongodb", "mariadb"])
    .default("none")
    .describe("Database"),
  redis: z.boolean().default(false).describe("Include Redis"),
  nginx: z.boolean().default(false).describe("Include Nginx reverse proxy"),
  volumes: z.boolean().default(true).describe("Include named volumes"),
  healthchecks: z.boolean().default(true).describe("Include healthchecks"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated docker-compose.yaml"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = ["services:"];
  const volumes: string[] = [];

  if (input.appService) {
    lines.push("  app:");
    lines.push("    build: .");
    lines.push(`    ports:`);
    lines.push(`      - "${input.appPort}:${input.appPort}"`);
    lines.push("    environment:");
    lines.push("      - NODE_ENV=production");
    const depends: string[] = [];
    if (input.database !== "none") {
      lines.push(`      - DATABASE_URL=\${DATABASE_URL}`);
      depends.push("db");
    }
    if (input.redis) {
      lines.push("      - REDIS_URL=redis://redis:6379");
      depends.push("redis");
    }
    if (depends.length > 0) {
      lines.push("    depends_on:");
      for (const d of depends) {
        if (input.healthchecks) {
          lines.push(`      ${d}:`);
          lines.push(`        condition: service_healthy`);
        } else {
          lines.push(`      - ${d}`);
        }
      }
    }
    lines.push("    restart: unless-stopped");
    lines.push("");
  }

  if (input.database === "postgres") {
    lines.push("  db:");
    lines.push("    image: postgres:16-alpine");
    lines.push("    environment:");
    lines.push("      POSTGRES_USER: ${DB_USER:-postgres}");
    lines.push("      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}");
    lines.push("      POSTGRES_DB: ${DB_NAME:-mydb}");
    lines.push("    ports:");
    lines.push('      - "5432:5432"');
    if (input.volumes) {
      lines.push("    volumes:");
      lines.push("      - postgres_data:/var/lib/postgresql/data");
      volumes.push("postgres_data");
    }
    if (input.healthchecks) {
      lines.push("    healthcheck:");
      lines.push('      test: ["CMD-SHELL", "pg_isready -U postgres"]');
      lines.push("      interval: 10s");
      lines.push("      timeout: 5s");
      lines.push("      retries: 5");
    }
    lines.push("    restart: unless-stopped");
    lines.push("");
  } else if (input.database === "mysql") {
    lines.push("  db:");
    lines.push("    image: mysql:8");
    lines.push("    environment:");
    lines.push("      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}");
    lines.push("      MYSQL_DATABASE: ${DB_NAME:-mydb}");
    lines.push("      MYSQL_USER: ${DB_USER:-user}");
    lines.push("      MYSQL_PASSWORD: ${DB_PASSWORD:-password}");
    lines.push("    ports:");
    lines.push('      - "3306:3306"');
    if (input.volumes) {
      lines.push("    volumes:");
      lines.push("      - mysql_data:/var/lib/mysql");
      volumes.push("mysql_data");
    }
    if (input.healthchecks) {
      lines.push("    healthcheck:");
      lines.push(
        '      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]'
      );
      lines.push("      interval: 10s");
      lines.push("      timeout: 5s");
      lines.push("      retries: 5");
    }
    lines.push("    restart: unless-stopped");
    lines.push("");
  } else if (input.database === "mongodb") {
    lines.push("  db:");
    lines.push("    image: mongo:7");
    lines.push("    environment:");
    lines.push("      MONGO_INITDB_ROOT_USERNAME: ${DB_USER:-admin}");
    lines.push("      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD:-password}");
    lines.push("    ports:");
    lines.push('      - "27017:27017"');
    if (input.volumes) {
      lines.push("    volumes:");
      lines.push("      - mongo_data:/data/db");
      volumes.push("mongo_data");
    }
    lines.push("    restart: unless-stopped");
    lines.push("");
  } else if (input.database === "mariadb") {
    lines.push("  db:");
    lines.push("    image: mariadb:11");
    lines.push("    environment:");
    lines.push(
      "      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}"
    );
    lines.push("      MARIADB_DATABASE: ${DB_NAME:-mydb}");
    lines.push("      MARIADB_USER: ${DB_USER:-user}");
    lines.push("      MARIADB_PASSWORD: ${DB_PASSWORD:-password}");
    lines.push("    ports:");
    lines.push('      - "3306:3306"');
    if (input.volumes) {
      lines.push("    volumes:");
      lines.push("      - mariadb_data:/var/lib/mysql");
      volumes.push("mariadb_data");
    }
    if (input.healthchecks) {
      lines.push("    healthcheck:");
      lines.push(
        '      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]'
      );
      lines.push("      interval: 10s");
      lines.push("      timeout: 5s");
      lines.push("      retries: 5");
    }
    lines.push("    restart: unless-stopped");
    lines.push("");
  }

  if (input.redis) {
    lines.push("  redis:");
    lines.push("    image: redis:7-alpine");
    lines.push("    ports:");
    lines.push('      - "6379:6379"');
    if (input.volumes) {
      lines.push("    volumes:");
      lines.push("      - redis_data:/data");
      volumes.push("redis_data");
    }
    if (input.healthchecks) {
      lines.push("    healthcheck:");
      lines.push('      test: ["CMD", "redis-cli", "ping"]');
      lines.push("      interval: 10s");
      lines.push("      timeout: 5s");
      lines.push("      retries: 5");
    }
    lines.push("    restart: unless-stopped");
    lines.push("");
  }

  if (input.nginx) {
    lines.push("  nginx:");
    lines.push("    image: nginx:alpine");
    lines.push("    ports:");
    lines.push('      - "80:80"');
    lines.push("    volumes:");
    lines.push("      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro");
    lines.push("    depends_on:");
    lines.push("      - app");
    lines.push("    restart: unless-stopped");
    lines.push("");
  }

  if (volumes.length > 0) {
    lines.push("volumes:");
    for (const v of volumes) lines.push(`  ${v}:`);
  }

  return { output: lines.join("\n") };
}

export const composeGenerator = defineTool({
  meta: {
    id: "devops/compose-generator",
    name: "Docker Compose Generator",
    description:
      "Free online Docker Compose generator — build docker-compose.yaml files instantly in your browser. No data is stored. Supports PostgreSQL, MySQL, MariaDB, MongoDB, Redis, Nginx reverse proxy, healthchecks, and named volumes.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "docker",
      "compose",
      "generate",
      "yaml",
      "services",
      "container",
      "docker-compose",
      "microservices",
      "deployment",
      "postgres",
      "mysql",
      "redis",
      "nginx",
    ],
    examples: [
      {
        title: "Node.js + PostgreSQL + Redis stack",
        description:
          "Full-stack Docker Compose with a Node.js app, PostgreSQL database, Redis cache, healthchecks, and named volumes",
        input: {
          appService: true,
          appPort: 3000,
          database: "postgres",
          redis: true,
          nginx: false,
          volumes: true,
          healthchecks: true,
        },
        output:
          'services:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=${DATABASE_URL}\n      - REDIS_URL=redis://redis:6379\n    depends_on:\n      db:\n        condition: service_healthy\n      redis:\n        condition: service_healthy\n    restart: unless-stopped\n\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: ${DB_USER:-postgres}\n      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}\n      POSTGRES_DB: ${DB_NAME:-mydb}\n    ports:\n      - "5432:5432"\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n    healthcheck:\n      test: ["CMD-SHELL", "pg_isready -U postgres"]\n      interval: 10s\n      timeout: 5s\n      retries: 5\n    restart: unless-stopped\n\n  redis:\n    image: redis:7-alpine\n    ports:\n      - "6379:6379"\n    volumes:\n      - redis_data:/data\n    healthcheck:\n      test: ["CMD", "redis-cli", "ping"]\n      interval: 10s\n      timeout: 5s\n      retries: 5\n    restart: unless-stopped\n\nvolumes:\n  postgres_data:\n  redis_data:',
      },
    ],
    ui: { outputLanguage: "yaml" },
  },
  inputSchema,
  outputSchema,
  execute,
});
