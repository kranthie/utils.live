import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { excelDateConverter } from "../../../src/tools/datetime/excel-date-converter";

describe("Excel Date Converter", () => {
  it("should have correct metadata", () => {
    expect(excelDateConverter.meta.id).toBe("datetime/excel-date-converter");
    expect(excelDateConverter.meta.category).toBe("datetime");
  });

  it("should convert Excel serial to date", async () => {
    const result = await executeTool(excelDateConverter, { input: "45292" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.excelSerial).toBe("number");
      expect(typeof data.iso).toBe("string");
    }
  });

  it("should convert date string to Excel serial", async () => {
    const result = await executeTool(excelDateConverter, {
      input: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.excelSerial).toBe("number");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(excelDateConverter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(excelDateConverter, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should handle Excel serial number 1", async () => {
    const result = await executeTool(excelDateConverter, { input: "1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.excelSerial).toBe(1);
    }
  });
});
