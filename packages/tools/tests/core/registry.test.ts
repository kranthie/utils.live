import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { ToolRegistry } from "../../src/core/registry";
import { defineTool } from "../../src/core/define-tool";
import { ToolTier } from "../../src/types";

// Test tools for registry
const testTool1 = defineTool({
  meta: {
    id: "text/tool-one",
    name: "Test Tool One",
    description: "First test tool",
    category: "text",
    tier: ToolTier.CLIENT,
    keywords: ["test", "first", "example"],
  },
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ output: z.string() }),
  execute: (input) => ({ output: input.input }),
});

const testTool2 = defineTool({
  meta: {
    id: "text/tool-two",
    name: "Test Tool Two",
    description: "Second test tool",
    category: "text",
    tier: ToolTier.CLIENT,
    keywords: ["test", "second", "sample"],
  },
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ output: z.string() }),
  execute: (input) => ({ output: input.input }),
});

const testTool3 = defineTool({
  meta: {
    id: "encoding/base64",
    name: "Base64 Encoder",
    description: "Encode text to Base64",
    category: "encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base64", "encode", "encoding"],
  },
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ output: z.string() }),
  execute: (input) => ({ output: btoa(input.input) }),
});

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe("registerTool", () => {
    it("should register a tool successfully", () => {
      registry.registerTool(testTool1);
      expect(registry.get("text/tool-one")).toBe(testTool1);
    });

    it("should throw error for duplicate tool ID", () => {
      registry.registerTool(testTool1);
      expect(() => registry.registerTool(testTool1)).toThrow(
        "Tool with ID 'text/tool-one' is already registered"
      );
    });

    it("should register multiple tools", () => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
      registry.registerTool(testTool3);
      expect(registry.getAll()).toHaveLength(3);
    });

    it("should throw for a tool ID that does not match 'category/slug'", () => {
      // `defineTool` also validates the id, so we construct the Tool shape
      // directly to exercise the registry guard in isolation.
      const badIdTool = {
        meta: {
          id: "Bad-ID",
          name: "Bad",
          description: "Bad",
          category: "text",
          tier: ToolTier.CLIENT,
          keywords: ["bad"],
        },
        inputSchema: z.object({ input: z.string() }),
        outputSchema: z.object({ output: z.string() }),
        execute: (input: { input: string }) => ({ output: input.input }),
      } as unknown as Parameters<ToolRegistry["registerTool"]>[0];
      expect(() => registry.registerTool(badIdTool)).toThrow(/Invalid tool ID/);
    });

    it("should throw when the category portion isn't in CATEGORIES", () => {
      const orphanTool = {
        meta: {
          id: "notacategory/thing",
          name: "Orphan",
          description: "Orphan",
          category: "notacategory",
          tier: ToolTier.CLIENT,
          keywords: ["orphan"],
        },
        inputSchema: z.object({ input: z.string() }),
        outputSchema: z.object({ output: z.string() }),
        execute: (input: { input: string }) => ({ output: input.input }),
      } as unknown as Parameters<ToolRegistry["registerTool"]>[0];
      expect(() => registry.registerTool(orphanTool)).toThrow(
        /Invalid category 'notacategory'/
      );
    });
  });

  describe("getByCategory validation", () => {
    it("should throw for a category id with invalid characters", () => {
      expect(() => registry.getByCategory("BAD!")).toThrow(
        /Invalid category ID/
      );
    });
  });

  describe("get", () => {
    beforeEach(() => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
    });

    it("should return tool by ID", () => {
      expect(registry.get("text/tool-one")).toBe(testTool1);
      expect(registry.get("text/tool-two")).toBe(testTool2);
    });

    it("should return undefined for unknown ID", () => {
      expect(registry.get("unknown/tool")).toBeUndefined();
    });
  });

  describe("getAll", () => {
    it("should return empty array when no tools registered", () => {
      expect(registry.getAll()).toEqual([]);
    });

    it("should return all registered tools", () => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
      const tools = registry.getAll();
      expect(tools).toHaveLength(2);
      expect(tools).toContain(testTool1);
      expect(tools).toContain(testTool2);
    });
  });

  describe("getByCategory", () => {
    beforeEach(() => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
      registry.registerTool(testTool3);
    });

    it("should return tools for a category", () => {
      const textTools = registry.getByCategory("text");
      expect(textTools).toHaveLength(2);
      expect(textTools).toContain(testTool1);
      expect(textTools).toContain(testTool2);
    });

    it("should return empty array for unknown category", () => {
      expect(registry.getByCategory("unknown")).toEqual([]);
    });

    it("should return single tool for category with one tool", () => {
      const encodingTools = registry.getByCategory("encoding");
      expect(encodingTools).toHaveLength(1);
      expect(encodingTools[0]).toBe(testTool3);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
      registry.registerTool(testTool3);
    });

    it("should find tools by keyword", () => {
      const results = registry.search("base64");
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(testTool3);
    });

    it("should find tools by partial name match", () => {
      const results = registry.search("Test Tool");
      expect(results).toHaveLength(2);
    });

    it("should find tools by description match", () => {
      const results = registry.search("Encode");
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(testTool3);
    });

    it("should match description but not name or keywords", () => {
      // "Second test tool" is only in description
      const results = registry.search("Second test tool");
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(testTool2);
    });

    it("should not duplicate results when matching multiple fields", () => {
      // "test" matches name, description, and keywords
      const results = registry.search("test");
      // Should only include each tool once
      const uniqueIds = new Set(results.map((t) => t.meta.id));
      expect(uniqueIds.size).toBe(results.length);
    });

    it("should be case insensitive", () => {
      const results = registry.search("BASE64");
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(testTool3);
    });

    it("should return empty array when no matches", () => {
      const results = registry.search("xyz123nonexistent");
      expect(results).toEqual([]);
    });

    it("should find tools matching multiple keywords", () => {
      const results = registry.search("test");
      expect(results).toHaveLength(2);
    });

    it("should match partial keywords", () => {
      const results = registry.search("encod");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should match keyword that is not in name or description", () => {
      // "example" is only in testTool1's keywords, not in name or description
      const results = registry.search("example");
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(testTool1);
    });

    it("should not match when query is not in name, description, or keywords", () => {
      // A completely non-matching query
      const results = registry.search("zzzznotfound");
      expect(results).toHaveLength(0);
    });
  });

  describe("getCategories", () => {
    beforeEach(() => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
      registry.registerTool(testTool3);
    });

    it("should return unique categories with tool counts", () => {
      const categories = registry.getCategories();
      expect(categories).toHaveLength(2);

      const textCategory = categories.find((c) => c.id === "text");
      expect(textCategory).toBeDefined();
      expect(textCategory?.count).toBe(2);

      const encodingCategory = categories.find((c) => c.id === "encoding");
      expect(encodingCategory).toBeDefined();
      expect(encodingCategory?.count).toBe(1);
    });
  });

  describe("size", () => {
    it("should return 0 when registry is empty", () => {
      expect(registry.size).toBe(0);
    });

    it("should return correct count of registered tools", () => {
      registry.registerTool(testTool1);
      expect(registry.size).toBe(1);

      registry.registerTool(testTool2);
      expect(registry.size).toBe(2);

      registry.registerTool(testTool3);
      expect(registry.size).toBe(3);
    });
  });

  describe("has", () => {
    it("should return false for unregistered tool", () => {
      expect(registry.has("text/unknown-tool")).toBe(false);
    });

    it("should return true for registered tool", () => {
      registry.registerTool(testTool1);
      expect(registry.has("text/tool-one")).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all registered tools", () => {
      registry.registerTool(testTool1);
      registry.registerTool(testTool2);
      registry.registerTool(testTool3);

      expect(registry.size).toBe(3);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getAll()).toEqual([]);
    });

    it("should allow re-registration after clear", () => {
      registry.registerTool(testTool1);
      registry.clear();

      // Should be able to register again without error
      registry.registerTool(testTool1);
      expect(registry.size).toBe(1);
    });
  });
});
