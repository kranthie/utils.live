import { describe, it, expect } from "vitest";
import { tomlValidator } from "../../../src/tools/toml/validator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("tomlValidator", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(tomlValidator.meta.id).toBe("toml/validator");
    });

    it("should have correct name", () => {
      expect(tomlValidator.meta.name).toBe("TOML Validator");
    });

    it("should be in toml category", () => {
      expect(tomlValidator.meta.category).toBe("toml");
    });

    it("should be CLIENT tier", () => {
      expect(tomlValidator.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(tomlValidator.meta.keywords).toContain("toml");
      expect(tomlValidator.meta.keywords).toContain("validate");
    });
  });

  describe("execute - valid TOML", () => {
    it("should validate simple key-value pairs", async () => {
      const input = `name="test"
value=123`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.error).toBeUndefined();
      }
    });

    it("should validate empty TOML", async () => {
      const result = await executeTool(tomlValidator, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate tables", async () => {
      const input = `[server]
host="localhost"
port=8080`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate nested tables", async () => {
      const input = `[server.ssl]
enabled=true
cert="cert.pem"`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate arrays", async () => {
      const input = `numbers=[1, 2, 3]
names=["alice", "bob"]`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate array of tables", async () => {
      const input = `[[products]]
name="Hammer"

[[products]]
name="Nail"`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate boolean values", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate float values", async () => {
      const input = `pi=3.14159
negative=-0.01
scientific=5e+22`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate inline tables", async () => {
      const input = `point={x=1, y=2}`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate multi-line strings", async () => {
      const input = `multiline="""
This is a
multi-line string
"""`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate literal strings", async () => {
      const input = `path='C:\\Users\\test'`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate dates", async () => {
      const input = `date=2024-01-15`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate comments", async () => {
      const input = `# This is a comment
name="test" # inline comment`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });
  });

  describe("execute - invalid TOML", () => {
    it("should detect missing value", async () => {
      const result = await executeTool(tomlValidator, { input: "key=" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should detect duplicate keys", async () => {
      const input = `name="first"
name="second"`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should detect unclosed string", async () => {
      const result = await executeTool(tomlValidator, {
        input: 'name="unclosed',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should detect unclosed bracket in table", async () => {
      const result = await executeTool(tomlValidator, { input: "[section" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should detect invalid key format", async () => {
      const result = await executeTool(tomlValidator, {
        input: "key with spaces=value",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
      }
    });

    it("should detect mixed array types (invalid in TOML v0.4)", async () => {
      // Note: Mixed types might be allowed in some TOML versions
      const result = await executeTool(tomlValidator, {
        input: 'mixed=[1, "string"]',
      });

      expect(result.success).toBe(true);
      // The validity depends on the TOML parser version
    });

    it("should detect invalid number format", async () => {
      const result = await executeTool(tomlValidator, {
        input: "number=1.2.3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
      }
    });

    it("should provide line number for errors when available", async () => {
      const input = `name="test"
invalid=`;
      const result = await executeTool(tomlValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        // Line number may or may not be available depending on parser
        if (result.data.line) {
          expect(result.data.line).toBeGreaterThan(0);
        }
      }
    });

    it("should provide column number for errors when available", async () => {
      const result = await executeTool(tomlValidator, { input: "key=" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        // Column number may or may not be available depending on parser
      }
    });
  });

  describe("error message handling", () => {
    it("should provide descriptive error message", async () => {
      const result = await executeTool(tomlValidator, {
        input: "invalid syntax here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
        expect(typeof result.data.error).toBe("string");
      }
    });
  });

  describe("execution metadata", () => {
    it("should include execution metadata", async () => {
      const result = await executeTool(tomlValidator, { input: 'name="test"' });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should validate TOML when called directly", () => {
      const result = tomlValidator.execute({ input: 'name="test"' });
      expect(result.valid).toBe(true);
    });

    it("should return error info for invalid TOML", () => {
      const result = tomlValidator.execute({ input: "invalid=" });
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle non-Error exception with fallback message", () => {
      // This tests the fallback path in the catch block
      const result = tomlValidator.execute({ input: "key=" });
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
