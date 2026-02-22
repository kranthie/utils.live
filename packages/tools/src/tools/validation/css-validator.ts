import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import * as cssTree from "css-tree";

const inputSchema = z.object({
  input: z.string().describe("CSS string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const cssValidator = defineTool({
  meta: {
    id: "validation/css-validator",
    name: "CSS Validator",
    description:
      "Free online CSS syntax validator — check your stylesheets for syntax errors instantly in your browser. No data is stored. Validates selectors, properties, values, media queries, and nested rules.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "validate",
      "stylesheet",
      "syntax",
      "selector",
      "property",
      "media-query",
      "style",
    ],
    examples: [
      {
        title: "Valid CSS",
        description: "Validate a well-formed CSS rule",
        input:
          "body { margin: 0; padding: 0; font-family: Arial, sans-serif; }",
        output: "Valid CSS",
      },
      {
        title: "Unclosed Brace",
        description: "Detect a missing closing brace in CSS",
        input: ".container { display: flex; .item { color: red; }",
        output:
          "CSS issues:\n  - Unclosed brace '{' \u2014 missing closing '}'",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const css = input.input.trim();
    if (!css) {
      return {
        output: "Empty CSS",
        isValid: false,
        errors: ["No CSS provided"],
      };
    }

    const errors: string[] = [];

    try {
      const ast = cssTree.parse(css, {
        onParseError: (error: Error) => {
          const loc = error as unknown as { line?: number; column?: number };
          const position =
            loc.line !== undefined
              ? ` at line ${loc.line}, column ${loc.column}`
              : "";
          errors.push(`${error.message}${position}`);
        },
      });

      // Walk the AST looking for parse errors in the tree
      cssTree.walk(ast, {
        visit: "Raw",
        enter(node: cssTree.CssNode) {
          // Raw nodes in unexpected places indicate parse issues
          const rawNode = node as unknown as { value?: string };
          if (rawNode.value && rawNode.value.includes("{")) {
            // This can indicate a structural issue
          }
        },
      });

      // css-tree is error-tolerant, so also do a brace-matching check
      let braceDepth = 0;
      let inString: string | null = null;
      for (let i = 0; i < css.length; i++) {
        const ch = css[i]!;
        if (inString) {
          if (ch === inString && css[i - 1] !== "\\") inString = null;
          continue;
        }
        if (ch === '"' || ch === "'") {
          inString = ch;
        } else if (ch === "{") {
          braceDepth++;
        } else if (ch === "}") {
          braceDepth--;
          if (braceDepth < 0) {
            errors.push("Unexpected closing brace '}'");
            break;
          }
        }
      }
      if (braceDepth > 0) {
        errors.push("Unclosed brace '{' — missing closing '}'");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown CSS parsing error";
      errors.push(message);
    }

    const isValid = errors.length === 0;
    return {
      output: isValid
        ? "Valid CSS"
        : `CSS issues:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
