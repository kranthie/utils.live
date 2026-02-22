import { describe, it, expect } from "vitest";
import { containerImageParser } from "../../../src/tools/devops/container-image-parser";
import { executeTool } from "../../../src/core/executor";

describe("containerImageParser", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(containerImageParser.meta.id).toBe(
        "devops/container-image-parser"
      );
      expect(containerImageParser.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should parse simple image name", async () => {
      const result = await executeTool(containerImageParser, {
        input: "nginx",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.name).toBe("nginx");
        expect(parsed.tag).toBe("latest");
        expect(parsed.registry).toBe("docker.io");
      }
    });

    it("should parse image with tag", async () => {
      const result = await executeTool(containerImageParser, {
        input: "nginx:1.25-alpine",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.name).toBe("nginx");
        expect(parsed.tag).toBe("1.25-alpine");
      }
    });

    it("should parse image with namespace", async () => {
      const result = await executeTool(containerImageParser, {
        input: "myuser/myapp:v1",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.namespace).toBe("myuser");
        expect(parsed.name).toBe("myapp");
        expect(parsed.tag).toBe("v1");
      }
    });

    it("should parse image with custom registry", async () => {
      const result = await executeTool(containerImageParser, {
        input: "ghcr.io/owner/repo:latest",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.registry).toBe("ghcr.io");
        expect(parsed.name).toBe("repo");
      }
    });

    it("should parse image with digest", async () => {
      const result = await executeTool(containerImageParser, {
        input: "nginx:1.25@sha256:abcdef",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.tag).toBe("1.25");
        expect(parsed.digest).toBe("sha256:abcdef");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(containerImageParser, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
