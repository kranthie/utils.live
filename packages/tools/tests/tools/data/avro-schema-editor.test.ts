import { describe, it, expect } from "vitest";
import { avroSchemaFormatter } from "../../../src/tools/data/avro-schema-formatter";
import { executeTool } from "../../../src/core/executor";

describe("Avro Schema Formatter Tool", () => {
  it("should format an Avro schema", async () => {
    const schema = JSON.stringify({
      type: "record",
      name: "User",
      fields: [
        { name: "name", type: "string" },
        { name: "age", type: "int" },
      ],
    });
    const result = await executeTool(avroSchemaFormatter, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "record"
      );
      expect((result.data as Record<string, unknown>).output).toContain("User");
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(avroSchemaFormatter, { input: "not valid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(avroSchemaFormatter.meta.id).toBe("data/avro-schema-formatter");
  });
});
