import { describe, it, expect } from "vitest";
import { dockerfileLinter } from "../../../src/tools/devops/dockerfile-linter";
import { executeTool } from "../../../src/core/executor";

describe("dockerfileLinter", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(dockerfileLinter.meta.id).toBe("devops/dockerfile-linter");
      expect(dockerfileLinter.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should pass a valid Dockerfile", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nEXPOSE 3000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Errors: 0");
      }
    });

    it("should warn about :latest tag", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM node:latest\nWORKDIR /app",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Avoid using 'latest'");
      }
    });

    it("should warn about apt-get without --no-install-recommends", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM ubuntu:22.04\nRUN apt-get install curl",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("--no-install-recommends");
      }
    });

    it("should warn about sudo usage", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM ubuntu:22.04\nRUN sudo apt-get update",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Avoid using sudo");
      }
    });

    it("should warn about ADD instead of COPY", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM node:20\nADD . /app",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Use COPY instead of ADD");
      }
    });

    it("should warn about relative WORKDIR", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM node:20\nWORKDIR app",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("absolute paths");
      }
    });

    it("should suggest combining consecutive RUN", async () => {
      const result = await executeTool(dockerfileLinter, {
        input: "FROM node:20\nRUN echo a\nRUN echo b",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("combining consecutive RUN");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(dockerfileLinter, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
