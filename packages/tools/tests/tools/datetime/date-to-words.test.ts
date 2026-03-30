import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateToWords } from "../../../src/tools/datetime/date-to-words";

describe("Date to Words", () => {
  it("should have correct metadata", () => {
    expect(dateToWords.meta.id).toBe("datetime/date-to-words");
    expect(dateToWords.meta.category).toBe("datetime");
  });

  it("should convert a date to words", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-01-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("January");
      expect(data.output as string).toContain("fifteenth");
    }
  });

  it("should handle ordinals correctly for various days", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-03-02T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("second");
      expect(data.output as string).toContain("March");
    }
  });

  it("should handle third day ordinal", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-05-03T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("third");
    }
  });

  it("should handle fifth day ordinal", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-01-05T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("fifth");
    }
  });

  it("should handle eighth day ordinal", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-01-08T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("eighth");
    }
  });

  it("should handle ninth day ordinal", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-01-09T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("ninth");
    }
  });

  it("should handle twelfth day ordinal", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-01-12T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("twelfth");
    }
  });

  it("should handle twentieth day ordinal", async () => {
    const result = await executeTool(dateToWords, {
      input: "2024-01-20T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("twentieth");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(dateToWords, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(dateToWords, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should handle unix timestamp", async () => {
    const result = await executeTool(dateToWords, { input: "1704067200" });
    expect(result.success).toBe(true);
  });

  it("date-to-words should be timezone-invariant: 2025-07-04 must be Friday the fourth", async () => {
    // Regression: getDay()/getDate()/getMonth()/getFullYear() used local time.
    // "2025-07-04" is UTC midnight; in PDT (UTC-7) it is Jul 3 (Thursday)
    // giving the wrong output "Thursday, the third of July".
    // July 4, 2025 UTC is a Friday.
    const result = await executeTool(dateToWords, { input: "2025-07-04" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("Friday");
      expect(data.output as string).toContain("fourth");
      expect(data.output as string).toContain("July");
    }
  });
});
