import { describe, it, expect } from "vitest";
import { tomlToYaml } from "../../../src/tools/toml/to-yaml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("tomlToYaml", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(tomlToYaml.meta.id).toBe("toml/to-yaml");
    });

    it("should have correct name", () => {
      expect(tomlToYaml.meta.name).toBe("TOML to YAML");
    });

    it("should be in toml category", () => {
      expect(tomlToYaml.meta.category).toBe("toml");
    });

    it("should be CLIENT tier", () => {
      expect(tomlToYaml.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(tomlToYaml.meta.keywords).toContain("toml");
      expect(tomlToYaml.meta.keywords).toContain("yaml");
      expect(tomlToYaml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple key-value pairs to YAML", async () => {
      const input = `name="test"
value=123`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("name: test");
        expect(data.output).toContain("value: 123");
      }
    });

    it("should convert nested tables to nested YAML", async () => {
      const input = `[server]
host="localhost"
port=8080`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("server:");
        expect(data.output).toContain("host: localhost");
        expect(data.output).toContain("port: 8080");
      }
    });

    it("should convert deeply nested tables", async () => {
      const input = `[server]
host="localhost"

[server.ssl]
enabled=true
cert="cert.pem"`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("server:");
        expect(data.output).toContain("ssl:");
        expect(data.output).toContain("enabled: true");
      }
    });

    it("should convert arrays to YAML arrays", async () => {
      const input = `numbers=[1, 2, 3]`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("numbers:");
        expect(data.output).toContain("- 1");
        expect(data.output).toContain("- 2");
        expect(data.output).toContain("- 3");
      }
    });

    it("should convert array of tables to YAML array of objects", async () => {
      const input = `[[products]]
name="Hammer"
price=9.99

[[products]]
name="Nail"
price=0.05`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("products:");
        expect(data.output).toContain("name: Hammer");
        expect(data.output).toContain("name: Nail");
      }
    });

    it("should handle boolean values", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("enabled: true");
        expect(data.output).toContain("disabled: false");
      }
    });

    it("should handle float values", async () => {
      const input = `pi=3.14159
negative=-0.01`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("pi:");
        expect(data.output).toContain("negative:");
      }
    });

    it("should use default indent of 2 spaces", async () => {
      const input = `[server]
host="localhost"`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        // YAML nested content should be indented
        expect(data.output).toContain("  host:");
      }
    });

    it("should respect custom indent option", async () => {
      const input = `[server]
host="localhost"`;
      const result = await executeTool(tomlToYaml, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("    host:");
      }
    });

    it("should handle empty TOML", async () => {
      const result = await executeTool(tomlToYaml, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        // Empty TOML produces empty or minimal YAML
        expect(["{}", ""].includes(data.output.trim())).toBe(true);
      }
    });

    it("should return error for invalid TOML", async () => {
      const result = await executeTool(tomlToYaml, { input: "key=" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid TOML");
      }
    });

    it("should return error for invalid TOML - unclosed bracket", async () => {
      const result = await executeTool(tomlToYaml, { input: "[section" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
      }
    });

    it("should handle inline tables", async () => {
      const input = `point={x=1, y=2}`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("point:");
        expect(data.output).toContain("x: 1");
        // YAML may quote 'y' key depending on parser
        expect(data.output).toMatch(/['"]?y['"]?: 2/);
      }
    });

    it("should handle strings with special characters", async () => {
      const input = `message="Hello, World!"`;
      const result = await executeTool(tomlToYaml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("message:");
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(tomlToYaml, { input: 'name="test"' });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("options schema", () => {
    it("should have indent option defined", () => {
      expect(tomlToYaml.optionsSchema).toBeDefined();
    });

    it("should reject indent below minimum", async () => {
      const result = await executeTool(
        tomlToYaml,
        { input: 'name="test"' },
        { indent: 0 }
      );

      expect(result.success).toBe(false);
    });

    it("should reject indent above maximum", async () => {
      const result = await executeTool(
        tomlToYaml,
        { input: 'name="test"' },
        { indent: 9 }
      );

      expect(result.success).toBe(false);
    });

    it("should accept indent at minimum (1)", async () => {
      const result = await executeTool(
        tomlToYaml,
        { input: 'name="test"' },
        { indent: 1 }
      );

      expect(result.success).toBe(true);
    });

    it("should accept indent at maximum (8)", async () => {
      const result = await executeTool(
        tomlToYaml,
        { input: 'name="test"' },
        { indent: 8 }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should convert TOML when called directly", () => {
      const result = tomlToYaml.execute({ input: 'name="test"' });
      expect(result.output).toContain("name:");
    });

    it("should use default indent when options is undefined", () => {
      const result = tomlToYaml.execute(
        { input: '[server]\nhost="localhost"' },
        undefined
      );
      expect(result.output).toContain("  host:");
    });

    it("should throw error for invalid TOML", () => {
      expect(() => tomlToYaml.execute({ input: "invalid=" })).toThrow();
    });
  });
});
