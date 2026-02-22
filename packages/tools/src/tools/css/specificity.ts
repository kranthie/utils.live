import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSS selector(s), one per line"),
});

const outputSchema = z.object({
  output: z.string().describe("Specificity analysis for each selector"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface Specificity {
  a: number; // IDs
  b: number; // Classes, attributes, pseudo-classes
  c: number; // Elements, pseudo-elements
}

function calculateSpecificity(selector: string): Specificity {
  let a = 0;
  let b = 0;
  let c = 0;

  // Remove :not() wrapper but keep its argument
  let processed = selector.replace(/:not\(([^)]+)\)/g, "$1");

  // Remove everything inside strings
  processed = processed.replace(/"[^"]*"/g, "").replace(/'[^']*'/g, "");

  // Count IDs (#id)
  const ids = processed.match(/#[a-zA-Z_][\w-]*/g);
  a += ids ? ids.length : 0;

  // Remove IDs to avoid double counting
  processed = processed.replace(/#[a-zA-Z_][\w-]*/g, "");

  // Count classes (.class)
  const classes = processed.match(/\.[a-zA-Z_][\w-]*/g);
  b += classes ? classes.length : 0;

  // Count attribute selectors ([attr])
  const attrs = processed.match(/\[[^\]]+\]/g);
  b += attrs ? attrs.length : 0;

  // Count pseudo-classes (:hover, :first-child, etc.) but not pseudo-elements
  const pseudoClasses = processed.match(/:(?!:)[a-zA-Z][\w-]*(?:\([^)]*\))?/g);
  if (pseudoClasses) {
    for (const pc of pseudoClasses) {
      // Skip pseudo-elements that use single colon syntax
      if (!/^:(before|after|first-line|first-letter)$/i.test(pc)) {
        b++;
      } else {
        c++;
      }
    }
  }

  // Remove classes, attrs, pseudo-classes for element counting
  processed = processed.replace(/\.[a-zA-Z_][\w-]*/g, "");
  processed = processed.replace(/\[[^\]]+\]/g, "");
  processed = processed.replace(/:[a-zA-Z][\w-]*(?:\([^)]*\))?/g, "");

  // Count pseudo-elements (::before, ::after)
  const pseudoElements = selector.match(/::[a-zA-Z][\w-]*/g);
  c += pseudoElements ? pseudoElements.length : 0;

  // Count element selectors
  const remaining = processed.replace(/[>+~*\s,]/g, " ").trim();
  const elements = remaining
    .split(/\s+/)
    .filter((e) => e && /^[a-zA-Z][\w-]*$/.test(e));
  c += elements.length;

  return { a, b, c };
}

function specificityToString(s: Specificity): string {
  return `(${s.a}, ${s.b}, ${s.c})`;
}

function specificityToScore(s: Specificity): number {
  return s.a * 100 + s.b * 10 + s.c;
}

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const selectors = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const results: string[] = [];

  for (const selector of selectors) {
    const spec = calculateSpecificity(selector);
    const score = specificityToScore(spec);
    results.push(
      `${selector}\n  Specificity: ${specificityToString(spec)}\n  Score: ${score}\n  IDs: ${spec.a}, Classes/Attrs: ${spec.b}, Elements: ${spec.c}`
    );
  }

  // Sort by specificity if multiple selectors
  if (selectors.length > 1) {
    const sorted = selectors
      .map((s) => ({ selector: s, spec: calculateSpecificity(s) }))
      .sort((a, b) => specificityToScore(b.spec) - specificityToScore(a.spec));

    results.push("\n--- Sorted by specificity (highest first) ---");
    for (const item of sorted) {
      results.push(`  ${specificityToString(item.spec)} - ${item.selector}`);
    }
  }

  return { output: results.join("\n\n") };
}

export const cssSpecificity = defineTool({
  meta: {
    id: "css/specificity",
    name: "CSS Specificity Calculator",
    description:
      "Free online CSS specificity calculator — compute specificity scores for CSS selectors and rank them by priority instantly in your browser. No data is stored. Breaks down IDs, classes, attributes, pseudo-classes, and elements.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "specificity",
      "selector",
      "score",
      "cascade",
      "priority",
      "weight",
    ],
    examples: [
      {
        title: "Compare selector specificity",
        description:
          "Calculate and rank three CSS selectors by specificity score",
        input: "#header .nav a\n.nav a:hover\ndiv.container p",
        output:
          '{"output":"#header .nav a\\n  Specificity: (1, 1, 1)\\n  Score: 111\\n  IDs: 1, Classes/Attrs: 1, Elements: 1\\n\\n.nav a:hover\\n  Specificity: (0, 2, 1)\\n  Score: 21\\n  IDs: 0, Classes/Attrs: 2, Elements: 1\\n\\ndiv.container p\\n  Specificity: (0, 1, 2)\\n  Score: 12\\n  IDs: 0, Classes/Attrs: 1, Elements: 2\\n\\n\\n--- Sorted by specificity (highest first) ---\\n\\n  (1, 1, 1) - #header .nav a\\n\\n  (0, 2, 1) - .nav a:hover\\n\\n  (0, 1, 2) - div.container p"}',
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
