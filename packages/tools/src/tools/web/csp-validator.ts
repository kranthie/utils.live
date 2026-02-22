import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Content Security Policy header string to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  valid: z.boolean().describe("Whether the CSP is valid"),
  errors: z.array(z.string()).describe("Validation errors"),
  warnings: z.array(z.string()).describe("Security warnings"),
  directives: z.number().describe("Number of directives found"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const KNOWN_DIRECTIVES = new Set([
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "media-src",
  "object-src",
  "frame-src",
  "child-src",
  "worker-src",
  "form-action",
  "frame-ancestors",
  "base-uri",
  "plugin-types",
  "sandbox",
  "report-uri",
  "report-to",
  "upgrade-insecure-requests",
  "block-all-mixed-content",
  "require-sri-for",
  "navigate-to",
  "prefetch-src",
  "script-src-elem",
  "script-src-attr",
  "style-src-elem",
  "style-src-attr",
]);

function execute(input: Input): Output {
  let raw = input.input.trim();
  if (!raw) {
    throw new Error("Input cannot be empty");
  }

  // Strip header name prefix if present
  raw = raw.replace(/^Content-Security-Policy:\s*/i, "");

  const errors: string[] = [];
  const warnings: string[] = [];

  const dirParts = raw
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);
  const seenDirectives = new Set<string>();

  for (const part of dirParts) {
    const tokens = part.split(/\s+/);
    const directive = tokens[0]!.toLowerCase();
    const values = tokens.slice(1);

    // Check for known directive
    if (!KNOWN_DIRECTIVES.has(directive)) {
      errors.push(`Unknown directive: "${directive}"`);
      continue;
    }

    // Check for duplicates
    if (seenDirectives.has(directive)) {
      errors.push(`Duplicate directive: "${directive}"`);
    }
    seenDirectives.add(directive);

    // Check for unsafe values
    if (values.includes("'unsafe-inline'")) {
      if (directive === "script-src" || directive === "default-src") {
        warnings.push(`"${directive}" allows 'unsafe-inline' - XSS risk`);
      }
    }

    if (values.includes("'unsafe-eval'")) {
      warnings.push(
        `"${directive}" allows 'unsafe-eval' - code injection risk`
      );
    }

    if (values.includes("*")) {
      warnings.push(`"${directive}" uses wildcard (*) - allows any source`);
    }

    if (values.some((v) => v.startsWith("http://"))) {
      warnings.push(`"${directive}" allows HTTP sources - use HTTPS instead`);
    }
  }

  // Check for important missing directives
  if (!seenDirectives.has("default-src")) {
    warnings.push(
      "Missing 'default-src' - recommended as fallback for all directives"
    );
  }

  if (!seenDirectives.has("object-src") && !seenDirectives.has("default-src")) {
    warnings.push("Missing 'object-src' - Flash/plugin exploits possible");
  }

  if (!seenDirectives.has("frame-ancestors")) {
    warnings.push(
      "Missing 'frame-ancestors' - clickjacking protection not set"
    );
  }

  const valid = errors.length === 0;
  const parts: string[] = [];

  if (valid && warnings.length === 0) {
    parts.push("CSP is valid with no warnings!");
  } else if (valid) {
    parts.push(`CSP is valid but has ${warnings.length} warning(s)`);
  } else {
    parts.push(`Found ${errors.length} error(s)`);
  }

  parts.push(`\nDirectives found: ${seenDirectives.size}`);

  if (errors.length > 0) {
    parts.push("\nErrors:");
    parts.push(...errors.map((e) => `  - ${e}`));
  }
  if (warnings.length > 0) {
    parts.push("\nWarnings:");
    parts.push(...warnings.map((w) => `  - ${w}`));
  }

  return {
    output: parts.join("\n"),
    valid,
    errors,
    warnings,
    directives: seenDirectives.size,
  };
}

export const cspValidator = defineTool({
  meta: {
    id: "web/csp-validator",
    name: "CSP Validator",
    description:
      "Free online CSP validator — check Content Security Policy headers for syntax errors and security warnings instantly in your browser. No data is stored. Detects unsafe-inline, wildcard sources, duplicate directives, and missing recommended policies.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "csp",
      "validate",
      "security",
      "content security policy",
      "check",
      "syntax",
      "unsafe-inline",
      "wildcard",
      "directive",
      "xss",
      "audit",
    ],
    examples: [
      {
        title: "Validate CSP header with unsafe-inline warning",
        description:
          "Check a Content Security Policy for errors — detects unsafe-inline in script-src and wildcard in img-src",
        input:
          "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src *",
        output:
          "CSP is valid but has 3 warning(s)\n\nDirectives found: 3\n\nWarnings:\n  - \"script-src\" allows 'unsafe-inline' - XSS risk\n  - \"img-src\" uses wildcard (*) - allows any source\n  - Missing 'frame-ancestors' - clickjacking protection not set",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
