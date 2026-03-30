import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSS string to convert to SCSS"),
});

const outputSchema = z.object({
  output: z.string().describe("SCSS string with nesting"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface CssRule {
  selector: string;
  declarations: string[];
}

interface ScssNode {
  selector: string;
  declarations: string[];
  children: Map<string, ScssNode>;
}

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  // Remove comments
  let cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "");

  // Parse flat CSS rules
  const rules: CssRule[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleaned)) !== null) {
    const selector = (match[1] ?? "").trim();
    const body = (match[2] ?? "").trim();
    const declarations = body
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => d + ";");

    if (selector && declarations.length > 0) {
      rules.push({ selector, declarations });
    }
  }

  // Build nesting tree
  const root = new Map<string, ScssNode>();

  for (const rule of rules) {
    // Split by whitespace, then merge combinators (>, +, ~) with the following selector
    const rawParts = rule.selector.split(/\s+/).filter(Boolean);
    const parts: string[] = [];
    for (let i = 0; i < rawParts.length; i++) {
      const p = rawParts[i]!;
      if ((p === ">" || p === "+" || p === "~") && i + 1 < rawParts.length) {
        parts.push(`${p} ${rawParts[++i]!}`);
      } else {
        parts.push(p);
      }
    }
    const firstPart = parts[0] ?? "";

    if (parts.length === 1) {
      // Top level selector
      if (!root.has(firstPart)) {
        root.set(firstPart, {
          selector: firstPart,
          declarations: [],
          children: new Map(),
        });
      }
      root.get(firstPart)!.declarations.push(...rule.declarations);
    } else {
      // Nested selectors
      const topSelector = firstPart;
      if (!root.has(topSelector)) {
        root.set(topSelector, {
          selector: topSelector,
          declarations: [],
          children: new Map(),
        });
      }

      let current = root.get(topSelector)!;
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i] ?? "";
        if (!current.children.has(part)) {
          current.children.set(part, {
            selector: part,
            declarations: [],
            children: new Map(),
          });
        }
        current = current.children.get(part)!;
      }
      current.declarations.push(...rule.declarations);
    }
  }

  // Render SCSS
  const lines: string[] = [];
  for (const [, node] of root) {
    renderScssNode(node, 0, lines);
    lines.push("");
  }

  return { output: lines.join("\n").trim() };
}

function renderScssNode(node: ScssNode, level: number, lines: string[]): void {
  const indent = "  ".repeat(level);

  // Check if selector should use & (pseudo-classes/elements)
  let selector = node.selector;
  if (level > 0 && (selector.startsWith(":") || selector.startsWith("::"))) {
    selector = "&" + selector;
  }

  lines.push(`${indent}${selector} {`);

  for (const decl of node.declarations) {
    lines.push(`${indent}  ${decl}`);
  }

  for (const [, child] of node.children) {
    if (
      node.declarations.length > 0 ||
      lines[lines.length - 1] !== `${indent}${selector} {`
    ) {
      lines.push("");
    }
    renderScssNode(child, level + 1, lines);
  }

  lines.push(`${indent}}`);
}

export const cssToScss = defineTool({
  meta: {
    id: "css/css-to-scss",
    name: "CSS to SCSS",
    description:
      "Free online CSS to SCSS converter — convert flat CSS selectors into nested SCSS structure instantly in your browser. No data is stored. Groups child selectors under parent blocks with proper indentation.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: ["css", "scss", "sass", "convert", "nesting", "refactor"],
    examples: [
      {
        title: "Nest navigation selectors",
        description: "Convert flat CSS nav selectors into nested SCSS blocks",
        input:
          ".nav { display: flex; }\n.nav a { color: blue; }\n.nav a:hover { color: red; }",
        output:
          '{"output":".nav {\\n  display: flex;\\n\\n  a {\\n    color: blue;\\n  }\\n\\n  a:hover {\\n    color: red;\\n  }\\n}"}',
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
