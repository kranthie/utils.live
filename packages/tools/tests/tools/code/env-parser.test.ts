import { describe, it, expect } from "vitest";
import { envParser } from "../../../src/tools/code/env-parser";
import { executeTool } from "../../../src/core/executor";

describe("envParser", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(envParser.meta.id).toBe("code/env-parser");
      expect(envParser.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should parse simple env file", async () => {
      const result = await executeTool(envParser, {
        input: "KEY=value\nDB_HOST=localhost",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect((parsed.variables as Record<string, unknown>).KEY).toBe("value");
        expect((parsed.variables as Record<string, unknown>).DB_HOST).toBe(
          "localhost"
        );
        expect(parsed.count).toBe(2);
      }
    });

    it("should handle quoted values", async () => {
      const result = await executeTool(envParser, {
        input: "KEY=\"hello world\"\nKEY2='single quotes'",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect((parsed.variables as Record<string, unknown>).KEY).toBe(
          "hello world"
        );
        expect((parsed.variables as Record<string, unknown>).KEY2).toBe(
          "single quotes"
        );
      }
    });

    it("should skip comments and count them", async () => {
      const result = await executeTool(envParser, {
        input: "# This is a comment\nKEY=value\n# Another comment",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.count).toBe(1);
        expect(parsed.comments).toBe(2);
      }
    });

    it("should skip empty lines", async () => {
      const result = await executeTool(envParser, {
        input: "\nKEY=value\n\n",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.count).toBe(1);
      }
    });

    it("should handle inline comments", async () => {
      const result = await executeTool(envParser, {
        input: "KEY=value #comment",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect((parsed.variables as Record<string, unknown>).KEY).toBe("value");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(envParser, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should skip lines without = sign", async () => {
      const result = await executeTool(envParser, {
        input: "INVALID_LINE\nKEY=value",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.count).toBe(1);
      }
    });

    it("should return keys array", async () => {
      const result = await executeTool(envParser, {
        input: "A=1\nB=2\nC=3",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.keys).toEqual(["A", "B", "C"]);
      }
    });
  });
});
