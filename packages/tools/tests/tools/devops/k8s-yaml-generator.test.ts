import { describe, it, expect } from "vitest";
import { k8sYamlGenerator } from "../../../src/tools/devops/k8s-yaml-generator";
import { executeTool } from "../../../src/core/executor";

describe("k8sYamlGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(k8sYamlGenerator.meta.id).toBe("devops/k8s-yaml-generator");
      expect(k8sYamlGenerator.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should generate Deployment by default", async () => {
      const result = await executeTool(k8sYamlGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("kind: Deployment");
        expect(output).toContain("apiVersion: apps/v1");
        expect(output).toContain("replicas: 3");
      }
    });

    it("should generate Service", async () => {
      const result = await executeTool(k8sYamlGenerator, { kind: "Service" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("kind: Service");
        expect(output).toContain("type: ClusterIP");
      }
    });

    it("should generate ConfigMap", async () => {
      const result = await executeTool(k8sYamlGenerator, { kind: "ConfigMap" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("kind: ConfigMap");
        expect(output).toContain("data:");
      }
    });

    it("should generate Ingress", async () => {
      const result = await executeTool(k8sYamlGenerator, { kind: "Ingress" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("kind: Ingress");
        expect(output).toContain("networking.k8s.io/v1");
      }
    });

    it("should include resource limits when enabled", async () => {
      const result = await executeTool(k8sYamlGenerator, { resources: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("resources:");
        expect(output).toContain("cpu: 100m");
        expect(output).toContain("memory: 128Mi");
      }
    });

    it("should include health probes when enabled", async () => {
      const result = await executeTool(k8sYamlGenerator, { probes: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("livenessProbe:");
        expect(output).toContain("readinessProbe:");
      }
    });

    it("should use custom name and namespace", async () => {
      const result = await executeTool(k8sYamlGenerator, {
        name: "api-server",
        namespace: "production",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("name: api-server");
        expect(output).toContain("namespace: production");
      }
    });
  });
});
