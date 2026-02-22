import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  items: z
    .string()
    .default("Item 1\nItem 2\nItem 3")
    .describe("List items, one per line (use indentation for nesting)"),
  type: z
    .enum(["ul", "ol"])
    .default("ul")
    .describe("List type: ul (unordered) or ol (ordered)"),
  listStyle: z
    .string()
    .default("")
    .describe(
      "CSS list-style-type (disc, circle, square, decimal, lower-alpha, etc.)"
    ),
  className: z.string().default("").describe("CSS class name for the list"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated HTML list"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface ListItem {
  text: string;
  children: ListItem[];
}

function parseItems(text: string): ListItem[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const root: ListItem[] = [];
  const stack: { items: ListItem[]; indent: number }[] = [
    { items: root, indent: -1 },
  ];

  for (const line of lines) {
    const trimmed = line.replace(/^[\s]*[-*]\s*/, "").trim() || line.trim();
    const indent = line.search(/\S/);
    const item: ListItem = { text: trimmed, children: [] };

    // Find the right parent level
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }

    stack[stack.length - 1]!.items.push(item);
    stack.push({ items: item.children, indent });
  }

  return root;
}

function renderList(
  items: ListItem[],
  tag: string,
  indent: number,
  indentStr: string,
  styleAttr: string,
  classAttr: string
): string[] {
  const lines: string[] = [];
  const prefix = indentStr.repeat(indent);
  const attrs = indent === 0 ? `${styleAttr}${classAttr}` : "";
  lines.push(`${prefix}<${tag}${attrs}>`);

  for (const item of items) {
    if (item.children.length > 0) {
      lines.push(`${prefix}${indentStr}<li>${item.text}`);
      lines.push(
        ...renderList(item.children, tag, indent + 2, indentStr, "", "")
      );
      lines.push(`${prefix}${indentStr}</li>`);
    } else {
      lines.push(`${prefix}${indentStr}<li>${item.text}</li>`);
    }
  }

  lines.push(`${prefix}</${tag}>`);
  return lines;
}

function execute(input: Input): Output {
  const items = parseItems(input.items);
  if (items.length === 0) {
    throw new Error("No list items provided");
  }

  const tag = input.type;
  const styleAttr = input.listStyle
    ? ` style="list-style-type: ${input.listStyle}"`
    : "";
  const classAttr = input.className ? ` class="${input.className}"` : "";

  const lines = renderList(items, tag, 0, "  ", styleAttr, classAttr);
  return { output: lines.join("\n") };
}

export const htmlListGenerator = defineTool({
  meta: {
    id: "html/list-generator",
    name: "HTML List Generator",
    description:
      "Free online HTML list generator — create ordered or unordered HTML lists instantly in your browser. No data is stored. Supports nested lists via indentation, custom list styles (disc, circle, square, decimal), and CSS class names.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "list",
      "generator",
      "ul",
      "ol",
      "ordered",
      "unordered",
      "nested list",
      "bullet list",
      "numbered list",
    ],
    examples: [
      {
        title: "Navigation link list",
        description: "Create an unordered HTML list from navigation items",
        input: {
          items: "Home\nAbout\nProducts\nContact",
          type: "ul",
          listStyle: "",
          className: "nav-links",
        },
        output:
          '<ul class="nav-links">\n  <li>Home</li>\n  <li>About</li>\n  <li>Products</li>\n  <li>Contact</li>\n</ul>',
      },
    ],
    ui: {
      outputRenderer: "html",
      outputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
