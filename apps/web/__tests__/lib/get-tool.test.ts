import { describe, it, expect } from "vitest";
import {
  getTool,
  getToolsInCategory,
  getAllToolCards,
  getRelatedTools,
  getCategorySummaries,
  getCategoryInfo,
} from "@/lib/tools/get-tool";

describe("getTool", () => {
  it("should return tool data for a valid tool", () => {
    const tool = getTool("json", "formatter");
    expect(tool).not.toBeNull();
    expect(tool!.meta.id).toBe("json/formatter");
    expect(tool!.meta.name).toBeDefined();
    expect(tool!.ui).toBeDefined();
    expect(tool!.inputSchema).toBeDefined();
    expect(tool!.optionsSchema).toBeDefined();
  });

  it("should return null for a non-existent tool", () => {
    const tool = getTool("nonexistent", "tool");
    expect(tool).toBeNull();
  });

  it("should include input and output schemas", () => {
    const tool = getTool("json", "formatter");
    expect(tool).not.toBeNull();
    expect(typeof tool!.inputSchema).toBe("object");
    expect(typeof tool!.outputSchema).toBe("object");
  });
});

describe("getToolsInCategory", () => {
  it("should return tools for an existing category", () => {
    const tools = getToolsInCategory("json");
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((t) => t.category === "json")).toBe(true);
  });

  it("should return ToolCardData with correct shape", () => {
    const tools = getToolsInCategory("json");
    const tool = tools[0]!;
    expect(tool.id).toBeDefined();
    expect(tool.name).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.category).toBe("json");
    expect(tool.href).toMatch(/^\/tools\/json\//);
  });

  it("should return empty array for unknown category", () => {
    const tools = getToolsInCategory("nonexistent");
    expect(tools).toEqual([]);
  });
});

describe("getAllToolCards", () => {
  it("should return all registered tools", () => {
    const tools = getAllToolCards();
    expect(tools.length).toBeGreaterThan(0);
  });

  it("should return tools from multiple categories", () => {
    const tools = getAllToolCards();
    const categories = new Set(tools.map((t) => t.category));
    expect(categories.size).toBeGreaterThan(1);
  });
});

describe("getRelatedTools", () => {
  it("should return related tools from the same category", () => {
    const related = getRelatedTools("json/formatter");
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((t) => t.category === "json")).toBe(true);
  });

  it("should exclude the source tool from results", () => {
    const related = getRelatedTools("json/formatter");
    expect(related.every((t) => t.id !== "json/formatter")).toBe(true);
  });

  it("should respect the limit parameter", () => {
    const related = getRelatedTools("json/formatter", 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it("should return empty for non-existent tool", () => {
    const related = getRelatedTools("nonexistent/tool");
    expect(related).toEqual([]);
  });
});

describe("getCategorySummaries", () => {
  it("should return category summaries", () => {
    const summaries = getCategorySummaries();
    expect(summaries.length).toBeGreaterThan(0);
  });

  it("should include correct fields in each summary", () => {
    const summaries = getCategorySummaries();
    const summary = summaries[0]!;
    expect(summary.id).toBeDefined();
    expect(summary.name).toBeDefined();
    expect(summary.description).toBeDefined();
    expect(summary.icon).toBeDefined();
    expect(summary.toolCount).toBeGreaterThan(0);
    expect(summary.href).toMatch(/^\/tools\//);
  });
});

describe("getCategoryInfo", () => {
  it("should return info for an existing category", () => {
    const info = getCategoryInfo("json");
    expect(info).not.toBeNull();
    expect(info!.id).toBe("json");
    expect(info!.name).toBe("JSON Tools");
  });

  it("should return null for non-existent category", () => {
    const info = getCategoryInfo("nonexistent");
    expect(info).toBeNull();
  });
});
