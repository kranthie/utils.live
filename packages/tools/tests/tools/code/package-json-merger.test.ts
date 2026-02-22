import { describe, it, expect } from "vitest";
import { packageJsonMerger } from "../../../src/tools/code/package-json-merger";
import { executeTool } from "../../../src/core/executor";

describe("packageJsonMerger", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(packageJsonMerger.meta.id).toBe("code/package-json-merger");
      expect(packageJsonMerger.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should merge two simple package.json files", async () => {
      const result = await executeTool(packageJsonMerger, {
        input1: '{"name": "base", "version": "1.0.0"}',
        input2: '{"description": "merged"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const merged = JSON.parse(data.original as string) as Record<
          string,
          unknown
        >;
        expect(merged.name).toBe("base");
        expect(merged.description).toBe("merged");
        expect(data.modified).toContain("Added keys: description");
      }
    });

    it("should deep merge nested objects", async () => {
      const result = await executeTool(packageJsonMerger, {
        input1: '{"dependencies": {"react": "^18.0.0"}}',
        input2: '{"dependencies": {"next": "^14.0.0"}}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const merged = JSON.parse(data.original as string) as Record<
          string,
          unknown
        >;
        const deps = merged.dependencies as Record<string, unknown>;
        expect(deps.react).toBe("^18.0.0");
        expect(deps.next).toBe("^14.0.0");
      }
    });

    it("should merge arrays without duplicates", async () => {
      const result = await executeTool(packageJsonMerger, {
        input1: '{"keywords": ["a", "b"]}',
        input2: '{"keywords": ["b", "c"]}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const merged = JSON.parse(data.original as string) as Record<
          string,
          unknown
        >;
        expect(merged.keywords).toEqual(["a", "b", "c"]);
      }
    });

    it("should override scalar values", async () => {
      const result = await executeTool(packageJsonMerger, {
        input1: '{"version": "1.0.0"}',
        input2: '{"version": "2.0.0"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const merged = JSON.parse(data.original as string) as Record<
          string,
          unknown
        >;
        expect(merged.version).toBe("2.0.0");
        expect(data.modified).toContain("Updated keys: version");
      }
    });

    it("should reject invalid base JSON", async () => {
      const result = await executeTool(packageJsonMerger, {
        input1: "invalid json",
        input2: "{}",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid overlay JSON", async () => {
      const result = await executeTool(packageJsonMerger, {
        input1: "{}",
        input2: "invalid json",
      });
      expect(result.success).toBe(false);
    });
  });
});
