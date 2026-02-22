import { describe, it, expect } from "vitest";
import { asciiTable } from "../../../src/tools/encoding/ascii-table";
import { executeTool } from "../../../src/core/executor";

describe("asciiTable", () => {
  it("should have correct metadata", () => {
    expect(asciiTable.meta.id).toBe("encoding/ascii-table");
  });

  it("should generate printable ASCII table", async () => {
    const result = await executeTool(asciiTable, {
      range: "printable",
      format: "table",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Dec");
      expect(output).toContain("Hex");
      expect(output).toContain("Space");
    }
  });

  it("should generate compact format", async () => {
    const result = await executeTool(asciiTable, {
      range: "printable",
      format: "compact",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Dec");
      expect(output).toContain("0x20");
    }
  });

  it("should show control characters", async () => {
    const result = await executeTool(asciiTable, {
      range: "control",
      format: "table",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("NUL");
      expect(output).toContain("TAB");
      expect(output).toContain("LF");
    }
  });

  it("should generate full table", async () => {
    const result = await executeTool(asciiTable, {
      range: "full",
      format: "compact",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("DEL");
    }
  });
});
