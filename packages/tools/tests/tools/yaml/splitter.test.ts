import { describe, it, expect } from "vitest";
import { yamlSplitter } from "../../../src/tools/yaml/splitter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface SplitterOutput {
  documents: string[];
  count: number;
}

describe("yamlSplitter", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlSplitter.meta.id).toBe("yaml/splitter");
    });

    it("should have correct name", () => {
      expect(yamlSplitter.meta.name).toBe("YAML Splitter");
    });

    it("should be in yaml category", () => {
      expect(yamlSplitter.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlSplitter.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlSplitter.meta.keywords).toContain("yaml");
      expect(yamlSplitter.meta.keywords).toContain("split");
      expect(yamlSplitter.meta.keywords).toContain("multi-document");
    });
  });

  describe("execute - single document", () => {
    it("should handle single document without separator", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(1);
        expect(data.documents).toHaveLength(1);
        expect(data.documents[0]).toContain("name: test");
      }
    });

    it("should handle single document with separator", async () => {
      const input = "---\nname: test\nvalue: 123";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(1);
        expect(data.documents).toHaveLength(1);
      }
    });
  });

  describe("execute - multiple documents", () => {
    it("should split two documents", async () => {
      const input = "---\nname: doc1\n---\nname: doc2";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(2);
        expect(data.documents).toHaveLength(2);
        expect(data.documents[0]).toContain("doc1");
        expect(data.documents[1]).toContain("doc2");
      }
    });

    it("should split three documents", async () => {
      const input = "---\nid: 1\n---\nid: 2\n---\nid: 3";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(3);
        expect(data.documents).toHaveLength(3);
      }
    });

    it("should handle documents with complex content", async () => {
      const input = `---
server:
  host: localhost
  port: 3000
---
database:
  url: mongodb://localhost
  options:
    poolSize: 10
---
features:
  - auth
  - logging`;
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(3);
        expect(data.documents[0]).toContain("server:");
        expect(data.documents[1]).toContain("database:");
        expect(data.documents[2]).toContain("features:");
      }
    });
  });

  describe("execute - output format options", () => {
    it("should output as YAML by default", async () => {
      const input = "---\nname: doc1\n---\nname: doc2";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        // YAML format uses colon notation
        expect(data.documents[0]).toContain("name:");
        // Should not have JSON format
        expect(data.documents[0]).not.toContain("{");
      }
    });

    it("should output as JSON when specified", async () => {
      const input = "---\nname: doc1\nvalue: 123\n---\nname: doc2\nvalue: 456";
      const result = await executeTool(
        yamlSplitter,
        { input },
        { outputFormat: "json" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        // JSON format uses braces
        expect(data.documents[0]).toContain("{");
        expect(data.documents[0]).toContain('"name"');
        // Parse should work
        const parsed = JSON.parse(data.documents[0]!) as { name: string };
        expect(parsed.name).toBe("doc1");
      }
    });

    it("should respect indent for YAML output", async () => {
      const input = "---\nparent:\n  child: value";
      const result = await executeTool(
        yamlSplitter,
        { input },
        { outputFormat: "yaml", indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.documents[0]).toContain("    child:");
      }
    });

    it("should respect indent for JSON output", async () => {
      const input = "---\nparent:\n  child: value";
      const result = await executeTool(
        yamlSplitter,
        { input },
        { outputFormat: "json", indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        const parsed = JSON.parse(data.documents[0]!) as {
          parent: { child: string };
        };
        expect(parsed.parent.child).toBe("value");
        // Should have 4-space indentation
        expect(data.documents[0]).toContain("    ");
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty input", async () => {
      const result = await executeTool(yamlSplitter, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        // Empty input may produce 0 or 1 null document depending on parser behavior
        expect(data.count).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle document with only separator", async () => {
      const result = await executeTool(yamlSplitter, { input: "---" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(1);
      }
    });

    it("should handle null values in documents", async () => {
      const input = "---\nvalue: null\n---\nother: test";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(2);
        expect(data.documents[0]).toContain("null");
      }
    });

    it("should handle arrays as documents", async () => {
      const input = "---\n- a\n- b\n---\n- c\n- d";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(2);
        expect(data.documents[0]).toContain("- a");
        expect(data.documents[1]).toContain("- c");
      }
    });

    it("should handle primitive documents", async () => {
      const input = "---\nhello\n---\n123\n---\ntrue";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(3);
        expect(data.documents[0]!.trim()).toBe("hello");
        expect(data.documents[1]!.trim()).toBe("123");
        expect(data.documents[2]!.trim()).toBe("true");
      }
    });

    it("should handle documents with comments", async () => {
      const input = `---
# Comment in first doc
name: doc1
---
# Comment in second doc
name: doc2`;
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(2);
        // Comments are stripped during parsing
        expect(data.documents[0]).toContain("name: doc1");
      }
    });
  });

  describe("execute - Kubernetes-style manifests", () => {
    it("should handle Kubernetes-style multi-document YAML", async () => {
      const input = `---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment`;
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(3);
        expect(data.documents[0]).toContain("ConfigMap");
        expect(data.documents[1]).toContain("Service");
        expect(data.documents[2]).toContain("Deployment");
      }
    });
  });

  describe("execute - output validation", () => {
    it("should produce valid YAML in each document", async () => {
      const input = "---\nname: doc1\nvalue: 123\n---\nname: doc2\nvalue: 456";
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        // Each document should be valid YAML
        const yaml = await import("js-yaml");
        data.documents.forEach((doc) => {
          expect(() => yaml.load(doc)).not.toThrow();
        });
      }
    });

    it("should produce valid JSON in each document when outputFormat is json", async () => {
      const input = "---\nname: doc1\nvalue: 123\n---\nname: doc2\nvalue: 456";
      const result = await executeTool(
        yamlSplitter,
        { input },
        { outputFormat: "json" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        // Each document should be valid JSON
        data.documents.forEach((doc) => {
          expect(() => {
            JSON.parse(doc);
          }).not.toThrow();
        });
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML", async () => {
      const result = await executeTool(yamlSplitter, {
        input: "---\ninvalid: yaml: syntax:\n---\nname: doc2",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });

    it("should return error for malformed indentation", async () => {
      const result = await executeTool(yamlSplitter, {
        input: "---\nkey:\n  subkey: value\n wrong: indent\n---\nname: doc2",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = yamlSplitter.execute(
        { input: "---\nname: doc1\n---\nname: doc2" },
        undefined
      );
      expect(result.count).toBe(2);
      expect(result.documents).toHaveLength(2);
    });

    it("should default to yaml output format", () => {
      const result = yamlSplitter.execute(
        { input: "---\nname: doc1" },
        undefined
      ) as SplitterOutput;
      expect(result.documents[0]).toContain("name:");
      expect(result.documents[0]).not.toContain("{");
    });

    it("should default to indent 2", () => {
      const result = yamlSplitter.execute(
        { input: "---\nparent:\n  child: value" },
        undefined
      ) as SplitterOutput;
      expect(result.documents[0]).toContain("  child:");
    });
  });

  describe("execute - document count accuracy", () => {
    it("should return accurate count for many documents", async () => {
      const docs = Array.from({ length: 10 }, (_, i) => `name: doc${i + 1}`);
      const input = docs.map((d) => `---\n${d}`).join("\n");
      const result = await executeTool(yamlSplitter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SplitterOutput;
        expect(data.count).toBe(10);
        expect(data.documents).toHaveLength(10);
      }
    });
  });
});
