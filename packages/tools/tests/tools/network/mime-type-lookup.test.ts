import { describe, it, expect } from "vitest";
import { mimeTypeLookup } from "../../../src/tools/network/mime-type-lookup";
import { executeTool } from "../../../src/core/executor";

describe("mimeTypeLookup", () => {
  it("should have correct metadata", () => {
    expect(mimeTypeLookup.meta.id).toBe("network/mime-type-lookup");
    expect(mimeTypeLookup.meta.category).toBe("network");
  });

  it("should look up extension 'json'", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "json" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.mimeType).toBe("application/json");
      expect(data.extension).toBe("json");
    }
  });

  it("should strip leading dot from extension", async () => {
    const result = await executeTool(mimeTypeLookup, { input: ".png" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.mimeType).toBe("image/png");
    }
  });

  it("should look up by MIME type", async () => {
    const result = await executeTool(mimeTypeLookup, {
      input: "application/json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, string>[];
      expect(Array.isArray(data)).toBe(true);
      expect(
        data.some((d: Record<string, string>) => d.extension === "json")
      ).toBe(true);
    }
  });

  it("should handle case-insensitive lookup", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "JSON" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.mimeType).toBe("application/json");
    }
  });

  it("should find image types", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "png" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.category).toBe("image");
    }
  });

  it("should find audio types", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "mp3" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.mimeType).toBe("audio/mpeg");
    }
  });

  it("should find archive types", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "zip" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.mimeType).toBe("application/zip");
    }
  });

  it("should handle partial match", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "script" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(mimeTypeLookup, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on unknown MIME type", async () => {
    const result = await executeTool(mimeTypeLookup, {
      input: "completely_unknown_format_xyz_123",
    });
    expect(result.success).toBe(false);
  });
});
