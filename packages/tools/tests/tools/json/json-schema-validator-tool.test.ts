import { describe, it, expect } from "vitest";
import { jsonSchemaValidatorTool } from "../../../src/tools/json/json-schema-validator-tool";
import { executeTool } from "../../../src/core/executor";

describe("jsonSchemaValidatorTool", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonSchemaValidatorTool.meta.id).toBe("json/json-schema-validator-tool");
      expect(jsonSchemaValidatorTool.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should validate valid data", async () => {
      const data = '{"name": "John", "age": 30}';
      const schema = JSON.stringify({
        type: "object",
        properties: { name: { type: "string" }, age: { type: "integer" } },
        required: ["name"],
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.original).toContain("VALID");
      }
    });

    it("should detect type mismatch", async () => {
      const data = '{"name": 123}';
      const schema = JSON.stringify({
        type: "object",
        properties: { name: { type: "string" } },
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const resData = result.data as Record<string, unknown>;
        expect(resData.original).toContain("INVALID");
        expect(resData.original).toContain('expected type "string"');
      }
    });

    it("should detect missing required property", async () => {
      const data = '{"age": 30}';
      const schema = JSON.stringify({
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const resData = result.data as Record<string, unknown>;
        expect(resData.original).toContain("missing required property");
      }
    });

    it("should validate string constraints", async () => {
      const data = '{"name": "ab"}';
      const schema = JSON.stringify({
        type: "object",
        properties: { name: { type: "string", minLength: 3 } },
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const resData = result.data as Record<string, unknown>;
        expect(resData.original).toContain("less than minimum");
      }
    });

    it("should validate number constraints", async () => {
      const data = '{"age": 200}';
      const schema = JSON.stringify({
        type: "object",
        properties: { age: { type: "integer", maximum: 150 } },
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const resData = result.data as Record<string, unknown>;
        expect(resData.original).toContain("exceeds maximum");
      }
    });

    it("should validate array constraints", async () => {
      const data = '{"items": [1, 2]}';
      const schema = JSON.stringify({
        type: "object",
        properties: { items: { type: "array", minItems: 3 } },
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const resData = result.data as Record<string, unknown>;
        expect(resData.original).toContain("minimum is 3");
      }
    });

    it("should validate enum values", async () => {
      const data = '{"status": "unknown"}';
      const schema = JSON.stringify({
        type: "object",
        properties: { status: { enum: ["active", "inactive"] } },
      });
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: data,
        input2: schema,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const resData = result.data as Record<string, unknown>;
        expect(resData.original).toContain("must be one of");
      }
    });

    it("should reject empty data", async () => {
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: "",
        input2: '{"type": "object"}',
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid JSON data", async () => {
      const result = await executeTool(jsonSchemaValidatorTool, {
        input1: "bad",
        input2: '{"type": "object"}',
      });
      expect(result.success).toBe(false);
    });
  });
});
