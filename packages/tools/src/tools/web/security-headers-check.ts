import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("HTTP response headers (paste from browser dev tools or curl)"),
});

const outputSchema = z.object({
  output: z.string().describe("Security headers analysis"),
  score: z.number().describe("Security score (0-100)"),
  present: z.array(z.string()).describe("Present security headers"),
  missing: z.array(z.string()).describe("Missing security headers"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface HeaderCheck {
  name: string;
  required: boolean;
  weight: number;
  description: string;
  goodValues?: string[];
  badValues?: string[];
}

const SECURITY_HEADERS: HeaderCheck[] = [
  {
    name: "content-security-policy",
    required: true,
    weight: 20,
    description: "Prevents XSS and data injection attacks",
  },
  {
    name: "strict-transport-security",
    required: true,
    weight: 15,
    description: "Forces HTTPS connections",
  },
  {
    name: "x-content-type-options",
    required: true,
    weight: 10,
    description: "Prevents MIME type sniffing",
    goodValues: ["nosniff"],
  },
  {
    name: "x-frame-options",
    required: true,
    weight: 10,
    description: "Prevents clickjacking",
    goodValues: ["DENY", "SAMEORIGIN"],
  },
  {
    name: "x-xss-protection",
    required: false,
    weight: 5,
    description: "Legacy XSS filter (deprecated)",
    goodValues: ["1; mode=block"],
  },
  {
    name: "referrer-policy",
    required: true,
    weight: 10,
    description: "Controls referrer information",
  },
  {
    name: "permissions-policy",
    required: true,
    weight: 10,
    description: "Controls browser features",
  },
  {
    name: "cross-origin-opener-policy",
    required: false,
    weight: 5,
    description: "Isolates browsing context",
  },
  {
    name: "cross-origin-embedder-policy",
    required: false,
    weight: 5,
    description: "Controls cross-origin embedding",
  },
  {
    name: "cross-origin-resource-policy",
    required: false,
    weight: 5,
    description: "Controls cross-origin resource loading",
  },
  {
    name: "cache-control",
    required: false,
    weight: 5,
    description: "Controls caching behavior",
  },
];

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  // Parse headers
  const headers = new Map<string, string>();
  const lines = raw.split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const name = line.substring(0, colonIdx).trim().toLowerCase();
      const value = line.substring(colonIdx + 1).trim();
      headers.set(name, value);
    }
  }

  const present: string[] = [];
  const missing: string[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;
  const details: string[] = [];

  for (const check of SECURITY_HEADERS) {
    totalWeight += check.weight;
    const value = headers.get(check.name);

    if (value !== undefined) {
      present.push(check.name);
      earnedWeight += check.weight;

      let status = "PRESENT";
      if (
        check.goodValues &&
        !check.goodValues.some((v) =>
          value.toLowerCase().includes(v.toLowerCase())
        )
      ) {
        status = "PRESENT (non-optimal value)";
        earnedWeight -= check.weight * 0.3;
      }

      details.push(`  [+] ${check.name}: ${value}`);
      details.push(`      ${status} - ${check.description}`);
    } else {
      missing.push(check.name);
      const severity = check.required
        ? "MISSING (recommended)"
        : "MISSING (optional)";
      details.push(`  [-] ${check.name}`);
      details.push(`      ${severity} - ${check.description}`);
    }
  }

  // Check for bad headers
  if (headers.has("server")) {
    details.push(`\n  [!] Server: ${headers.get("server")}`);
    details.push("      Consider removing server version information");
  }
  if (headers.has("x-powered-by")) {
    details.push(`  [!] X-Powered-By: ${headers.get("x-powered-by")}`);
    details.push("      Remove this header to prevent information disclosure");
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round((earnedWeight / totalWeight) * 100))
  );

  const grade =
    score >= 90
      ? "A+"
      : score >= 80
        ? "A"
        : score >= 70
          ? "B"
          : score >= 60
            ? "C"
            : score >= 50
              ? "D"
              : "F";

  const output = [
    `Security Headers Analysis`,
    `Score: ${score}/100 (Grade: ${grade})`,
    `Present: ${present.length}/${SECURITY_HEADERS.length}`,
    ``,
    `Details:`,
    ...details,
  ].join("\n");

  return { output, score, present, missing };
}

export const securityHeadersCheck = defineTool({
  meta: {
    id: "web/security-headers-check",
    name: "Security Headers Check",
    description:
      "Free online security headers analyzer — audit HTTP response headers for OWASP security best practices and get a security score instantly in your browser. No data is stored. Checks CSP, HSTS, X-Frame-Options, Referrer-Policy, and 7 more headers.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "security",
      "headers",
      "check",
      "analyze",
      "http",
      "csp",
      "hsts",
      "audit",
      "owasp",
      "score",
      "grade",
      "x-frame-options",
      "referrer-policy",
      "x-content-type-options",
    ],
    examples: [
      {
        title: "Audit four common security headers",
        description:
          "Analyze HTTP headers including HSTS, CSP, X-Content-Type-Options, and X-Frame-Options",
        input:
          "Strict-Transport-Security: max-age=31536000\nX-Content-Type-Options: nosniff\nX-Frame-Options: DENY\nContent-Security-Policy: default-src 'self'",
        output:
          "Security Headers Analysis\nScore: 55/100 (Grade: D)\nPresent: 4/11\n\nDetails:\n  [+] content-security-policy: default-src 'self'\n      PRESENT - Prevents XSS and data injection attacks\n  [+] strict-transport-security: max-age=31536000\n      PRESENT - Forces HTTPS connections\n  [+] x-content-type-options: nosniff\n      PRESENT - Prevents MIME type sniffing\n  [+] x-frame-options: DENY\n      PRESENT - Prevents clickjacking\n  [-] x-xss-protection\n      MISSING (optional) - Legacy XSS filter (deprecated)\n  [-] referrer-policy\n      MISSING (recommended) - Controls referrer information\n  [-] permissions-policy\n      MISSING (recommended) - Controls browser features\n  [-] cross-origin-opener-policy\n      MISSING (optional) - Isolates browsing context\n  [-] cross-origin-embedder-policy\n      MISSING (optional) - Controls cross-origin embedding\n  [-] cross-origin-resource-policy\n      MISSING (optional) - Controls cross-origin resource loading\n  [-] cache-control\n      MISSING (optional) - Controls caching behavior",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
