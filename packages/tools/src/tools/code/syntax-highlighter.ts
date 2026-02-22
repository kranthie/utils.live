import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Code to highlight"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML with syntax highlighting"),
});

const optionsSchema = z.object({
  language: z
    .enum([
      "javascript",
      "typescript",
      "html",
      "css",
      "json",
      "python",
      "sql",
      "auto",
    ])
    .default("auto")
    .describe("Language for highlighting"),
  theme: z.enum(["dark", "light"]).default("dark").describe("Color theme"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightJS(code: string): string {
  let result = escapeHtml(code);
  // Keywords
  result = result.replace(
    /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|throw|try|catch|finally|import|export|from|default|async|await|yield|typeof|instanceof|void|delete|in|of)\b/g,
    '<span class="kw">$1</span>'
  );
  // Strings
  result = result.replace(
    /(&quot;[^&]*&quot;|'[^']*'|`[^`]*`)/g,
    '<span class="str">$1</span>'
  );
  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
  // Comments
  result = result.replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cmt">$1</span>');
  return result;
}

function highlightCSS(code: string): string {
  let result = escapeHtml(code);
  // Selectors (before {)
  result = result.replace(/^([^{]+?)(\{)/gm, '<span class="sel">$1</span>$2');
  // Properties
  result = result.replace(/([a-z-]+)\s*:/g, '<span class="prop">$1</span>:');
  // Values
  result = result.replace(/:\s*([^;{}]+)/g, ': <span class="val">$1</span>');
  // Comments
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cmt">$1</span>');
  return result;
}

function highlightHTML(code: string): string {
  let result = escapeHtml(code);
  // Tags
  result = result.replace(
    /(&lt;\/?)([\w-]+)/g,
    '$1<span class="tag">$2</span>'
  );
  // Attributes
  result = result.replace(/\s([\w-]+)=/g, ' <span class="attr">$1</span>=');
  // Strings in attributes
  result = result.replace(
    /=(&quot;[^&]*&quot;)/g,
    '=<span class="str">$1</span>'
  );
  // Comments
  result = result.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="cmt">$1</span>'
  );
  return result;
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const lang = options?.language ?? "auto";
  const theme = options?.theme ?? "dark";

  let highlighted: string;
  const detectedLang = lang === "auto" ? detectLanguage(input.input) : lang;

  switch (detectedLang) {
    case "css":
      highlighted = highlightCSS(input.input);
      break;
    case "html":
      highlighted = highlightHTML(input.input);
      break;
    default:
      highlighted = highlightJS(input.input);
      break;
  }

  const bgColor = theme === "dark" ? "#1e1e1e" : "#ffffff";
  const textColor = theme === "dark" ? "#d4d4d4" : "#333333";
  const kwColor = theme === "dark" ? "#569cd6" : "#0000ff";
  const strColor = theme === "dark" ? "#ce9178" : "#a31515";
  const numColor = theme === "dark" ? "#b5cea8" : "#098658";
  const cmtColor = theme === "dark" ? "#6a9955" : "#008000";
  const tagColor = theme === "dark" ? "#569cd6" : "#800000";
  const attrColor = theme === "dark" ? "#9cdcfe" : "#ff0000";

  const output = `<pre style="background:${bgColor};color:${textColor};padding:16px;border-radius:8px;overflow-x:auto;font-family:'Fira Code',monospace;font-size:14px;line-height:1.5;"><style>.kw{color:${kwColor}}.str{color:${strColor}}.num{color:${numColor}}.cmt{color:${cmtColor};font-style:italic}.tag{color:${tagColor}}.attr{color:${attrColor}}.sel{color:${kwColor}}.prop{color:${attrColor}}.val{color:${strColor}}</style><code>${highlighted}</code></pre>`;

  return { output };
}

function detectLanguage(code: string): string {
  if (/<[a-zA-Z]/.test(code)) return "html";
  if (/[{}]\s*[a-z-]+\s*:/.test(code)) return "css";
  return "javascript";
}

export const syntaxHighlighter = defineTool({
  meta: {
    id: "code/syntax-highlighter",
    name: "Syntax Highlighter",
    description:
      "Free online syntax highlighter — convert JavaScript, TypeScript, HTML, CSS, Python, and SQL code to syntax-highlighted HTML with dark or light themes instantly in your browser. No data is stored.",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["syntax", "highlight", "color", "code", "html"],
    examples: [
      {
        title: "Highlight JavaScript",
        description: "Convert JavaScript code to syntax-highlighted HTML",
        input: "const name = 'World';\nconsole.log(`Hello ${name}`);",
        output:
          '<pre style="background:#1e1e1e;..."><code><span class="kw">const</span> name = <span class="str">\'World\'</span>;...</code></pre>',
      },
    ],
    ui: { outputRenderer: "html" },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
