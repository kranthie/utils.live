import type { ToolMeta } from "@utils-live/tools/constants";

/**
 * Name patterns that indicate a generator/structured-input tool.
 */
export const GENERATOR_NAME_PATTERNS = [
  "generator",
  "random",
  "lorem",
  "fake",
  "dummy",
  "placeholder",
  "license-picker",
  "issue-template",
  "pr-template",
  "code-of-conduct",
  "contributing-guide",
];

/**
 * Name patterns that indicate a calculator or converter tool
 * with structured form inputs.
 */
export const CALCULATOR_NAME_PATTERNS = [
  "calculator",
  "converter",
  "date-diff",
  "time-zone",
  "unit-convert",
];

/**
 * Formatted schema type used by ToolOptions and GeneratorOptionsPanel.
 */
export interface FormattedSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "array";
      title?: string;
      description?: string;
      default?: unknown;
      enum?: unknown[];
      minimum?: number;
      maximum?: number;
    }
  >;
  required?: string[];
}

/**
 * Determines whether a tool should use form-based input instead of a code editor.
 */
export function isFormBasedTool(
  toolMeta: ToolMeta,
  inputSchema: Record<string, unknown>
): boolean {
  const properties = inputSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;

  // If the schema has a plain string `input` property, it's always a standard
  // text-editor tool — even if the name contains "converter" or "calculator".
  const inputProp = properties?.["input"];
  if (inputProp && inputProp.type === "string" && !inputProp.enum) {
    return false;
  }

  const toolSlug = toolMeta.id.split("/")[1] ?? "";
  const toolNameLower = toolMeta.name.toLowerCase();

  const matchesNamePattern = [
    ...GENERATOR_NAME_PATTERNS,
    ...CALCULATOR_NAME_PATTERNS,
  ].some(
    (pattern) => toolSlug.includes(pattern) || toolNameLower.includes(pattern)
  );

  if (matchesNamePattern) {
    return true;
  }

  if (!properties) {
    return false;
  }

  const propKeys = Object.keys(properties);
  if (propKeys.length === 0) {
    return false;
  }

  const required = (inputSchema.required as string[]) ?? [];
  const allHaveDefaults = propKeys.every((key) => {
    const prop = properties[key];
    return prop?.default !== undefined || !required.includes(key);
  });

  return allHaveDefaults;
}

/**
 * Get file extension for a given language identifier.
 */
export function getFileExtension(lang: string): string {
  const extensions: Record<string, string> = {
    json: ".json",
    yaml: ".yaml",
    xml: ".xml",
    html: ".html",
    css: ".css",
    javascript: ".js",
    typescript: ".ts",
    markdown: ".md",
    sql: ".sql",
    plaintext: ".txt",
  };
  return extensions[lang] ?? ".txt";
}

/**
 * Returns appropriate sample data based on the tool's input language/category.
 */
export function getSampleData(language?: string, category?: string): string {
  if (language === "json" || category === "json") {
    return '{"name":"John Doe","age":30,"email":"john@example.com","active":true,"tags":["developer","designer"]}';
  }
  if (language === "yaml" || category === "yaml") {
    return "name: John Doe\nage: 30\nemail: john@example.com\nactive: true\ntags:\n  - developer\n  - designer";
  }
  if (language === "xml" || category === "xml") {
    return '<?xml version="1.0"?>\n<user>\n  <name>John Doe</name>\n  <age>30</age>\n  <email>john@example.com</email>\n</user>';
  }
  if (language === "html" || category === "html") {
    return "<!DOCTYPE html>\n<html>\n<head><title>Hello</title></head>\n<body>\n  <h1>Hello World</h1>\n  <p>This is a sample HTML document.</p>\n</body>\n</html>";
  }
  if (language === "css" || category === "css") {
    return "body {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: #f5f5f5;\n  color: #333;\n}";
  }
  if (language === "sql" || category === "sql") {
    return "SELECT u.name, u.email, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = true\nGROUP BY u.name, u.email\nORDER BY order_count DESC;";
  }
  if (language === "markdown" || category === "markdown") {
    return "# Hello World\n\nThis is a **sample** markdown document.\n\n- Item 1\n- Item 2\n- Item 3\n\n```js\nconsole.log('hello');\n```";
  }
  if (
    language === "javascript" ||
    language === "typescript" ||
    category === "code"
  ) {
    return "function greet(name) {\n  const message = `Hello, ${name}!`;\n  console.log(message);\n  return message;\n}";
  }
  if (category === "csv") {
    return "name,age,email,city\nJohn Doe,30,john@example.com,New York\nJane Smith,25,jane@example.com,London\nBob Wilson,35,bob@example.com,Paris";
  }
  if (category === "toml") {
    return '[server]\nhost = "localhost"\nport = 8080\n\n[database]\nurl = "postgres://localhost/mydb"\npool_size = 5';
  }
  if (category === "encoding") {
    return "Hello, World! This is sample text for encoding.";
  }
  if (category === "crypto") {
    return "Hello, World! This is sample text for hashing.";
  }
  if (category === "regex") {
    return "test@example.com\n192.168.1.1\nhttps://example.com\n+1-555-0123";
  }
  return "Hello, World! This is sample input text.";
}

/**
 * Determine tool type based on metadata and input schema.
 */
export type ToolVariant = "standard" | "diff" | "generator";

export function getToolVariant(
  tool: ToolMeta,
  inputSchema: Record<string, unknown>,
  diffPatterns: string[]
): ToolVariant {
  const toolName = tool.name.toLowerCase();
  const toolId = tool.id.toLowerCase();
  const isDiff = diffPatterns.some(
    (pattern) => toolName.includes(pattern) || toolId.includes(pattern)
  );

  if (isDiff) return "diff";

  // Detect dual-input tools by schema shape (e.g., merge tools with input1/input2)
  const props = inputSchema.properties as Record<string, unknown> | undefined;
  if (props && "input1" in props && "input2" in props) return "diff";

  if (isFormBasedTool(tool, inputSchema)) return "generator";
  return "standard";
}
