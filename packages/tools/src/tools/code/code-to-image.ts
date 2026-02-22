import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Code to render as an image-like HTML block"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("HTML representation of code styled like a code screenshot"),
});

const optionsSchema = z.object({
  theme: z
    .enum(["dark", "light", "monokai"])
    .default("dark")
    .describe("Color theme"),
  title: z.string().default("").describe("Window title bar text"),
  fontSize: z
    .number()
    .int()
    .min(10)
    .max(24)
    .default(14)
    .describe("Font size in pixels"),
  padding: z
    .number()
    .int()
    .min(8)
    .max(64)
    .default(24)
    .describe("Padding in pixels"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const theme = options?.theme ?? "dark";
  const title = options?.title ?? "";
  const fontSize = options?.fontSize ?? 14;
  const padding = options?.padding ?? 24;

  const themes = {
    dark: {
      bg: "#282c34",
      text: "#abb2bf",
      border: "#21252b",
      dots: ["#ff5f56", "#ffbd2e", "#27c93f"],
    },
    light: {
      bg: "#fafafa",
      text: "#383a42",
      border: "#e8e8e8",
      dots: ["#ff5f56", "#ffbd2e", "#27c93f"],
    },
    monokai: {
      bg: "#272822",
      text: "#f8f8f2",
      border: "#1e1f1c",
      dots: ["#ff5f56", "#ffbd2e", "#27c93f"],
    },
  };

  const t = themes[theme];
  const escapedCode = escapeHtml(input.input);

  const lineNumbers = input.input
    .split("\n")
    .map(
      (_, i) =>
        `<span style="color:${theme === "light" ? "#aaa" : "#636d83"};user-select:none;">${String(i + 1).padStart(3)}</span>`
    )
    .join("\n");

  const html = `
<div style="background:${t.border};border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);max-width:720px;font-family:monospace;">
  <div style="display:flex;align-items:center;padding:12px 16px;background:${t.border};">
    <div style="display:flex;gap:8px;">
      <div style="width:12px;height:12px;border-radius:50%;background:${t.dots[0]};"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:${t.dots[1]};"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:${t.dots[2]};"></div>
    </div>
    ${title ? `<div style="flex:1;text-align:center;color:${t.text};font-size:13px;opacity:0.6;">${escapeHtml(title)}</div>` : ""}
  </div>
  <div style="display:flex;background:${t.bg};padding:${padding}px;">
    <pre style="margin:0;padding-right:16px;line-height:1.6;font-size:${fontSize}px;">${lineNumbers}</pre>
    <pre style="margin:0;color:${t.text};line-height:1.6;font-size:${fontSize}px;overflow-x:auto;flex:1;">${escapedCode}</pre>
  </div>
</div>`.trim();

  return { output: html };
}

export const codeToImage = defineTool({
  meta: {
    id: "code/code-to-image",
    name: "Code to Image",
    description:
      "Free online code to image converter — generate styled HTML code cards with dark, light, or Monokai themes instantly in your browser. No data is stored. Includes line numbers, window chrome, and customizable font size and padding.",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: [
      "code",
      "image",
      "screenshot",
      "carbon",
      "snippet",
      "share",
      "presentation",
      "card",
    ],
    examples: [
      {
        title: "Dark theme code card",
        description: "Generate a styled code screenshot with dark theme",
        input: "const greeting = 'Hello, World!';\nconsole.log(greeting);",
        output:
          '<div style="background:#21252b;border-radius:12px;..."><pre>...</pre></div>',
      },
    ],
    ui: { outputRenderer: "html" },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
