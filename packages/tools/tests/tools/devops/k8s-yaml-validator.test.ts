import { describe, it, expect } from "vitest";
import { k8sYamlValidator } from "../../../src/tools/devops/k8s-yaml-validator";
import { executeTool } from "../../../src/core/executor";

describe("k8sYamlValidator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(k8sYamlValidator.meta.id).toBe("devops/k8s-yaml-validator");
      expect(k8sYamlValidator.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should validate a correct manifest", async () => {
      const result = await executeTool(k8sYamlValidator, {
        input: "apiVersion: v1\nkind: Service\nmetadata:\n  name: my-app\n  namespace: default\n  labels:\n    app: my-app",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Manifest structure is valid!");
      }
    });

    it("should detect missing apiVersion", async () => {
      const result = await executeTool(k8sYamlValidator, {
        input: "kind: Service\nmetadata:\n  name: test",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing 'apiVersion'");
      }
    });

    it("should detect missing kind", async () => {
      const result = await executeTool(k8sYamlValidator, {
        input: "apiVersion: v1\nmetadata:\n  name: test",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing 'kind'");
      }
    });

    it("should warn about :latest image tag", async () => {
      const result = await executeTool(k8sYamlValidator, {
        input: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: test\n  labels:\n    app: test\nspec:\n  containers:\n    - image: nginx:latest",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Avoid using ':latest'");
      }
    });

    it("should warn about privileged mode", async () => {
      const result = await executeTool(k8sYamlValidator, {
        input: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: test\nspec:\n  privileged: true",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("privileged mode");
      }
    });

    it("should warn about missing labels", async () => {
      const result = await executeTool(k8sYamlValidator, {
        input: "apiVersion: v1\nkind: Service\nmetadata:\n  name: test",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("No labels defined");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(k8sYamlValidator, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
