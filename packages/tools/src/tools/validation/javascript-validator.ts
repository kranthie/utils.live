import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import * as acorn from "acorn";

const inputSchema = z.object({
  input: z.string().describe("JavaScript code to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const javascriptValidator = defineTool({
  meta: {
    id: "validation/javascript-validator",
    name: "JavaScript Validator",
    description:
      "Free online JavaScript syntax validator — check your JS code for syntax errors instantly in your browser. No data is stored. Parses ES2020+ syntax including arrow functions, template literals, and destructuring.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "javascript",
      "js",
      "validate",
      "syntax",
      "ecmascript",
      "code",
      "parser",
      "es2020",
    ],
    examples: [
      {
        title: "Valid JavaScript",
        description: "Validate syntactically correct JavaScript code",
        input:
          "const greet = (name) => `Hello, ${name}!`;\nconsole.log(greet('World'));",
        output: "Valid JavaScript syntax",
      },
      {
        title: "Syntax Error",
        description: "Detect a JavaScript syntax error",
        input: "function test( { return 42; }",
        output: "JavaScript issues:\n  - Unexpected token at line 1, column 17",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const code = input.input.trim();
    if (!code) {
      return {
        output: "Empty JavaScript",
        isValid: false,
        errors: ["No code provided"],
      };
    }

    try {
      acorn.parse(code, {
        ecmaVersion: "latest",
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        allowHashBang: true,
      });
      return { output: "Valid JavaScript syntax", isValid: true };
    } catch (e) {
      if (e instanceof SyntaxError) {
        const loc = (e as unknown as { loc?: { line: number; column: number } })
          .loc;
        const position = loc
          ? ` at line ${loc.line}, column ${loc.column}`
          : "";
        const message = `${e.message}${position}`;
        return {
          output: `JavaScript issues:\n  - ${message}`,
          isValid: false,
          errors: [message],
        };
      }
      const message =
        e instanceof Error ? e.message : "Unknown JavaScript parsing error";
      return {
        output: `JavaScript issues:\n  - ${message}`,
        isValid: false,
        errors: [message],
      };
    }
  },
});
