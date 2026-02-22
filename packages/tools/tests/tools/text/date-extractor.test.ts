import { describe, it, expect } from "vitest";
import { dateExtractor } from "../../../src/tools/text/date-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("dateExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(dateExtractor.meta.id).toBe("text/date-extractor");
      expect(dateExtractor.meta.name).toBe("Date Extractor");
      expect(dateExtractor.meta.category).toBe("text");
      expect(dateExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(dateExtractor.meta.keywords).toContain("date");
      expect(dateExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract ISO format dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "The meeting is on 2023-12-25",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect(
          (
            (result.data as Record<string, unknown>).dates as Record<
              string,
              unknown
            >[]
          )[0]?.original
        ).toBe("2023-12-25");
        expect(
          (
            (result.data as Record<string, unknown>).dates as Record<
              string,
              unknown
            >[]
          )[0]?.format
        ).toBe("YYYY-MM-DD");
        expect(
          (
            (result.data as Record<string, unknown>).dates as Record<
              string,
              unknown
            >[]
          )[0]?.parsed
        ).toBe("2023-12-25");
      }
    });

    it("should extract US format dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "The event is on 12/25/2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
        const usDate = (
          (result.data as Record<string, unknown>).dates as unknown[]
        ).find((d: Record<string, unknown>) => d.format === "MM/DD/YYYY");
        expect(usDate).toBeDefined();
        expect(usDate?.original).toBe("12/25/2023");
      }
    });

    it("should extract European format dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "The event is on 25.12.2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
        const euDate = (
          (result.data as Record<string, unknown>).dates as unknown[]
        ).find((d: Record<string, unknown>) => d.format === "DD/MM/YYYY");
        expect(euDate).toBeDefined();
      }
    });

    it("should extract written format dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "The party is on December 25, 2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
        const writtenDate = (
          (result.data as Record<string, unknown>).dates as unknown[]
        ).find((d: Record<string, unknown>) => d.format === "Month DD, YYYY");
        expect(writtenDate).toBeDefined();
      }
    });

    it("should extract abbreviated month dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "The party is on Dec 25, 2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("should extract relative dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "Let's meet today or tomorrow",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        const formats = (
          (result.data as Record<string, unknown>).dates as unknown[]
        ).map((d: Record<string, unknown>) => d.format);
        expect(formats).toContain("relative");
      }
    });

    it("should handle yesterday", async () => {
      const result = await executeTool(dateExtractor, {
        input: "I finished the project yesterday",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect(
          (
            (
              (result.data as Record<string, unknown>).dates as Record<
                string,
                unknown
              >[]
            )[0]?.original as string
          ).toLowerCase()
        ).toBe("yesterday");
      }
    });

    it("should extract multiple dates", async () => {
      const result = await executeTool(dateExtractor, {
        input:
          "Start: 2023-01-01, End: 2023-12-31. Meeting on December 15, 2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(dateExtractor, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).dates).toEqual([]);
      }
    });

    it("should handle input with no dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "This is just regular text with no dates",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should return unique dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "The date 2023-12-25 appears twice: 2023-12-25",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should handle dates with ordinal suffixes", async () => {
      const result = await executeTool(dateExtractor, {
        input: "Meeting on December 25th, 2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("should handle dates with dashes in US format", async () => {
      const result = await executeTool(dateExtractor, {
        input: "Event on 12-25-2023",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("should parse dates to ISO format when possible", async () => {
      const result = await executeTool(dateExtractor, {
        input: "Date: 2023-06-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (
            (result.data as Record<string, unknown>).dates as Record<
              string,
              unknown
            >[]
          )[0]?.parsed
        ).toBe("2023-06-15");
      }
    });

    it("should handle case-insensitive relative dates", async () => {
      const result = await executeTool(dateExtractor, {
        input: "TODAY and TOMORROW and YESTERDAY",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });
  });
});
