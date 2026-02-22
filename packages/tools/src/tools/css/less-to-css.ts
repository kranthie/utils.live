import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("LESS string to compile to CSS"),
});

const outputSchema = z.object({
  output: z.string().describe("Compiled CSS string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  // Extract LESS variables (@var: value;)
  const variables: Record<string, string> = {};
  let processed = raw.replace(
    /@([a-zA-Z_][\w-]*)\s*:\s*([^;]+);/g,
    (_match: string, name: string, value: string) => {
      variables[name] = value.trim();
      return "";
    }
  );

  // Resolve variable references (multiple passes for chained refs)
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const [name, value] of Object.entries(variables)) {
      const resolved = value.replace(
        /@([a-zA-Z_][\w-]*)/g,
        (_m: string, ref: string) => {
          if (ref in variables) {
            changed = true;
            return variables[ref]!;
          }
          return _m;
        }
      );
      variables[name] = resolved;
    }
    if (!changed) break;
  }

  // Replace variable references in CSS
  processed = processed.replace(
    /@([a-zA-Z_][\w-]*)/g,
    (_m: string, name: string) => {
      return name in variables ? variables[name]! : _m;
    }
  );

  // Handle nesting (same approach as SCSS since LESS nesting is similar)
  const output = resolveNesting(processed);

  return { output: output.trim() };
}

interface ParsedRule {
  selector: string;
  declarations: string[];
  children: ParsedRule[];
}

interface FlatRule {
  selector: string;
  declarations: string[];
}

function resolveNesting(less: string): string {
  let cleaned = less.replace(/\/\/[^\n]*/g, "");
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

function parseRules(css: string): ParsedRule[] {
  const rules: ParsedRule[] = [];
  let pos = 0;
  const len = css.length;

  while (pos < len) {
    while (pos < len && /\s/.test(css[pos]!)) pos++;
    if (pos >= len) break;

    const braceIdx = css.indexOf("{", pos);
    if (braceIdx === -1) break;

    const selector = css.substring(pos, braceIdx).trim();
    if (!selector) {
      pos = braceIdx + 1;
      continue;
    }

    let depth = 1;
    let endIdx = braceIdx + 1;
    while (endIdx < len && depth > 0) {
      if (css[endIdx] === "{") depth++;
      if (css[endIdx] === "}") depth--;
      if (depth > 0) endIdx++;
    }

    const body = css.substring(braceIdx + 1, endIdx);
    const rule: ParsedRule = { selector, declarations: [], children: [] };

    let bodyPos = 0;
    let currentDecl = "";

    while (bodyPos < body.length) {
      const ch = body[bodyPos];

      if (ch === "{") {
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
        if (decl) rule.declarations.push(decl + ";");
        currentDecl = "";
        bodyPos++;
        continue;
      }

      currentDecl += ch;
      bodyPos++;
    }

    const lastDecl = currentDecl.trim();
    if (lastDecl && lastDecl.includes(":")) {
      rule.declarations.push(lastDecl + ";");
    }

    rules.push(rule);
    pos = endIdx + 1;
  }

  return rules;
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

export const lessToCss = defineTool({
  meta: {
    id: "css/less-to-css",
    name: "LESS to CSS",
    description:
      "Free online LESS to CSS compiler — convert LESS variables and nesting to plain CSS instantly in your browser. No data is stored. Supports @variables, nested selectors, and &-parent references. Does not support mixins, guards, or @import.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "less",
      "css",
      "compile",
      "convert",
      "variables",
      "nesting",
      "preprocessor",
    ],
    examples: [
      {
        title: "Compile LESS with variables",
        description: "Convert LESS variables and nesting to plain CSS",
        input:
          "@brand: #e74c3c;\n\n.alert {\n  border: 1px solid @brand;\n  color: @brand;\n  p {\n    margin: 0;\n  }\n}",
        output:
          ".alert {\n  border: 1px solid #e74c3c;\n  color: #e74c3c;\n}\n\n.alert p {\n  margin: 0;\n}",
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
