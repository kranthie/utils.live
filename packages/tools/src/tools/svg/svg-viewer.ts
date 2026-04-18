import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code to view"),
});

const outputSchema = z.object({
  output: z.string().describe("SVG rendered in HTML wrapper"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function sanitizeSvg(svg: string): string {
  // Use DOMPurify's SVG profile — a well-maintained sanitizer handles the
  // long tail of bypasses (HTML-entity-encoded javascript:, CDATA-wrapped
  // scripts, CSS url(javascript:...), nested comments, foreignObject, etc.)
  // that a regex-based allowlist cannot.
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject", "script"],
    FORBID_ATTR: ["onload", "onerror", "onclick"],
  });
}

function execute(input: Input): Output {
  const svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");
  if (!svg.includes("<svg"))
    throw new Error("Input does not appear to be valid SVG");

  // Sanitize SVG to prevent XSS
  const sanitizedSvg = sanitizeSvg(svg);

  // Extract dimensions
  const widthMatch = sanitizedSvg.match(/width="([^"]+)"/);
  const heightMatch = sanitizedSvg.match(/height="([^"]+)"/);
  const viewBoxMatch = sanitizedSvg.match(/viewBox="([^"]+)"/);

  const info: string[] = [];
  if (widthMatch) info.push(`Width: ${widthMatch[1]}`);
  if (heightMatch) info.push(`Height: ${heightMatch[1]}`);
  if (viewBoxMatch) info.push(`ViewBox: ${viewBoxMatch[1]}`);

  // Count elements
  const elementCounts: Record<string, number> = {};
  const elementRegex = /<(\w+)[\s>]/g;
  let match: RegExpExecArray | null;
  while ((match = elementRegex.exec(sanitizedSvg)) !== null) {
    const tag = match[1]!;
    if (tag !== "svg" && tag !== "xml") {
      elementCounts[tag] = (elementCounts[tag] || 0) + 1;
    }
  }

  const html = `<div style="background:#f5f5f5;padding:20px;text-align:center;">
  <div style="display:inline-block;background:white;padding:10px;border:1px solid #ddd;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    ${sanitizedSvg}
  </div>
  <div style="margin-top:10px;font-family:monospace;font-size:12px;color:#666;text-align:left;max-width:400px;margin-left:auto;margin-right:auto;">
    ${info.map((i) => `<div>${i}</div>`).join("")}
    <div>Elements: ${
      Object.entries(elementCounts)
        .map(([k, v]) => `${k}(${v})`)
        .join(", ") || "none"
    }</div>
  </div>
</div>`;

  return { output: html };
}

export const svgViewer = defineTool({
  meta: {
    id: "svg/svg-viewer",
    name: "SVG Viewer",
    description:
      "Free online SVG viewer — preview and inspect SVG graphics with dimension info and element counts instantly in your browser. No data is stored. Shows width, height, viewBox, and a breakdown of SVG elements.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "view",
      "preview",
      "inspect",
      "render",
      "display",
      "dimensions",
    ],
    examples: [
      {
        title: "Preview circle SVG with element info",
        description: "Preview a simple SVG circle with element info",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3498DB"/></svg>',
        output:
          '<div style="background:#f5f5f5;padding:20px;text-align:center;">\n  <div style="display:inline-block;background:white;padding:10px;border:1px solid #ddd;box-shadow:0 2px 4px rgba(0,0,0,0.1);">\n    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3498DB"/></svg>\n  </div>\n  <div style="margin-top:10px;font-family:monospace;font-size:12px;color:#666;text-align:left;max-width:400px;margin-left:auto;margin-right:auto;">\n    <div>Width: 100</div><div>Height: 100</div><div>ViewBox: 0 0 100 100</div>\n    <div>Elements: circle(1)</div>\n  </div>\n</div>',
      },
    ],
    ui: {
      inputLanguage: "xml",
      outputRenderer: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
