import { describe, it, expect } from "vitest";
import {
  searchTools,
  groupResultsByCategory,
  getSearchSuggestions,
  highlightMatch,
} from "@/lib/tool-search";

const SAMPLE_TOOLS = [
  {
    id: "json/formatter",
    name: "JSON Formatter",
    description: "Format and prettify JSON with configurable indentation",
    category: "json",
    keywords: ["json", "format", "prettify", "indent"],
    icon: "{ }",
  },
  {
    id: "json/validator",
    name: "JSON Validator",
    description: "Validate JSON syntax and get detailed error information",
    category: "json",
    keywords: ["json", "validate", "check", "syntax"],
    icon: "{ }",
  },
  {
    id: "yaml/formatter",
    name: "YAML Formatter",
    description: "Format and prettify YAML files",
    category: "yaml",
    keywords: ["yaml", "format", "prettify"],
    icon: "Y",
  },
  {
    id: "text/word-counter",
    name: "Word Counter",
    description: "Count words, characters, sentences, and paragraphs",
    category: "text",
    keywords: ["word", "count", "character", "length"],
    icon: "T",
  },
];

describe("searchTools", () => {
  it("should return matching tools by name", () => {
    const results = searchTools(SAMPLE_TOOLS, "JSON Formatter");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.tool.id).toBe("json/formatter");
  });

  it("should return matching tools by keyword", () => {
    const results = searchTools(SAMPLE_TOOLS, "prettify");
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => r.tool.id);
    expect(ids).toContain("json/formatter");
  });

  it("should return matching tools by description", () => {
    const results = searchTools(SAMPLE_TOOLS, "indentation");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return all tools when query is empty", () => {
    const results = searchTools(SAMPLE_TOOLS, "");
    expect(results.length).toBe(SAMPLE_TOOLS.length);
  });

  it("should respect limit option", () => {
    const results = searchTools(SAMPLE_TOOLS, "", { limit: 2 });
    expect(results.length).toBe(2);
  });

  it("should filter by category", () => {
    const results = searchTools(SAMPLE_TOOLS, "", { category: "json" });
    expect(results.every((r) => r.tool.category === "json")).toBe(true);
  });

  it("should sort results by score descending", () => {
    const results = searchTools(SAMPLE_TOOLS, "format");
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.matchScore).toBeGreaterThanOrEqual(
        results[i]!.matchScore
      );
    }
  });

  it("should return empty array for non-matching query", () => {
    const results = searchTools(SAMPLE_TOOLS, "zzzznonexistent", {
      minScore: 0.5,
    });
    expect(results.length).toBe(0);
  });
});

describe("groupResultsByCategory", () => {
  it("should group results by category", () => {
    const results = searchTools(SAMPLE_TOOLS, "format");
    const groups = groupResultsByCategory(results);

    expect(groups.has("json")).toBe(true);
    expect(groups.has("yaml")).toBe(true);
  });

  it("should handle empty results", () => {
    const groups = groupResultsByCategory([]);
    expect(groups.size).toBe(0);
  });
});

describe("getSearchSuggestions", () => {
  it("should return matching tool names", () => {
    const suggestions = getSearchSuggestions(SAMPLE_TOOLS, "JSON");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((s) => s.toLowerCase().startsWith("json"))).toBe(
      true
    );
  });

  it("should return matching keywords", () => {
    const suggestions = getSearchSuggestions(SAMPLE_TOOLS, "form");
    expect(suggestions).toContain("format");
  });

  it("should respect limit", () => {
    const suggestions = getSearchSuggestions(SAMPLE_TOOLS, "j", 1);
    expect(suggestions.length).toBeLessThanOrEqual(1);
  });

  it("should return empty for empty query", () => {
    expect(getSearchSuggestions(SAMPLE_TOOLS, "")).toEqual([]);
  });
});

describe("highlightMatch", () => {
  it("should wrap matching text in mark tags", () => {
    expect(highlightMatch("JSON Formatter", "JSON")).toBe(
      "<mark>JSON</mark> Formatter"
    );
  });

  it("should be case insensitive", () => {
    expect(highlightMatch("JSON Formatter", "json")).toBe(
      "<mark>JSON</mark> Formatter"
    );
  });

  it("should return original text when no match", () => {
    expect(highlightMatch("JSON Formatter", "xyz")).toBe("JSON Formatter");
  });

  it("should return original text when query is empty", () => {
    expect(highlightMatch("JSON Formatter", "")).toBe("JSON Formatter");
  });
});
