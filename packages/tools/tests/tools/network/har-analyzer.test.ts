import { describe, it, expect } from "vitest";
import { harAnalyzer } from "../../../src/tools/network/har-analyzer";
import { executeTool } from "../../../src/core/executor";

const SAMPLE_HAR = JSON.stringify({
  log: {
    entries: [
      {
        request: { method: "GET", url: "https://example.com/api/users", headers: [{ name: "Accept", value: "application/json" }] },
        response: { status: 200, statusText: "OK", content: { size: 1024, mimeType: "application/json" } },
        time: 150,
      },
      {
        request: { method: "POST", url: "https://example.com/api/users", headers: [] },
        response: { status: 201, statusText: "Created", content: { size: 512, mimeType: "application/json" } },
        time: 300,
      },
      {
        request: { method: "GET", url: "https://cdn.example.com/styles.css", headers: [] },
        response: { status: 404, statusText: "Not Found", content: { size: 100, mimeType: "text/html" } },
        time: 50,
      },
    ],
  },
});

describe("harAnalyzer", () => {
  it("should have correct metadata", () => {
    expect(harAnalyzer.meta.id).toBe("network/har-analyzer");
    expect(harAnalyzer.meta.category).toBe("network");
  });

  it("should analyze HAR data", async () => {
    const result = await executeTool(harAnalyzer, { input: SAMPLE_HAR });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Total Requests: 3");
      expect(output).toContain("GET: 2 requests");
      expect(output).toContain("POST: 1 requests");
      expect(output).toContain("example.com");
    }
  });

  it("should filter by status code", async () => {
    const result = await executeTool(harAnalyzer, { input: SAMPLE_HAR }, { filterStatus: "4xx" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Total Requests: 1");
    }
  });

  it("should filter by MIME type", async () => {
    const result = await executeTool(harAnalyzer, { input: SAMPLE_HAR }, { filterMime: "json" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Total Requests: 2");
    }
  });

  it("should show headers when option enabled", async () => {
    const result = await executeTool(harAnalyzer, { input: SAMPLE_HAR }, { showHeaders: true });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Request Details");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(harAnalyzer, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JSON", async () => {
    const result = await executeTool(harAnalyzer, { input: "not json" });
    expect(result.success).toBe(false);
  });

  it("should fail on missing log property", async () => {
    const result = await executeTool(harAnalyzer, { input: "{}" });
    expect(result.success).toBe(false);
  });
});
