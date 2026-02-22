import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cronValidator } from "../../../src/tools/datetime/cron-validator";

describe("Cron Validator", () => {
  it("should have correct metadata", () => {
    expect(cronValidator.meta.id).toBe("datetime/cron-validator");
    expect(cronValidator.meta.category).toBe("datetime");
  });

  it("should validate a correct cron expression", async () => {
    const result = await executeTool(cronValidator, { input: "0 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(true);
      expect((data.errors as string[])).toHaveLength(0);
    }
  });

  it("should detect invalid minute value", async () => {
    const result = await executeTool(cronValidator, { input: "60 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(false);
      expect((data.errors as string[]).length).toBeGreaterThan(0);
    }
  });

  it("should detect invalid hour value", async () => {
    const result = await executeTool(cronValidator, { input: "0 25 * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(false);
    }
  });

  it("should detect wrong number of fields", async () => {
    const result = await executeTool(cronValidator, { input: "* *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(false);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(cronValidator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should validate question mark in fields", async () => {
    const result = await executeTool(cronValidator, { input: "0 0 ? * 1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(true);
    }
  });

  it("should validate step expressions", async () => {
    const result = await executeTool(cronValidator, { input: "*/5 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(true);
    }
  });

  it("should detect invalid range (start > end)", async () => {
    const result = await executeTool(cronValidator, { input: "0 0 * * 5-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(false);
    }
  });

  it("should detect invalid step value", async () => {
    const result = await executeTool(cronValidator, { input: "*/0 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.valid).toBe(false);
    }
  });
});
