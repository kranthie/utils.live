import { describe, it, expect } from "vitest";
import { protobufEditor } from "../../../src/tools/data/protobuf-editor";
import { executeTool } from "../../../src/core/executor";

describe("Protobuf Editor Tool", () => {
  it("should format a protobuf definition", async () => {
    const proto = `syntax = "proto3";\nmessage User {\nstring name = 1;\nint32 age = 2;\n}`;
    const result = await executeTool(protobufEditor, { input: proto });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "message User"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "string name"
      );
    }
  });

  it("should handle nested messages", async () => {
    const proto = `syntax = "proto3";\nmessage Outer {\nmessage Inner {\nstring value = 1;\n}\nInner inner = 1;\n}`;
    const result = await executeTool(protobufEditor, { input: proto });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Outer"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Inner"
      );
    }
  });

  it("should handle empty input", async () => {
    const result = await executeTool(protobufEditor, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should have correct metadata", () => {
    expect(protobufEditor.meta.id).toBe("data/protobuf-editor");
  });
});
