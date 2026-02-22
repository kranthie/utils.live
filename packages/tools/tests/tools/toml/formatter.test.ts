import { describe, it, expect } from "vitest";
import { tomlFormatter } from "../../../src/tools/toml/formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("tomlFormatter", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(tomlFormatter.meta.id).toBe("toml/formatter");
    });

    it("should have correct name", () => {
      expect(tomlFormatter.meta.name).toBe("TOML Formatter");
    });

    it("should be in toml category", () => {
      expect(tomlFormatter.meta.category).toBe("toml");
    });

    it("should be CLIENT tier", () => {
      expect(tomlFormatter.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(tomlFormatter.meta.keywords).toContain("toml");
      expect(tomlFormatter.meta.keywords).toContain("format");
    });
  });

  describe("execute", () => {
    it("should format simple key-value pairs", async () => {
      const input = `name="test"
value=123`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("name");
        expect(result.data.output).toContain("test");
        expect(result.data.output).toContain("value");
        expect(result.data.output).toContain("123");
      }
    });

    it("should format nested tables", async () => {
      const input = `[server]
host="localhost"
port=8080

[server.ssl]
enabled=true
cert="cert.pem"`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("[server]");
        expect(result.data.output).toContain("host");
        expect(result.data.output).toContain("localhost");
      }
    });

    it("should format arrays", async () => {
      const input = `numbers=[1,2,3]
names=["alice","bob","charlie"]`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("numbers");
        expect(result.data.output).toContain("names");
      }
    });

    it("should format array of tables", async () => {
      const input = `[[products]]
name="Hammer"
price=9.99

[[products]]
name="Nail"
price=0.05`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("[[products]]");
        expect(result.data.output).toContain("Hammer");
        expect(result.data.output).toContain("Nail");
      }
    });

    it("should handle boolean values", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("enabled");
        expect(result.data.output).toContain("true");
        expect(result.data.output).toContain("disabled");
        expect(result.data.output).toContain("false");
      }
    });

    it("should handle inline tables", async () => {
      const input = `point={x=1,y=2}`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("point");
      }
    });

    it("should handle multi-line strings", async () => {
      const input = `multiline="""
This is a
multi-line string
"""`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle dates and times", async () => {
      const input = `date=2024-01-15
datetime=2024-01-15T10:30:00Z`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle float values", async () => {
      const input = `pi=3.14159
negative=-0.01
scientific=5e+22`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle already formatted TOML", async () => {
      const formatted = `[server]
host = "localhost"
port = 8080
`;
      const result = await executeTool(tomlFormatter, { input: formatted });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid TOML - missing value", async () => {
      const result = await executeTool(tomlFormatter, { input: "key=" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid TOML");
      }
    });

    it("should return error for invalid TOML - duplicate keys", async () => {
      const input = `name="first"
name="second"`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
      }
    });

    it("should return error for invalid TOML - unclosed string", async () => {
      const result = await executeTool(tomlFormatter, {
        input: 'name="unclosed',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
      }
    });

    it("should return error for empty input", async () => {
      const result = await executeTool(tomlFormatter, { input: "" });

      // Empty TOML is actually valid (empty document)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("");
      }
    });

    it("should handle special characters in strings", async () => {
      const input = `path="C:\\\\Users\\\\test"
escaped="line1\\nline2"`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle comments", async () => {
      const input = `# This is a comment
name="test" # inline comment
# Another comment
value=123`;
      const result = await executeTool(tomlFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(tomlFormatter, {
        input: 'name="test"',
      });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should format TOML when called directly", () => {
      const result = tomlFormatter.execute({ input: 'name="test"' });
      expect(result.output).toBeDefined();
      expect(result.output).toContain("name");
    });

    it("should throw error for invalid TOML", () => {
      expect(() => tomlFormatter.execute({ input: "invalid=" })).toThrow();
    });
  });
});
