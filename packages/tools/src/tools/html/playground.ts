import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("HTML content (can include <style> and <script> tags)"),
});

const outputSchema = z.object({
  output: z.string().describe("Combined HTML/CSS/JS output for rendering"),
});

const optionsSchema = z.object({
  css: z.string().default("").describe("Additional CSS to include"),
  js: z.string().default("").describe("Additional JavaScript to include"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const additionalCss = options?.css ?? "";
  const additionalJs = options?.js ?? "";

  let html = raw.trim();

  // If it's already a full HTML document, inject additional CSS/JS
  if (/<html\b/i.test(html)) {
    if (additionalCss) {
      const styleTag = `<style>${additionalCss}</style>`;
      if (/<\/head>/i.test(html)) {
        html = html.replace(/<\/head>/i, `${styleTag}</head>`);
      } else {
        html = styleTag + html;
      }
    }
    if (additionalJs) {
      const scriptTag = `<script>${additionalJs}</script>`;
      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
      } else {
        html = html + scriptTag;
      }
    }
    return { output: html };
  }

  // Build a complete HTML document
  const parts: string[] = [];
  parts.push("<!DOCTYPE html>");
  parts.push("<html>");
  parts.push("<head>");
  parts.push('<meta charset="UTF-8">');
  parts.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
  );

  // Extract existing style tags from input
  const styleMatches = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || [];
  for (const style of styleMatches) {
    parts.push(style);
  }

  if (additionalCss) {
    parts.push(`<style>${additionalCss}</style>`);
  }

  parts.push("</head>");
  parts.push("<body>");

  // Remove extracted style/script tags from body content
  let bodyContent = html;
  bodyContent = bodyContent.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Extract existing script tags
  const scriptMatches = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
  bodyContent = bodyContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  parts.push(bodyContent.trim());

  // Add scripts at the end
  for (const script of scriptMatches) {
    parts.push(script);
  }

  if (additionalJs) {
    parts.push(`<script>${additionalJs}</script>`);
  }

  parts.push("</body>");
  parts.push("</html>");

  return { output: parts.join("\n") };
}

export const htmlPlayground = defineTool({
  meta: {
    id: "html/playground",
    name: "HTML Playground",
    description:
      "Free online HTML playground — write HTML, CSS, and JavaScript with live preview instantly in your browser. No data is stored. Wraps fragments into full documents, extracts style/script tags, and supports additional CSS and JS injection.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "css",
      "javascript",
      "playground",
      "live preview",
      "editor",
      "codepen",
      "jsfiddle",
      "sandbox",
    ],
    examples: [
      {
        title: "Styled card component",
        description:
          "Preview an HTML fragment with inline styles as a full document",
        input:
          '<style>body{font-family:sans-serif;display:flex;justify-content:center;padding:2rem}.card{border:1px solid #ddd;border-radius:8px;padding:1.5rem;max-width:300px}</style>\n<div class="card">\n  <h2>Welcome</h2>\n  <p>This is a card component preview.</p>\n</div>',
        output:
          '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<style>body{font-family:sans-serif;display:flex;justify-content:center;padding:2rem}.card{border:1px solid #ddd;border-radius:8px;padding:1.5rem;max-width:300px}</style>\n</head>\n<body>\n<div class="card">\n  <h2>Welcome</h2>\n  <p>This is a card component preview.</p>\n</div>\n</body>\n</html>',
      },
    ],
    ui: {
      inputLanguage: "html",
      outputRenderer: "html",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
