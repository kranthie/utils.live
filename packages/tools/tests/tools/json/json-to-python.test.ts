import { describe, it, expect } from "vitest";
import { jsonToPython } from "../../../src/tools/json/json-to-python";
import { executeTool } from "../../../src/core/executor";

describe("jsonToPython", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonToPython.meta.id).toBe("json/json-to-python");
      expect(jsonToPython.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate dataclass by default", async () => {
      const result = await executeTool(jsonToPython, {
        input: '{"name": "John", "age": 30}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("@dataclass");
        expect(output).toContain("class Root:");
        expect(output).toContain("name: str");
        expect(output).toContain("age: int");
      }
    });

    it("should generate Pydantic model", async () => {
      const result = await executeTool(
        jsonToPython,
        { input: '{"firstName": "John"}' },
        { style: "pydantic" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("class Root(BaseModel):");
        expect(output).toContain("from pydantic import BaseModel");
      }
    });

    it("should generate TypedDict", async () => {
      const result = await executeTool(
        jsonToPython,
        { input: '{"name": "John"}' },
        { style: "typeddict" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("class Root(TypedDict):");
        expect(output).toContain("from typing import TypedDict");
      }
    });

    it("should generate NamedTuple", async () => {
      const result = await executeTool(
        jsonToPython,
        { input: '{"name": "John"}' },
        { style: "namedtuple" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('NamedTuple("Root"');
      }
    });

    it("should handle null with Optional", async () => {
      const result = await executeTool(jsonToPython, {
        input: '{"value": null}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Optional");
      }
    });

    it("should handle arrays", async () => {
      const result = await executeTool(jsonToPython, {
        input: '{"items": [1, 2]}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("List[int]");
      }
    });

    it("should handle primitives", async () => {
      const result = await executeTool(jsonToPython, { input: '"hello"' });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("primitive");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonToPython, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
