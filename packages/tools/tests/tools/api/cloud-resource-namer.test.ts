import { describe, it, expect } from "vitest";
import { cloudResourceNamer } from "../../../src/tools/api/cloud-resource-namer";
import { executeTool } from "../../../src/core/executor";

describe("cloudResourceNamer", () => {
  it("should have correct metadata", () => {
    expect(cloudResourceNamer.meta.id).toBe("api/cloud-resource-namer");
    expect(cloudResourceNamer.meta.category).toBe("api");
  });

  it("should generate AWS names", async () => {
    const result = await executeTool(cloudResourceNamer, {
      provider: "aws",
      project: "myapp",
      environment: "prod",
      resourceType: "bucket",
      region: "us-east-1",
      suffix: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("myapp");
      expect(output).toContain("prod");
      expect(output).toContain("bucket");
      expect(output).toContain("aws");
    }
  });

  it("should generate GCP names", async () => {
    const result = await executeTool(cloudResourceNamer, {
      provider: "gcp",
      project: "myapp",
      environment: "dev",
      resourceType: "vm",
      region: "us-central1",
      suffix: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("gcp");
      expect(output).toContain("myapp-dev-vm");
    }
  });

  it("should generate Azure names with resource group", async () => {
    const result = await executeTool(cloudResourceNamer, {
      provider: "azure",
      project: "myapp",
      environment: "staging",
      resourceType: "database",
      region: "eastus",
      suffix: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("azure");
      expect(output).toContain("rg-myapp-staging");
    }
  });

  it("should append suffix when provided", async () => {
    const result = await executeTool(cloudResourceNamer, {
      provider: "aws",
      project: "myapp",
      environment: "dev",
      resourceType: "bucket",
      region: "us-east-1",
      suffix: "v2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("-v2");
    }
  });

  it("should use generic provider fallback", async () => {
    const result = await executeTool(cloudResourceNamer, {
      provider: "generic",
      project: "myapp",
      environment: "test",
      resourceType: "queue",
      region: "us-east-1",
      suffix: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("myapp-test-queue");
    }
  });

  it("should sanitize project name", async () => {
    const result = await executeTool(cloudResourceNamer, {
      provider: "aws",
      project: "My App!",
      environment: "dev",
      resourceType: "bucket",
      region: "us-east-1",
      suffix: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("myapp");
      expect(output).not.toContain("!");
    }
  });
});
