import { describe, it, expect } from "vitest";
import { helmValuesGenerator } from "../../../src/tools/devops/helm-values-generator";
import { executeTool } from "../../../src/core/executor";

describe("helmValuesGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(helmValuesGenerator.meta.id).toBe("devops/helm-values-generator");
      expect(helmValuesGenerator.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should generate default values.yaml", async () => {
      const result = await executeTool(helmValuesGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("replicaCount: 3");
        expect(output).toContain("repository: nginx");
        expect(output).toContain("tag: 1.25");
        expect(output).toContain("port: 80");
      }
    });

    it("should include ingress by default", async () => {
      const result = await executeTool(helmValuesGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("ingress:");
        expect(output).toContain("enabled: true");
      }
    });

    it("should include autoscaling when enabled", async () => {
      const result = await executeTool(helmValuesGenerator, { autoscaling: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("autoscaling:");
        expect(output).toContain("targetCPUUtilizationPercentage: 80");
      }
    });

    it("should include persistence when enabled", async () => {
      const result = await executeTool(helmValuesGenerator, { persistence: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("persistence:");
        expect(output).toContain("size: 10Gi");
      }
    });

    it("should use custom app name and image", async () => {
      const result = await executeTool(helmValuesGenerator, {
        appName: "my-service",
        image: "myregistry/myimage",
        tag: "v2.0",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("my-service");
        expect(output).toContain("repository: myregistry/myimage");
        expect(output).toContain("tag: v2.0");
      }
    });
  });
});
