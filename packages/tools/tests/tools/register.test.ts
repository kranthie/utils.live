import { describe, it, expect } from "vitest";
import { getToolCount } from "../../src/tools/register";
import { getAllTools } from "../../src/core/registry";
import { CATEGORIES } from "../../src/categories/categories";

describe("register", () => {
  describe("getToolCount", () => {
    it("should return the count of available tools", () => {
      const count = getToolCount();
      // We have many tools registered across all categories
      expect(count).toBeGreaterThanOrEqual(90);
    });
  });

  describe("registered tool invariants", () => {
    const tools = getAllTools();
    const categoryIds = new Set(CATEGORIES.map((c) => c.id));

    it("every registered tool's id prefix matches its meta.category and a known CATEGORIES entry", () => {
      for (const tool of tools) {
        const prefix = tool.meta.id.split("/")[0];
        expect(prefix).toBe(tool.meta.category);
        expect(categoryIds.has(tool.meta.category)).toBe(true);
      }
    });

    it("every tool id is unique across the registry", () => {
      const ids = tools.map((t) => t.meta.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every CATEGORIES entry has at least one registered tool", () => {
      const populated = new Set(tools.map((t) => t.meta.category));
      const empty = CATEGORIES.filter((c) => !populated.has(c.id)).map(
        (c) => c.id
      );
      expect(empty).toEqual([]);
    });
  });
});
