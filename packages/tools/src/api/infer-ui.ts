import type {
  ToolMeta,
  ToolUIConfig,
  MonacoLanguage,
  OutputRendererType,
} from "../types";
import {
  DEFAULT_UI_CONFIG,
  CATEGORY_INPUT_LANGUAGES,
  CATEGORY_OUTPUT_RENDERERS,
  DIFF_TOOL_PATTERNS,
  COLOR_PALETTE_PATTERNS,
} from "../types";

/**
 * Infer UI configuration for a tool based on its metadata.
 *
 * Uses category-based defaults with special handling for:
 * - Diff/compare tools → diff renderer
 * - Color palette/scheme tools → color-palette renderer
 * - Explicit UI config takes precedence
 *
 * @param meta - Tool metadata
 * @returns Inferred or explicit ToolUIConfig
 */
export function inferUIConfig(meta: ToolMeta): ToolUIConfig {
  // If tool has explicit UI config, use it
  if (meta.ui) {
    return {
      ...DEFAULT_UI_CONFIG,
      ...meta.ui,
    };
  }

  const category = meta.category.toLowerCase();
  const toolName = meta.name.toLowerCase();
  const toolId = meta.id.toLowerCase();

  // Infer input language from category
  const inputLanguage: MonacoLanguage =
    CATEGORY_INPUT_LANGUAGES[category] ?? DEFAULT_UI_CONFIG.inputLanguage;

  // Infer output renderer
  let outputRenderer: OutputRendererType =
    CATEGORY_OUTPUT_RENDERERS[category] ?? DEFAULT_UI_CONFIG.outputRenderer;

  // Special case: diff tools
  if (
    DIFF_TOOL_PATTERNS.some(
      (pattern) => toolName.includes(pattern) || toolId.includes(pattern)
    )
  ) {
    outputRenderer = "diff";
  }

  // Special case: color palette tools
  if (
    category === "color" &&
    COLOR_PALETTE_PATTERNS.some(
      (pattern) => toolName.includes(pattern) || toolId.includes(pattern)
    )
  ) {
    outputRenderer = "color-palette";
  }

  // Infer file upload settings based on category
  const acceptedFileTypes = getAcceptedFileTypes(category);
  const maxFileSize = getMaxFileSize(category);

  // Build the base config
  const config: ToolUIConfig = {
    inputLanguage,
    outputRenderer,
    allowFileUpload: true,
    acceptedFileTypes,
    maxFileSize,
  };

  // Determine output language for code renderer
  if (outputRenderer === "code") {
    // Check if tool is a converter (e.g., json-to-yaml)
    const toMatch = toolId.match(/to-(\w+)/);
    if (toMatch && toMatch[1]) {
      const targetFormat = toMatch[1];
      const targetLang = CATEGORY_INPUT_LANGUAGES[targetFormat];
      config.outputLanguage = targetLang ?? inputLanguage;
    } else {
      config.outputLanguage = inputLanguage;
    }
  }

  return config;
}

/**
 * Get accepted file types based on category.
 */
function getAcceptedFileTypes(category: string): string[] {
  switch (category) {
    case "json":
      return ["application/json", ".json"];
    case "yaml":
      return ["application/x-yaml", "text/yaml", ".yaml", ".yml"];
    case "xml":
      return ["application/xml", "text/xml", ".xml"];
    case "html":
      return ["text/html", ".html", ".htm"];
    case "css":
      return ["text/css", ".css"];
    case "javascript":
      return ["application/javascript", "text/javascript", ".js", ".mjs"];
    case "typescript":
      return ["application/typescript", ".ts", ".tsx"];
    case "markdown":
    case "readme":
    case "docs":
      return ["text/markdown", ".md", ".markdown"];
    case "csv":
      return ["text/csv", ".csv"];
    case "image":
      return [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
    default:
      return ["text/*", "application/json"];
  }
}

/**
 * Get max file size based on category.
 */
function getMaxFileSize(category: string): number {
  switch (category) {
    case "image":
      return 10 * 1024 * 1024; // 10MB for images
    default:
      return 5 * 1024 * 1024; // 5MB default
  }
}

/**
 * Merge explicit UI config with inferred defaults.
 *
 * @param meta - Tool metadata with optional UI config
 * @returns Complete ToolUIConfig
 */
export function getToolUIConfig(meta: ToolMeta): ToolUIConfig {
  const inferred = inferUIConfig(meta);

  if (!meta.ui) {
    return inferred;
  }

  // Merge explicit config over inferred
  return {
    ...inferred,
    ...meta.ui,
  };
}
