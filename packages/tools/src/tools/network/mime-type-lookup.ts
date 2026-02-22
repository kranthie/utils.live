import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("File extension or MIME type to look up"),
});

const outputSchema = z.object({
  output: z.string().describe("MIME type information as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const MIME_DB: Record<
  string,
  { mime: string; description: string; category: string }
> = {
  html: { mime: "text/html", description: "HTML document", category: "text" },
  htm: { mime: "text/html", description: "HTML document", category: "text" },
  css: {
    mime: "text/css",
    description: "Cascading Style Sheet",
    category: "text",
  },
  js: {
    mime: "application/javascript",
    description: "JavaScript",
    category: "application",
  },
  mjs: {
    mime: "application/javascript",
    description: "JavaScript module",
    category: "application",
  },
  json: {
    mime: "application/json",
    description: "JSON data",
    category: "application",
  },
  xml: {
    mime: "application/xml",
    description: "XML document",
    category: "application",
  },
  txt: { mime: "text/plain", description: "Plain text", category: "text" },
  csv: {
    mime: "text/csv",
    description: "Comma-separated values",
    category: "text",
  },
  tsv: {
    mime: "text/tab-separated-values",
    description: "Tab-separated values",
    category: "text",
  },
  md: { mime: "text/markdown", description: "Markdown", category: "text" },
  yaml: {
    mime: "application/x-yaml",
    description: "YAML",
    category: "application",
  },
  yml: {
    mime: "application/x-yaml",
    description: "YAML",
    category: "application",
  },
  toml: {
    mime: "application/toml",
    description: "TOML",
    category: "application",
  },
  pdf: {
    mime: "application/pdf",
    description: "PDF document",
    category: "application",
  },
  doc: {
    mime: "application/msword",
    description: "Microsoft Word",
    category: "application",
  },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Microsoft Word (OOXML)",
    category: "application",
  },
  xls: {
    mime: "application/vnd.ms-excel",
    description: "Microsoft Excel",
    category: "application",
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Microsoft Excel (OOXML)",
    category: "application",
  },
  ppt: {
    mime: "application/vnd.ms-powerpoint",
    description: "Microsoft PowerPoint",
    category: "application",
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    description: "Microsoft PowerPoint (OOXML)",
    category: "application",
  },
  png: { mime: "image/png", description: "PNG image", category: "image" },
  jpg: { mime: "image/jpeg", description: "JPEG image", category: "image" },
  jpeg: { mime: "image/jpeg", description: "JPEG image", category: "image" },
  gif: { mime: "image/gif", description: "GIF image", category: "image" },
  svg: { mime: "image/svg+xml", description: "SVG image", category: "image" },
  webp: { mime: "image/webp", description: "WebP image", category: "image" },
  avif: { mime: "image/avif", description: "AVIF image", category: "image" },
  ico: { mime: "image/x-icon", description: "Icon", category: "image" },
  bmp: { mime: "image/bmp", description: "Bitmap image", category: "image" },
  tiff: { mime: "image/tiff", description: "TIFF image", category: "image" },
  tif: { mime: "image/tiff", description: "TIFF image", category: "image" },
  mp3: { mime: "audio/mpeg", description: "MP3 audio", category: "audio" },
  wav: { mime: "audio/wav", description: "WAV audio", category: "audio" },
  ogg: { mime: "audio/ogg", description: "OGG audio", category: "audio" },
  flac: { mime: "audio/flac", description: "FLAC audio", category: "audio" },
  aac: { mime: "audio/aac", description: "AAC audio", category: "audio" },
  m4a: { mime: "audio/mp4", description: "M4A audio", category: "audio" },
  wma: { mime: "audio/x-ms-wma", description: "WMA audio", category: "audio" },
  mp4: { mime: "video/mp4", description: "MP4 video", category: "video" },
  webm: { mime: "video/webm", description: "WebM video", category: "video" },
  avi: { mime: "video/x-msvideo", description: "AVI video", category: "video" },
  mov: {
    mime: "video/quicktime",
    description: "QuickTime video",
    category: "video",
  },
  mkv: {
    mime: "video/x-matroska",
    description: "Matroska video",
    category: "video",
  },
  wmv: { mime: "video/x-ms-wmv", description: "WMV video", category: "video" },
  flv: { mime: "video/x-flv", description: "Flash video", category: "video" },
  zip: {
    mime: "application/zip",
    description: "ZIP archive",
    category: "archive",
  },
  gz: {
    mime: "application/gzip",
    description: "Gzip archive",
    category: "archive",
  },
  tar: {
    mime: "application/x-tar",
    description: "Tar archive",
    category: "archive",
  },
  "7z": {
    mime: "application/x-7z-compressed",
    description: "7-Zip archive",
    category: "archive",
  },
  rar: {
    mime: "application/vnd.rar",
    description: "RAR archive",
    category: "archive",
  },
  bz2: {
    mime: "application/x-bzip2",
    description: "Bzip2 archive",
    category: "archive",
  },
  woff: { mime: "font/woff", description: "WOFF font", category: "font" },
  woff2: { mime: "font/woff2", description: "WOFF2 font", category: "font" },
  ttf: { mime: "font/ttf", description: "TrueType font", category: "font" },
  otf: { mime: "font/otf", description: "OpenType font", category: "font" },
  eot: {
    mime: "application/vnd.ms-fontobject",
    description: "EOT font",
    category: "font",
  },
  ts: {
    mime: "application/typescript",
    description: "TypeScript",
    category: "application",
  },
  tsx: {
    mime: "application/typescript",
    description: "TypeScript JSX",
    category: "application",
  },
  jsx: {
    mime: "application/javascript",
    description: "JavaScript JSX",
    category: "application",
  },
  py: { mime: "text/x-python", description: "Python script", category: "text" },
  rb: { mime: "text/x-ruby", description: "Ruby script", category: "text" },
  go: { mime: "text/x-go", description: "Go source", category: "text" },
  rs: { mime: "text/x-rust", description: "Rust source", category: "text" },
  java: { mime: "text/x-java", description: "Java source", category: "text" },
  php: {
    mime: "application/x-httpd-php",
    description: "PHP script",
    category: "application",
  },
  c: { mime: "text/x-c", description: "C source", category: "text" },
  cpp: { mime: "text/x-c++src", description: "C++ source", category: "text" },
  h: { mime: "text/x-c", description: "C header", category: "text" },
  sh: {
    mime: "application/x-sh",
    description: "Shell script",
    category: "application",
  },
  sql: { mime: "application/sql", description: "SQL", category: "application" },
  wasm: {
    mime: "application/wasm",
    description: "WebAssembly",
    category: "application",
  },
  proto: {
    mime: "text/x-protobuf",
    description: "Protocol Buffers",
    category: "text",
  },
  graphql: {
    mime: "application/graphql",
    description: "GraphQL",
    category: "application",
  },
  rss: {
    mime: "application/rss+xml",
    description: "RSS feed",
    category: "application",
  },
  atom: {
    mime: "application/atom+xml",
    description: "Atom feed",
    category: "application",
  },
  ics: { mime: "text/calendar", description: "iCalendar", category: "text" },
  vcf: { mime: "text/vcard", description: "vCard", category: "text" },
  eml: {
    mime: "message/rfc822",
    description: "Email message",
    category: "message",
  },
};

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const query = input.input.trim().toLowerCase().replace(/^\./, "");

  // Check if query is an extension
  if (MIME_DB[query]) {
    const entry = MIME_DB[query];
    return {
      output: JSON.stringify(
        {
          extension: query,
          mimeType: entry.mime,
          description: entry.description,
          category: entry.category,
        },
        null,
        2
      ),
    };
  }

  // Check if query is a MIME type
  const matchingExts = Object.entries(MIME_DB)
    .filter(([, entry]) => entry.mime.toLowerCase() === query)
    .map(([ext, entry]) => ({
      extension: ext,
      mimeType: entry.mime,
      description: entry.description,
      category: entry.category,
    }));

  if (matchingExts.length > 0) {
    return { output: JSON.stringify(matchingExts, null, 2) };
  }

  // Partial match
  const partialExts = Object.entries(MIME_DB)
    .filter(
      ([ext, entry]) =>
        ext.includes(query) ||
        entry.mime.includes(query) ||
        entry.description.toLowerCase().includes(query)
    )
    .map(([ext, entry]) => ({
      extension: ext,
      mimeType: entry.mime,
      description: entry.description,
      category: entry.category,
    }));

  if (partialExts.length > 0) {
    return { output: JSON.stringify(partialExts, null, 2) };
  }

  throw new Error(`No MIME type found for '${input.input.trim()}'`);
}

export const mimeTypeLookup = defineTool({
  meta: {
    id: "network/mime-type-lookup",
    name: "MIME Type Lookup",
    description:
      "Free online MIME type lookup — enter a file extension or MIME type string and get the matching type, description, and category instantly in your browser. No data is stored. Covers 80+ common extensions including media, code, fonts, and archives.",
    category: "network",
    subgroup: "MIME Types",
    tier: ToolTier.CLIENT,
    keywords: [
      "mime",
      "type",
      "extension",
      "content",
      "media",
      "file",
      "content-type",
      "lookup",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Look up MIME type for .json files",
        description:
          "Find the MIME type, description, and category for JSON file extension",
        input: "json",
        output:
          '{"output":"{\\n  \\"extension\\": \\"json\\",\\n  \\"mimeType\\": \\"application/json\\",\\n  \\"description\\": \\"JSON data\\",\\n  \\"category\\": \\"application\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
