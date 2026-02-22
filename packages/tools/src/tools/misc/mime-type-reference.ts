import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z.string().optional().describe("Filter by extension or MIME type"),
  category: z
    .enum(["all", "text", "image", "audio", "video", "application", "font"])
    .default("all")
    .describe("Category filter"),
});
const outputSchema = z.object({
  output: z.string().describe("MIME types reference"),
});

const TYPES: Array<[string, string, string]> = [
  [".html", "text/html", "HTML document"],
  [".css", "text/css", "CSS stylesheet"],
  [".js", "application/javascript", "JavaScript"],
  [".json", "application/json", "JSON"],
  [".xml", "application/xml", "XML"],
  [".txt", "text/plain", "Plain text"],
  [".csv", "text/csv", "CSV"],
  [".md", "text/markdown", "Markdown"],
  [".yaml", "application/x-yaml", "YAML"],
  [".pdf", "application/pdf", "PDF"],
  [".zip", "application/zip", "ZIP archive"],
  [".gz", "application/gzip", "Gzip"],
  [".tar", "application/x-tar", "Tar archive"],
  [".png", "image/png", "PNG image"],
  [".jpg", "image/jpeg", "JPEG image"],
  [".gif", "image/gif", "GIF image"],
  [".svg", "image/svg+xml", "SVG"],
  [".webp", "image/webp", "WebP image"],
  [".ico", "image/x-icon", "Icon"],
  [".avif", "image/avif", "AVIF image"],
  [".bmp", "image/bmp", "Bitmap"],
  [".mp3", "audio/mpeg", "MP3 audio"],
  [".wav", "audio/wav", "WAV audio"],
  [".ogg", "audio/ogg", "OGG audio"],
  [".mp4", "video/mp4", "MP4 video"],
  [".webm", "video/webm", "WebM video"],
  [".avi", "video/x-msvideo", "AVI video"],
  [".mov", "video/quicktime", "QuickTime"],
  [".woff", "font/woff", "WOFF font"],
  [".woff2", "font/woff2", "WOFF2 font"],
  [".ttf", "font/ttf", "TrueType font"],
  [".otf", "font/otf", "OpenType font"],
  [".doc", "application/msword", "MS Word"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Word OOXML",
  ],
  [".xls", "application/vnd.ms-excel", "MS Excel"],
  [
    ".xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Excel OOXML",
  ],
  [".ppt", "application/vnd.ms-powerpoint", "MS PowerPoint"],
  [
    ".pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "PowerPoint OOXML",
  ],
  [".ts", "application/typescript", "TypeScript"],
  [".py", "text/x-python", "Python"],
  [".go", "text/x-go", "Go"],
  [".rs", "text/x-rust", "Rust"],
  [".java", "text/x-java", "Java"],
  [".rb", "text/x-ruby", "Ruby"],
  [".php", "application/x-httpd-php", "PHP"],
  [".sql", "application/sql", "SQL"],
  [".wasm", "application/wasm", "WebAssembly"],
  [".sh", "application/x-sh", "Shell script"],
  [".eml", "message/rfc822", "Email"],
  [".ics", "text/calendar", "iCalendar"],
];

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let filtered = TYPES;
  if (input.category && input.category !== "all") {
    filtered = filtered.filter(([, mime]) => mime.startsWith(input.category));
  }
  if (input.filter) {
    const q = input.filter.toLowerCase();
    filtered = filtered.filter(
      ([ext, mime, desc]) =>
        ext.includes(q) || mime.includes(q) || desc.toLowerCase().includes(q)
    );
  }
  const lines = filtered.map(
    ([ext, mime, desc]) => `${ext.padEnd(8)} ${mime.padEnd(55)} ${desc}`
  );
  const header = `${"Ext".padEnd(8)} ${"MIME Type".padEnd(55)} Description`;
  return {
    output:
      [header, "-".repeat(90), ...lines].join("\n") ||
      "No matching MIME types found.",
  };
}

export const mimeTypeReference = defineTool({
  meta: {
    id: "misc/mime-type-reference",
    name: "MIME Type Reference",
    description:
      "Free online MIME type reference — look up file extensions and their content types instantly in your browser. No data is stored. Covers 50+ common types across text, image, audio, video, application, and font categories.",
    category: "misc",
    subgroup: "Reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "mime",
      "type",
      "reference",
      "content",
      "media",
      "extension",
      "content-type",
      "http",
    ],
    examples: [
      {
        title: "Browse all image MIME types",
        description:
          "Filter by image category to see PNG, JPEG, WebP, AVIF, and more",
        input: { category: "image" },
        output:
          "Ext      MIME Type                                               Description\n------------------------------------------------------------------------------------------\n.png     image/png                                               PNG image\n.jpg     image/jpeg                                              JPEG image\n.gif     image/gif                                               GIF image\n.svg     image/svg+xml                                           SVG\n.webp    image/webp                                              WebP image\n.ico     image/x-icon                                            Icon\n.avif    image/avif                                              AVIF image\n.bmp     image/bmp                                               Bitmap",
      },
      {
        title: "Find the JSON content type",
        description: "Search for JSON to get its MIME type and file extension",
        input: { filter: "json", category: "all" },
        output:
          "Ext      MIME Type                                               Description\n------------------------------------------------------------------------------------------\n.json    application/json                                        JSON",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
