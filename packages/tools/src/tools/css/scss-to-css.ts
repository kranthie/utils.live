import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SCSS string to compile to CSS"),
});

const outputSchema = z.object({
  output: z.string().describe("Compiled CSS string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface ScssVariable {
  name: string;
  value: string;
}

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  // Extract variables
  const variables: ScssVariable[] = [];
  const withoutVarDecls = raw.replace(
    /\$([a-zA-Z_][\w-]*)\s*:\s*([^;]+);/g,
    (_match: string, name: string, value: string) => {
      variables.push({ name, value: value.trim() });
      return "";
    }
  );

  // Replace variable references
  let processed = withoutVarDecls;
  for (const v of variables) {
    // Variable values can reference other variables
    let resolvedValue = v.value;
    for (const other of variables) {
      resolvedValue = resolvedValue.replace(
        new RegExp(`\\$${other.name}\\b`, "g"),
        other.value
      );
    }
    v.value = resolvedValue;
    processed = processed.replace(new RegExp(`\\$${v.name}\\b`, "g"), v.value);
  }

  // Handle nesting
  const output = resolveNesting(processed);

  return { output: output.trim() };
}

function resolveNesting(scss: string): string {
  // Remove comments
  let cleaned = scss.replace(/\/\/[^\n]*/g, "");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  const rules = parseRules(cleaned);
  const flatRules = flattenRules(rules, []);

  const lines: string[] = [];
  for (const rule of flatRules) {
    if (rule.declarations.length === 0) continue;
    lines.push(`${rule.selector} {`);
    for (const decl of rule.declarations) {
      lines.push(`  ${decl}`);
    }
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

interface ParsedRule {
  selector: string;
  declarations: string[];
  children: ParsedRule[];
}

function parseRules(css: string): ParsedRule[] {
  const rules: ParsedRule[] = [];
  let pos = 0;
  const len = css.length;

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(css[pos]!)) pos++;
    if (pos >= len) break;

    // Find the opening brace
    const braceIdx = css.indexOf("{", pos);
    if (braceIdx === -1) break;

    const selector = css.substring(pos, braceIdx).trim();
    if (!selector) {
      pos = braceIdx + 1;
      continue;
    }

    // Find matching closing brace
    let depth = 1;
    let endIdx = braceIdx + 1;
    while (endIdx < len && depth > 0) {
      if (css[endIdx] === "{") depth++;
      if (css[endIdx] === "}") depth--;
      if (depth > 0) endIdx++;
    }

    const body = css.substring(braceIdx + 1, endIdx);

    // Parse body for declarations and nested rules
    const rule: ParsedRule = {
      selector,
      declarations: [],
      children: [],
    };

    // Split body into declarations and nested blocks
    let bodyPos = 0;
    let currentDecl = "";

    while (bodyPos < body.length) {
      const ch = body[bodyPos];

      if (ch === "{") {
        // This is a nested rule - find the selector (currentDecl) and body
        const nestedSelector = currentDecl.trim();
        currentDecl = "";

        let nestedDepth = 1;
        let nestedEnd = bodyPos + 1;
        while (nestedEnd < body.length && nestedDepth > 0) {
          if (body[nestedEnd] === "{") nestedDepth++;
          if (body[nestedEnd] === "}") nestedDepth--;
          if (nestedDepth > 0) nestedEnd++;
        }

        const nestedBody = body.substring(bodyPos + 1, nestedEnd);
        if (nestedSelector) {
          const nestedRules = parseRules(`${nestedSelector} { ${nestedBody} }`);
          rule.children.push(...nestedRules);
        }

        bodyPos = nestedEnd + 1;
        continue;
      }

      if (ch === ";") {
        const decl = currentDecl.trim();
        if (decl) {
          rule.declarations.push(decl + ";");
        }
        currentDecl = "";
        bodyPos++;
        continue;
      }

      currentDecl += ch;
      bodyPos++;
    }

    // Handle last declaration without semicolon
    const lastDecl = currentDecl.trim();
    if (lastDecl && lastDecl.includes(":")) {
      rule.declarations.push(lastDecl + ";");
    }

    rules.push(rule);
    pos = endIdx + 1;
  }

  return rules;
}

interface FlatRule {
  selector: string;
  declarations: string[];
}

function flattenRules(
  rules: ParsedRule[],
  parentSelectors: string[]
): FlatRule[] {
  const result: FlatRule[] = [];

  for (const rule of rules) {
    const selectors = rule.selector.split(",").map((s) => s.trim());
    const fullSelectors: string[] = [];

    for (const sel of selectors) {
      if (parentSelectors.length === 0) {
        fullSelectors.push(sel);
      } else {
        for (const parent of parentSelectors) {
          if (sel.startsWith("&")) {
            fullSelectors.push(parent + sel.substring(1));
          } else {
            fullSelectors.push(parent + " " + sel);
          }
        }
      }
    }

    if (rule.declarations.length > 0) {
      result.push({
        selector: fullSelectors.join(", "),
        declarations: rule.declarations,
      });
    }

    if (rule.children.length > 0) {
      result.push(...flattenRules(rule.children, fullSelectors));
    }
  }

  return result;
}

export const scssToCss = defineTool({
  meta: {
    id: "css/scss-to-css",
    name: "SCSS to CSS",
    description:
      "Free online SCSS to CSS compiler — convert SCSS variables and nesting to plain CSS instantly in your browser. No data is stored. Supports $variables, nested selectors, and &-parent references. Does not support mixins, @extend, or @import.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "scss",
      "sass",
      "css",
      "compile",
      "convert",
      "variables",
      "nesting",
      "preprocessor",
    ],
    examples: [
      {
        title: "Compile SCSS with variables",
        description: "Convert SCSS variables and nesting to plain CSS",
        input:
          "$primary: #3498db;\n\n.btn {\n  color: $primary;\n  &:hover {\n    color: darken($primary);\n  }\n}",
        output:
          ".btn {\n  color: #3498db;\n}\n\n.btn:hover {\n  color: darken(#3498db);\n}",
      },
    ],
    ui: {
      inputLanguage: "css",
      outputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
