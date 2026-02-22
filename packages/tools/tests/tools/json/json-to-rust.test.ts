import { describe, it, expect } from "vitest";
import { jsonToRust } from "../../../src/tools/json/json-to-rust";
import { executeTool } from "../../../src/core/executor";

describe("jsonToRust", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonToRust.meta.id).toBe("json/json-to-rust");
      expect(jsonToRust.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate Rust struct from simple JSON", async () => {
      const result = await executeTool(jsonToRust, {
        input: '{"name": "John", "age": 30, "active": true}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("pub struct Root");
        expect(output).toContain("pub name: String");
        expect(output).toContain("pub age: i64");
        expect(output).toContain("pub active: bool");
        expect(output).toContain("#[derive(Debug, Serialize, Deserialize)]");
      }
    });

    it("should include serde rename for non-snake_case keys", async () => {
      const result = await executeTool(jsonToRust, {
        input: '{"firstName": "John"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('#[serde(rename = "firstName")]');
      }
    });

    it("should use Option for null values", async () => {
      const result = await executeTool(jsonToRust, {
        input: '{"value": null}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Option<serde_json::Value>");
      }
    });

    it("should handle arrays", async () => {
      const result = await executeTool(jsonToRust, {
        input: '{"items": [1, 2, 3]}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Vec<i64>");
      }
    });

    it("should handle nested objects", async () => {
      const result = await executeTool(jsonToRust, {
        input: '{"address": {"city": "NYC"}}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("pub struct Address");
      }
    });

    it("should include serde use statement", async () => {
      const result = await executeTool(jsonToRust, {
        input: '{"x": 1}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("use serde::{Deserialize, Serialize}");
      }
    });

    it("should handle primitive JSON", async () => {
      const result = await executeTool(jsonToRust, { input: '"hello"' });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("String");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonToRust, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
