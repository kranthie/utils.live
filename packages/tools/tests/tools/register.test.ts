import { describe, it, expect } from "vitest";
import { getToolCount } from "../../src/tools/register";

describe("register", () => {
  describe("getToolCount", () => {
    it("should return the count of available tools", () => {
      const count = getToolCount();
      // We have many tools registered across all categories
      expect(count).toBeGreaterThanOrEqual(90);
    });
  });
});
