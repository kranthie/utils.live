import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  CategoryRegistry,
  getCategoryById,
  getAllCategories,
} from "../../src/categories";

describe("Categories", () => {
  describe("CATEGORIES constant", () => {
    it("should define exactly 34 categories", () => {
      expect(CATEGORIES).toHaveLength(34);
    });

    it("should have unique category IDs", () => {
      const ids = CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(CATEGORIES.length);
    });

    it("should have unique order values 1-30", () => {
      const orders = CATEGORIES.map((c) => c.order).sort((a, b) => a - b);
      expect(orders).toEqual(Array.from({ length: 34 }, (_, i) => i + 1));
    });

    it("should have valid category properties", () => {
      for (const category of CATEGORIES) {
        expect(category.id).toMatch(/^[a-z-]+$/);
        expect(category.name).toBeTruthy();
        expect(category.description).toBeTruthy();
        expect(category.icon).toBeTruthy();
        expect(category.slug).toBe(category.id);
        expect(category.order).toBeGreaterThanOrEqual(1);
        expect(category.order).toBeLessThanOrEqual(34);
      }
    });

    it("should include essential categories", () => {
      const ids = CATEGORIES.map((c) => c.id);
      expect(ids).toContain("json");
      expect(ids).toContain("encoding");
      expect(ids).toContain("text");
      expect(ids).toContain("crypto");
      expect(ids).toContain("web");
    });
  });

  describe("getCategoryById", () => {
    it("should return category by ID", () => {
      const category = getCategoryById("json");
      expect(category).toBeDefined();
      expect(category?.name).toBe("JSON Tools");
    });

    it("should return undefined for unknown ID", () => {
      expect(getCategoryById("unknown")).toBeUndefined();
    });
  });

  describe("getAllCategories", () => {
    it("should return all categories sorted by order", () => {
      const categories = getAllCategories();
      expect(categories).toHaveLength(34);

      // Verify sorted by order
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i]!.order).toBeGreaterThan(categories[i - 1]!.order);
      }
    });
  });
});

describe("CategoryRegistry", () => {
  let registry: CategoryRegistry;

  beforeEach(() => {
    registry = new CategoryRegistry();
  });

  describe("get", () => {
    it("should return category by ID", () => {
      const category = registry.get("json");
      expect(category).toBeDefined();
      expect(category?.name).toBe("JSON Tools");
    });

    it("should return undefined for unknown ID", () => {
      expect(registry.get("unknown")).toBeUndefined();
    });
  });

  describe("getAll", () => {
    it("should return all 34 categories", () => {
      const categories = registry.getAll();
      expect(categories).toHaveLength(34);
    });

    it("should return categories sorted by order", () => {
      const categories = registry.getAll();
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i]!.order).toBeGreaterThan(categories[i - 1]!.order);
      }
    });
  });

  describe("has", () => {
    it("should return true for existing category", () => {
      expect(registry.has("json")).toBe(true);
      expect(registry.has("encoding")).toBe(true);
    });

    it("should return false for unknown category", () => {
      expect(registry.has("unknown")).toBe(false);
    });
  });

  describe("getIds", () => {
    it("should return all category IDs", () => {
      const ids = registry.getIds();
      expect(ids).toHaveLength(34);
      expect(ids).toContain("json");
      expect(ids).toContain("encoding");
    });
  });
});
