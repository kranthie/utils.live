import { describe, it, expect } from "vitest";
import { envGenerator } from "../../../src/tools/code/env-generator";
import { executeTool } from "../../../src/core/executor";

describe("envGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(envGenerator.meta.id).toBe("code/env-generator");
      expect(envGenerator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should generate basic env template", async () => {
      const result = await executeTool(envGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("NODE_ENV=development");
        expect(output).toContain("APP_NAME=my-app");
        expect(output).toContain("APP_PORT=3000");
      }
    });

    it("should include Next.js vars for nextjs framework", async () => {
      const result = await executeTool(envGenerator, { framework: "nextjs" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("NEXT_PUBLIC_API_URL");
        expect(output).toContain("NEXT_PUBLIC_APP_NAME");
      }
    });

    it("should include PostgreSQL vars", async () => {
      const result = await executeTool(envGenerator, { database: "postgresql" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("DATABASE_URL=postgresql://");
        expect(output).toContain("DB_PORT=5432");
      }
    });

    it("should include MySQL vars", async () => {
      const result = await executeTool(envGenerator, { database: "mysql" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("DATABASE_URL=mysql://");
        expect(output).toContain("DB_PORT=3306");
      }
    });

    it("should include MongoDB vars", async () => {
      const result = await executeTool(envGenerator, { database: "mongodb" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("MONGODB_URI=mongodb://");
      }
    });

    it("should include Redis vars", async () => {
      const result = await executeTool(envGenerator, { database: "redis" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("REDIS_URL=redis://");
      }
    });

    it("should include SQLite vars", async () => {
      const result = await executeTool(envGenerator, { database: "sqlite" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("DATABASE_URL=file:");
      }
    });

    it("should include auth vars", async () => {
      const result = await executeTool(envGenerator, { auth: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("JWT_SECRET");
        expect(output).toContain("GOOGLE_CLIENT_ID");
        expect(output).toContain("NEXTAUTH_SECRET");
      }
    });

    it("should include email vars", async () => {
      const result = await executeTool(envGenerator, { email: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("SMTP_HOST");
        expect(output).toContain("SMTP_PORT=587");
      }
    });

    it("should include storage vars", async () => {
      const result = await executeTool(envGenerator, { storage: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("AWS_ACCESS_KEY_ID");
        expect(output).toContain("AWS_S3_BUCKET");
      }
    });

    it("should include logging vars", async () => {
      const result = await executeTool(envGenerator, { logging: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("LOG_LEVEL=debug");
        expect(output).toContain("SENTRY_DSN");
      }
    });
  });
});
