import { describe, it, expect } from "vitest";
import { composeGenerator } from "../../../src/tools/devops/compose-generator";
import { executeTool } from "../../../src/core/executor";

describe("composeGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(composeGenerator.meta.id).toBe("devops/compose-generator");
      expect(composeGenerator.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should generate basic compose with app service", async () => {
      const result = await executeTool(composeGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("services:");
        expect(output).toContain("app:");
        expect(output).toContain("build: .");
      }
    });

    it("should include postgres database", async () => {
      const result = await executeTool(composeGenerator, {
        database: "postgres",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("postgres:16-alpine");
        expect(output).toContain("POSTGRES_USER");
        expect(output).toContain("5432:5432");
      }
    });

    it("should include mysql database", async () => {
      const result = await executeTool(composeGenerator, { database: "mysql" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("mysql:8");
        expect(output).toContain("MYSQL_DATABASE");
      }
    });

    it("should include mongodb database", async () => {
      const result = await executeTool(composeGenerator, {
        database: "mongodb",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("mongo:7");
      }
    });

    it("should include mariadb database", async () => {
      const result = await executeTool(composeGenerator, {
        database: "mariadb",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("mariadb:11");
        expect(output).toContain("MARIADB_DATABASE");
        expect(output).toContain("3306:3306");
      }
    });

    it("should include redis", async () => {
      const result = await executeTool(composeGenerator, { redis: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("redis:7-alpine");
        expect(output).toContain("6379:6379");
      }
    });

    it("should include nginx", async () => {
      const result = await executeTool(composeGenerator, { nginx: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("nginx:alpine");
        expect(output).toContain("80:80");
      }
    });

    it("should include healthchecks", async () => {
      const result = await executeTool(composeGenerator, {
        database: "postgres",
        healthchecks: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("healthcheck:");
        expect(output).toContain("pg_isready");
      }
    });

    it("should include volumes", async () => {
      const result = await executeTool(composeGenerator, {
        database: "postgres",
        volumes: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("volumes:");
        expect(output).toContain("postgres_data:");
      }
    });
  });
});
