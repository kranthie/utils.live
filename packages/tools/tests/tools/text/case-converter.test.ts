import { describe, it, expect } from "vitest";
import { caseConverter } from "../../../src/tools/text/case-converter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("caseConverter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(caseConverter.meta.id).toBe("text/case-converter");
      expect(caseConverter.meta.name).toBe("Case Converter");
      expect(caseConverter.meta.category).toBe("text");
      expect(caseConverter.meta.tier).toBe(ToolTier.CLIENT);
      expect(caseConverter.meta.keywords).toContain("case");
      expect(caseConverter.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple words to all cases", async () => {
      const result = await executeTool(caseConverter, { input: "hello world" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorld"
        );
        expect((result.data as Record<string, unknown>).pascalCase).toBe(
          "HelloWorld"
        );
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello_world"
        );
        expect((result.data as Record<string, unknown>).kebabCase).toBe(
          "hello-world"
        );
        expect((result.data as Record<string, unknown>).upperCase).toBe(
          "HELLO WORLD"
        );
        expect((result.data as Record<string, unknown>).lowerCase).toBe(
          "hello world"
        );
        expect((result.data as Record<string, unknown>).titleCase).toBe(
          "Hello World"
        );
        expect((result.data as Record<string, unknown>).sentenceCase).toBe(
          "Hello world"
        );
        expect((result.data as Record<string, unknown>).constantCase).toBe(
          "HELLO_WORLD"
        );
        expect((result.data as Record<string, unknown>).dotCase).toBe(
          "hello.world"
        );
        expect((result.data as Record<string, unknown>).pathCase).toBe(
          "hello/world"
        );
      }
    });

    it("should handle camelCase input", async () => {
      const result = await executeTool(caseConverter, {
        input: "helloWorld",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello_world"
        );
        expect((result.data as Record<string, unknown>).kebabCase).toBe(
          "hello-world"
        );
        expect((result.data as Record<string, unknown>).titleCase).toBe(
          "Hello World"
        );
      }
    });

    it("should handle PascalCase input", async () => {
      const result = await executeTool(caseConverter, {
        input: "HelloWorld",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorld"
        );
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello_world"
        );
      }
    });

    it("should handle snake_case input", async () => {
      const result = await executeTool(caseConverter, {
        input: "hello_world",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorld"
        );
        expect((result.data as Record<string, unknown>).pascalCase).toBe(
          "HelloWorld"
        );
        expect((result.data as Record<string, unknown>).kebabCase).toBe(
          "hello-world"
        );
      }
    });

    it("should handle kebab-case input", async () => {
      const result = await executeTool(caseConverter, {
        input: "hello-world",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorld"
        );
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello_world"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(caseConverter, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe("");
        expect((result.data as Record<string, unknown>).pascalCase).toBe("");
        expect((result.data as Record<string, unknown>).snakeCase).toBe("");
      }
    });

    it("should handle single word", async () => {
      const result = await executeTool(caseConverter, { input: "hello" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "hello"
        );
        expect((result.data as Record<string, unknown>).pascalCase).toBe(
          "Hello"
        );
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello"
        );
        expect((result.data as Record<string, unknown>).titleCase).toBe(
          "Hello"
        );
      }
    });

    it("should handle multiple consecutive uppercase letters", async () => {
      const result = await executeTool(caseConverter, {
        input: "getHTTPResponse",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "get_http_response"
        );
        expect((result.data as Record<string, unknown>).kebabCase).toBe(
          "get-http-response"
        );
      }
    });

    it("should handle dot.case input", async () => {
      const result = await executeTool(caseConverter, {
        input: "hello.world",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorld"
        );
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello_world"
        );
      }
    });

    it("should handle path/case input", async () => {
      const result = await executeTool(caseConverter, {
        input: "hello/world",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorld"
        );
        expect((result.data as Record<string, unknown>).snakeCase).toBe(
          "hello_world"
        );
      }
    });

    it("should handle whitespace-only input", async () => {
      const result = await executeTool(caseConverter, { input: "   " });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe("");
        expect((result.data as Record<string, unknown>).pascalCase).toBe("");
      }
    });

    it("should handle mixed delimiters", async () => {
      const result = await executeTool(caseConverter, {
        input: "hello_world-test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).camelCase).toBe(
          "helloWorldTest"
        );
        expect((result.data as Record<string, unknown>).pascalCase).toBe(
          "HelloWorldTest"
        );
      }
    });

    it("should preserve upper/lower case for direct conversions", async () => {
      const result = await executeTool(caseConverter, {
        input: "Hello World",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).upperCase).toBe(
          "HELLO WORLD"
        );
        expect((result.data as Record<string, unknown>).lowerCase).toBe(
          "hello world"
        );
      }
    });
  });
});
