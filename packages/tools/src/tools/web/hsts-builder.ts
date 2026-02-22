import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  maxAge: z
    .number()
    .int()
    .min(0)
    .default(31536000)
    .describe("Max-age in seconds (default: 1 year)"),
  includeSubDomains: z.boolean().default(true).describe("Include subdomains"),
  preload: z.boolean().default(false).describe("Enable HSTS preload"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Generated HSTS header with configuration examples"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const parts = [`max-age=${input.maxAge}`];

  if (input.includeSubDomains) {
    parts.push("includeSubDomains");
  }

  if (input.preload) {
    parts.push("preload");
  }

  const header = parts.join("; ");

  const humanAge =
    input.maxAge >= 31536000
      ? `${Math.round(input.maxAge / 31536000)} year(s)`
      : input.maxAge >= 86400
        ? `${Math.round(input.maxAge / 86400)} day(s)`
        : `${input.maxAge} seconds`;

  const lines = [
    `# HTTP Strict Transport Security (HSTS)`,
    ``,
    `Strict-Transport-Security: ${header}`,
    ``,
    `# Duration: ${humanAge}`,
    input.preload
      ? `# Preload: Eligible for browser HSTS preload list`
      : `# Preload: Not enabled`,
    ``,
    `# Apache (.htaccess)`,
    `Header always set Strict-Transport-Security "${header}"`,
    ``,
    `# Nginx`,
    `add_header Strict-Transport-Security "${header}" always;`,
    ``,
    `# Express.js`,
    `app.use((req, res, next) => {`,
    `  res.setHeader('Strict-Transport-Security', '${header}');`,
    `  next();`,
    `});`,
  ];

  if (input.preload) {
    lines.push("");
    lines.push("# To submit to the HSTS preload list:");
    lines.push("# https://hstspreload.org/");
    lines.push(
      "# Requirements: max-age >= 31536000, includeSubDomains, preload"
    );
  }

  return { output: lines.join("\n") };
}

export const hstsBuilder = defineTool({
  meta: {
    id: "web/hsts-builder",
    name: "HSTS Builder",
    description:
      "Free online HSTS header builder — generate HTTP Strict Transport Security headers with Apache, Nginx, and Express config examples instantly in your browser. No data is stored. Supports preload eligibility and subdomain inclusion.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "hsts",
      "strict transport security",
      "https",
      "security",
      "header",
      "transport",
      "tls",
      "ssl",
      "preload",
      "apache",
      "nginx",
      "express",
    ],
    examples: [
      {
        title: "One-year HSTS with preload eligibility",
        description:
          "Build an HSTS header with 1-year max-age, subdomains, and preload — eligible for the browser preload list",
        input: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        output: `# HTTP Strict Transport Security (HSTS)\n\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\n\n# Duration: 1 year(s)\n# Preload: Eligible for browser HSTS preload list\n\n# Apache (.htaccess)\nHeader always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\n\n# Nginx\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n\n# Express.js\napp.use((req, res, next) => {\n  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');\n  next();\n});\n\n# To submit to the HSTS preload list:\n# https://hstspreload.org/\n# Requirements: max-age >= 31536000, includeSubDomains, preload`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
