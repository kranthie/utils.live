import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSS string to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  valid: z.boolean().describe("Whether the CSS is valid"),
  errors: z.array(z.string()).describe("List of validation errors"),
  warnings: z.array(z.string()).describe("List of validation warnings"),
  stats: z
    .object({
      rules: z.number(),
      properties: z.number(),
      selectors: z.number(),
    })
    .describe("CSS statistics"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let ruleCount = 0;
  let propertyCount = 0;
  let selectorCount = 0;

  // Remove comments
  const noComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");

  // Check brace matching
  let braceDepth = 0;
  const lines = noComments.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    for (const ch of line!) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
      if (braceDepth < 0) {
        errors.push(`Line ${lineNo}: Unexpected closing brace`);
        braceDepth = 0;
      }
    }
  }

  if (braceDepth > 0) {
    errors.push(
      `Unclosed brace(s): ${braceDepth} opening brace(s) without matching close`
    );
  }

  // Parse rules
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(noComments)) !== null) {
    ruleCount++;
    const selector = match[1]!.trim();
    const declarations = match[2]!.trim();

    // Count selectors
    const selectors = selector
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    selectorCount += selectors.length;

    // Validate selector
    for (const sel of selectors) {
      if (!sel) {
        errors.push(`Empty selector found`);
      }
    }

    // Validate declarations
    if (declarations) {
      const props = declarations.split(";").filter((d) => d.trim());
      for (const prop of props) {
        const trimmed = prop.trim();
        if (!trimmed) continue;

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) {
          errors.push(`Invalid declaration: "${trimmed}" (missing colon)`);
          continue;
        }

        const propName = trimmed.substring(0, colonIdx).trim();
        const propValue = trimmed.substring(colonIdx + 1).trim();

        propertyCount++;

        if (!propName) {
          errors.push(`Empty property name in declaration`);
        }

        if (!propValue) {
          errors.push(`Empty value for property "${propName}"`);
        }

        // Check for common typos in vendor prefixes
        if (
          propName.startsWith("-") &&
          !propName.startsWith("-webkit-") &&
          !propName.startsWith("-moz-") &&
          !propName.startsWith("-ms-") &&
          !propName.startsWith("-o-") &&
          !propName.startsWith("--")
        ) {
          warnings.push(`Unknown vendor prefix in "${propName}"`);
        }

        // Check for !important
        if (propValue.includes("!important")) {
          warnings.push(
            `Use of !important on "${propName}" - consider refactoring`
          );
        }
      }
    }
  }

  const valid = errors.length === 0;
  const parts: string[] = [];

  if (valid) {
    parts.push("CSS is valid!");
  } else {
    parts.push(`Found ${errors.length} error(s)`);
  }

  parts.push(
    `\nStats: ${ruleCount} rules, ${selectorCount} selectors, ${propertyCount} properties`
  );

  if (errors.length > 0) {
    parts.push("\nErrors:");
    parts.push(...errors.map((e) => `  - ${e}`));
  }
  if (warnings.length > 0) {
    parts.push("\nWarnings:");
    parts.push(...warnings.map((w) => `  - ${w}`));
  }

  return {
    output: parts.join("\n"),
    valid,
    errors,
    warnings,
    stats: {
      rules: ruleCount,
      properties: propertyCount,
      selectors: selectorCount,
    },
  };
}

export const cssValidator = defineTool({
  meta: {
    id: "css/validator",
    name: "CSS Validator",
    description:
      "Free online CSS validator — check CSS for syntax errors, mismatched braces, and common issues instantly in your browser. No data is stored. Reports invalid declarations, vendor prefix warnings, !important usage, and rule statistics.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: ["css", "validate", "check", "lint", "syntax", "error", "w3c"],
    examples: [
      {
        title: "Catch missing colon in declaration",
        description: "Detect a missing colon in a CSS property declaration",
        input:
          ".btn {\n  color: blue;\n  font-size: 14px;\n}\n.card {\n  padding 10px;\n}",
        output:
          '{"output":"Found 1 error(s)\\n\\nStats: 2 rules, 2 selectors, 2 properties\\n\\nErrors:\\n  - Invalid declaration: \\"padding 10px\\" (missing colon)","valid":false,"errors":["Invalid declaration: \\"padding 10px\\" (missing colon)"],"warnings":[],"stats":{"rules":2,"properties":2,"selectors":2}}',
      },
    ],
    ui: {
      inputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
