import { describe, it, expect } from "vitest";
import { dockerfileGenerator } from "../../../src/tools/devops/dockerfile-generator";
import { executeTool } from "../../../src/core/executor";

describe("dockerfileGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(dockerfileGenerator.meta.id).toBe("devops/dockerfile-generator");
      expect(dockerfileGenerator.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should generate Node.js multi-stage Dockerfile", async () => {
      const result = await executeTool(dockerfileGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("FROM node:20-alpine AS builder");
        expect(output).toContain("FROM node:20-alpine AS runner");
        expect(output).toContain("EXPOSE 3000");
        expect(output).toContain("USER appuser");
      }
    });

    it("should generate Node.js with pnpm", async () => {
      const result = await executeTool(dockerfileGenerator, {
        packageManager: "pnpm",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("corepack enable");
        expect(output).toContain("pnpm install");
      }
    });

    it("should generate Python Dockerfile", async () => {
      const result = await executeTool(dockerfileGenerator, {
        runtime: "python",
        version: "3.12",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("FROM python:3.12-alpine");
        expect(output).toContain("requirements.txt");
      }
    });

    it("should generate Go Dockerfile with scratch", async () => {
      const result = await executeTool(dockerfileGenerator, {
        runtime: "go",
        version: "1.22",
        multiStage: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("FROM golang:1.22-alpine");
        expect(output).toContain("FROM scratch");
        expect(output).toContain("CGO_ENABLED=0");
      }
    });

    it("should use non-alpine when alpine is false", async () => {
      const result = await executeTool(dockerfileGenerator, { alpine: false });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("-slim");
        expect(output).not.toContain("-alpine");
      }
    });

    it("should generate single-stage when multiStage is false", async () => {
      const result = await executeTool(dockerfileGenerator, {
        multiStage: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).not.toContain("AS builder");
      }
    });

    it("should use custom port", async () => {
      const result = await executeTool(dockerfileGenerator, { port: 8080 });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("EXPOSE 8080");
      }
    });

    it("should generate generic Dockerfile for unsupported runtimes", async () => {
      const result = await executeTool(dockerfileGenerator, {
        runtime: "ruby",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("ruby Dockerfile");
      }
    });

    it("multi-stage pnpm build uses pnpm build, not npm run build", async () => {
      const result = await executeTool(dockerfileGenerator, {
        packageManager: "pnpm",
        multiStage: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("pnpm build");
        expect(output).not.toContain("npm run build");
      }
    });

    it("multi-stage yarn build uses yarn build, not npm run build", async () => {
      const result = await executeTool(dockerfileGenerator, {
        packageManager: "yarn",
        multiStage: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("yarn build");
        expect(output).not.toContain("npm run build");
      }
    });

    it("example output matches execute() result", async () => {
      const example = dockerfileGenerator.meta.examples![0]!;
      const result = await executeTool(
        dockerfileGenerator,
        example.input as Record<string, unknown>
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.output).toBe(example.output);
      }
    });
  });
});
