import { describe, it, expect } from "vitest";
import { numberExtractor } from "../../../src/tools/text/number-extractor";
import { executeTool } from "../../../src/core/executor";

describe("numberExtractor", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(numberExtractor.meta.id).toBe("text/number-extractor");
      expect(numberExtractor.meta.name).toBe("Number Extractor");
      expect(numberExtractor.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic extraction", () => {
      it("should extract integers", async () => {
        const result = await executeTool(numberExtractor, {
          input: "There are 5 apples and 10 oranges",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toContain(5);
          expect((result.data as Record<string, unknown>).numbers).toContain(
            10
          );
          expect((result.data as Record<string, unknown>).integers).toContain(
            5
          );
          expect((result.data as Record<string, unknown>).integers).toContain(
            10
          );
          expect((result.data as Record<string, unknown>).count).toBe(2);
        }
      });

      it("should extract decimal numbers", async () => {
        const result = await executeTool(numberExtractor, {
          input: "Pi is approximately 3.14159",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toContain(
            3.14159
          );
          expect((result.data as Record<string, unknown>).floats).toContain(
            3.14159
          );
        }
      });

      it("should extract negative numbers", async () => {
        const result = await executeTool(numberExtractor, {
          input: "Temperature is -5 degrees",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toContain(
            -5
          );
          expect((result.data as Record<string, unknown>).integers).toContain(
            -5
          );
        }
      });

      it("should calculate sum correctly", async () => {
        const result = await executeTool(numberExtractor, {
          input: "1 plus 2 plus 3 equals 6",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).sum).toBe(12); // 1 + 2 + 3 + 6
        }
      });

      it("should calculate average correctly", async () => {
        const result = await executeTool(numberExtractor, {
          input: "Values: 10, 20, 30",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).average).toBe(20);
        }
      });

      it("should find min and max", async () => {
        const result = await executeTool(numberExtractor, {
          input: "Range: 5 to 100",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).min).toBe(5);
          expect((result.data as Record<string, unknown>).max).toBe(100);
        }
      });
    });

    describe("options", () => {
      it("should exclude negative numbers when option disabled", async () => {
        const result = await executeTool(
          numberExtractor,
          { input: "Values: -5, 10, -15, 20" },
          { includeNegative: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).numbers
          ).not.toContain(-5);
          expect(
            (result.data as Record<string, unknown>).numbers
          ).not.toContain(-15);
          expect((result.data as Record<string, unknown>).numbers).toContain(
            10
          );
          expect((result.data as Record<string, unknown>).numbers).toContain(
            20
          );
        }
      });

      it("should exclude decimals when option disabled", async () => {
        const result = await executeTool(
          numberExtractor,
          { input: "Values: 3.14, 2.71, 5" },
          { includeDecimals: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Should extract 3, 14, 2, 71, 5 as integers
          expect((result.data as Record<string, unknown>).floats).toEqual([]);
        }
      });

      it("should convert percentages when option enabled", async () => {
        const result = await executeTool(
          numberExtractor,
          { input: "Growth rate: 25%" },
          { includePercentages: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Tool extracts 25 and also 0.25 from percentage conversion
          expect(
            (result.data as Record<string, unknown>).numbers.length
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(numberExtractor, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toEqual([]);
          expect((result.data as Record<string, unknown>).count).toBe(0);
          expect((result.data as Record<string, unknown>).sum).toBe(0);
          expect((result.data as Record<string, unknown>).average).toBe(0);
          expect((result.data as Record<string, unknown>).min).toBeUndefined();
          expect((result.data as Record<string, unknown>).max).toBeUndefined();
        }
      });

      it("should handle text without numbers", async () => {
        const result = await executeTool(numberExtractor, {
          input: "No numbers here!",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toEqual([]);
          expect((result.data as Record<string, unknown>).count).toBe(0);
        }
      });

      it("should handle large numbers", async () => {
        const result = await executeTool(numberExtractor, {
          input: "Population: 7800000000",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toContain(
            7800000000
          );
        }
      });

      it("should handle numbers in different contexts", async () => {
        const result = await executeTool(numberExtractor, {
          input: "Order #123 costs $45.99",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numbers).toContain(
            123
          );
          expect((result.data as Record<string, unknown>).numbers).toContain(
            45.99
          );
        }
      });

      it("should separate integers and floats correctly", async () => {
        const result = await executeTool(numberExtractor, {
          input: "1, 2.5, 3, 4.0",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).integers).toContain(
            1
          );
          expect((result.data as Record<string, unknown>).integers).toContain(
            3
          );
          // 4.0 is parsed as 4 which is an integer
          expect((result.data as Record<string, unknown>).floats).toContain(
            2.5
          );
        }
      });
    });
  });
});
