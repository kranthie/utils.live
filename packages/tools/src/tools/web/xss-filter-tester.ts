import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Input string to test for XSS patterns"),
});

const outputSchema = z.object({
  output: z.string().describe("XSS analysis result"),
  safe: z.boolean().describe("Whether the input appears safe"),
  threats: z.array(z.string()).describe("Detected XSS patterns"),
  sanitized: z.string().describe("Sanitized version of the input"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface XssPattern {
  name: string;
  pattern: RegExp;
  severity: "high" | "medium" | "low";
  description: string;
}

const XSS_PATTERNS: XssPattern[] = [
  {
    name: "Script tag",
    pattern: /<script\b[^>]*>/i,
    severity: "high",
    description: "Inline script execution",
  },
  {
    name: "Event handler",
    pattern: /\bon\w+\s*=/i,
    severity: "high",
    description: "Event handler attribute (onclick, onerror, etc.)",
  },
  {
    name: "JavaScript URI",
    pattern: /javascript\s*:/i,
    severity: "high",
    description: "JavaScript protocol in URL",
  },
  {
    name: "Data URI",
    pattern: /data\s*:[^,]*;base64/i,
    severity: "medium",
    description: "Base64 data URI potentially containing scripts",
  },
  {
    name: "VBScript URI",
    pattern: /vbscript\s*:/i,
    severity: "high",
    description: "VBScript protocol",
  },
  {
    name: "Expression()",
    pattern: /expression\s*\(/i,
    severity: "high",
    description: "CSS expression (IE)",
  },
  {
    name: "eval()",
    pattern: /eval\s*\(/i,
    severity: "high",
    description: "JavaScript eval function",
  },
  {
    name: "document.cookie",
    pattern: /document\s*\.\s*cookie/i,
    severity: "high",
    description: "Cookie access attempt",
  },
  {
    name: "document.write",
    pattern: /document\s*\.\s*write/i,
    severity: "medium",
    description: "DOM manipulation",
  },
  {
    name: "innerHTML",
    pattern: /\.innerHTML\s*=/i,
    severity: "medium",
    description: "innerHTML assignment",
  },
  {
    name: "iframe",
    pattern: /<iframe\b/i,
    severity: "medium",
    description: "Iframe injection",
  },
  {
    name: "object/embed",
    pattern: /<(?:object|embed)\b/i,
    severity: "medium",
    description: "Plugin injection",
  },
  {
    name: "SVG onload",
    pattern: /<svg\b[^>]*\bon\w+/i,
    severity: "high",
    description: "SVG with event handler",
  },
  {
    name: "img onerror",
    pattern: /<img\b[^>]*onerror/i,
    severity: "high",
    description: "Image error event handler",
  },
  {
    name: "form action",
    pattern: /<form\b[^>]*action\s*=\s*["']?javascript/i,
    severity: "high",
    description: "Form with JavaScript action",
  },
  {
    name: "Encoded script",
    pattern: /&#(?:x0*6a|0*106);|%3[cC]script/i,
    severity: "medium",
    description: "Encoded script characters",
  },
  {
    name: "String.fromCharCode",
    pattern: /String\s*\.\s*fromCharCode/i,
    severity: "medium",
    description: "Character code obfuscation",
  },
  {
    name: "alert/prompt/confirm",
    pattern: /(?:alert|prompt|confirm)\s*\(/i,
    severity: "low",
    description: "Dialog function call",
  },
];

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const threats: string[] = [];
  const details: string[] = [];

  for (const pattern of XSS_PATTERNS) {
    if (pattern.pattern.test(raw)) {
      const match = raw.match(pattern.pattern);
      threats.push(
        `[${pattern.severity.toUpperCase()}] ${pattern.name}: ${pattern.description}`
      );
      details.push(`  Pattern: ${pattern.name} (${pattern.severity})`);
      details.push(`  Match: "${match?.[0]}"`);
      details.push(`  Risk: ${pattern.description}`);
      details.push("");
    }
  }

  // Create sanitized version
  let sanitized = raw;
  sanitized = sanitized.replace(/</g, "&lt;");
  sanitized = sanitized.replace(/>/g, "&gt;");
  sanitized = sanitized.replace(/"/g, "&quot;");
  sanitized = sanitized.replace(/'/g, "&#39;");
  sanitized = sanitized.replace(/javascript\s*:/gi, "");
  sanitized = sanitized.replace(/\bon\w+\s*=/gi, "");

  const safe = threats.length === 0;

  const output = [
    safe
      ? "No XSS patterns detected - input appears safe."
      : `Detected ${threats.length} potential XSS threat(s)!`,
    "",
    ...(threats.length > 0 ? ["Threats found:", ...details] : []),
    "Sanitized output:",
    sanitized,
  ].join("\n");

  return { output, safe, threats, sanitized };
}

export const xssFilterTester = defineTool({
  meta: {
    id: "web/xss-filter-tester",
    name: "XSS Filter Tester",
    description:
      "Free online XSS filter tester — detect cross-site scripting patterns in input strings with severity ratings and sanitized output instantly in your browser. No data is stored. Tests for script tags, event handlers, JavaScript URIs, and 15+ attack patterns.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "xss",
      "cross-site scripting",
      "security",
      "filter",
      "sanitize",
      "test",
      "payload",
      "attack",
      "owasp",
      "injection",
      "vulnerability",
      "event-handler",
      "onerror",
    ],
    examples: [
      {
        title: "Test image onerror XSS payload",
        description:
          "Check an img tag with onerror event handler for XSS attack patterns",
        input: "<img src=x onerror=alert('XSS')>",
        output:
          'Detected 3 potential XSS threat(s)!\n\nThreats found:\n  Pattern: Event handler (high)\n  Match: "onerror="\n  Risk: Event handler attribute (onclick, onerror, etc.)\n\n  Pattern: img onerror (high)\n  Match: "<img src=x onerror"\n  Risk: Image error event handler\n\n  Pattern: alert/prompt/confirm (low)\n  Match: "alert("\n  Risk: Dialog function call\n\nSanitized output:\n&lt;img src=x alert(&#39;XSS&#39;)&gt;',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
