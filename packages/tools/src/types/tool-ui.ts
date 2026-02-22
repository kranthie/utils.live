/**
 * Monaco Editor supported languages for syntax highlighting.
 */
export type MonacoLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "markdown"
  | "sql"
  | "plaintext"
  | "shell"
  | "graphql"
  | "csharp"
  | "go"
  | "java"
  | "python"
  | "rust"
  | "protobuf"
  | "dockerfile";

/**
 * Output renderer types for displaying tool results.
 */
export type OutputRendererType =
  | "code" // Monaco editor (read-only)
  | "diff" // Side-by-side diff viewer
  | "json-tree" // Expandable JSON tree
  | "markdown" // Rendered markdown
  | "table" // Sortable data table
  | "html" // Sandboxed HTML preview
  | "image" // Image with zoom/pan
  | "color" // Single color swatch
  | "color-palette" // Multiple color swatches
  | "diagram"; // Mermaid diagram renderer

/**
 * UI configuration for how a tool renders in the interface.
 */
export interface ToolUIConfig {
  /**
   * Language for Monaco editor input syntax highlighting.
   * @default Inferred from category
   */
  inputLanguage: MonacoLanguage;

  /**
   * Type of output renderer to use.
   * @default Inferred from category and output type
   */
  outputRenderer: OutputRendererType;

  /**
   * Language for output when renderer is 'code'.
   * @default Same as inputLanguage
   */
  outputLanguage?: MonacoLanguage;

  /**
   * Enable file upload in input panel.
   * @default true
   */
  allowFileUpload: boolean;

  /**
   * Accepted MIME types for file upload.
   * @default ["text/*", "application/json"]
   */
  acceptedFileTypes: string[];

  /**
   * Maximum file size in bytes.
   * @default 5242880 (5MB)
   */
  maxFileSize: number;
}

/**
 * Default UI configuration values.
 */
export const DEFAULT_UI_CONFIG: ToolUIConfig = {
  inputLanguage: "plaintext",
  outputRenderer: "code",
  allowFileUpload: true,
  acceptedFileTypes: ["text/*", "application/json"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
};

/**
 * Category-based input language mappings.
 */
export const CATEGORY_INPUT_LANGUAGES: Record<string, MonacoLanguage> = {
  json: "json",
  yaml: "yaml",
  xml: "xml",
  html: "html",
  css: "css",
  javascript: "javascript",
  typescript: "typescript",
  markdown: "markdown",
  sql: "sql",
  csv: "plaintext",
  toml: "plaintext",
  encoding: "plaintext",
  text: "plaintext",
  crypto: "plaintext",
  hash: "plaintext",
  number: "plaintext",
  datetime: "plaintext",
  color: "plaintext",
  image: "plaintext",
  data: "plaintext",
  readme: "markdown",
  docs: "markdown",
  jwt: "json",
  regex: "plaintext",
  api: "json",
  code: "plaintext",
  diagram: "plaintext",
  feeds: "xml",
  communication: "plaintext",
  network: "plaintext",
  svg: "xml",
  misc: "plaintext",
  web: "html",
  validation: "plaintext",
  math: "plaintext",
  ai: "plaintext",
};

/**
 * Category-based output renderer mappings.
 */
export const CATEGORY_OUTPUT_RENDERERS: Record<string, OutputRendererType> = {
  json: "code",
  yaml: "code",
  xml: "code",
  html: "html",
  css: "code",
  javascript: "code",
  typescript: "code",
  markdown: "markdown",
  sql: "code",
  csv: "table",
  toml: "code",
  encoding: "code",
  text: "code",
  crypto: "code",
  hash: "code",
  number: "code",
  datetime: "code",
  color: "color",
  image: "image",
  data: "code",
  readme: "markdown",
  docs: "markdown",
  jwt: "code",
  regex: "code",
  api: "code",
  code: "code",
  diagram: "code",
  feeds: "code",
  communication: "code",
  network: "code",
  svg: "code",
  misc: "code",
  web: "code",
  validation: "code",
  math: "code",
  ai: "code",
};

/**
 * Tool names that should use diff renderer.
 */
export const DIFF_TOOL_PATTERNS = ["diff", "compare", "difference"];

/**
 * Tool names that should use color-palette renderer.
 */
export const COLOR_PALETTE_PATTERNS = [
  "palette",
  "scheme",
  "gradient",
  "analogous",
  "triadic",
  "shades",
  "tints",
  "complementary",
  "split-complementary",
];
