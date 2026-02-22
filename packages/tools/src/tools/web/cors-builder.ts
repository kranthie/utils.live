import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  allowOrigin: z
    .string()
    .default("*")
    .describe(
      "Access-Control-Allow-Origin (*, specific URL, or comma-separated)"
    ),
  allowMethods: z
    .string()
    .default("GET, POST, PUT, DELETE, OPTIONS")
    .describe("Allowed HTTP methods"),
  allowHeaders: z
    .string()
    .default("Content-Type, Authorization")
    .describe("Allowed request headers"),
  exposeHeaders: z
    .string()
    .default("")
    .describe("Headers exposed to the browser"),
  allowCredentials: z
    .boolean()
    .default(false)
    .describe("Allow credentials (cookies, auth)"),
  maxAge: z
    .number()
    .int()
    .min(0)
    .max(86400)
    .default(3600)
    .describe("Preflight cache duration in seconds"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Generated CORS headers with server config examples"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const headers: string[] = [];

  headers.push(`Access-Control-Allow-Origin: ${input.allowOrigin}`);
  headers.push(`Access-Control-Allow-Methods: ${input.allowMethods}`);
  headers.push(`Access-Control-Allow-Headers: ${input.allowHeaders}`);

  if (input.exposeHeaders) {
    headers.push(`Access-Control-Expose-Headers: ${input.exposeHeaders}`);
  }

  if (input.allowCredentials) {
    headers.push(`Access-Control-Allow-Credentials: true`);
    if (input.allowOrigin === "*") {
      headers.push(
        `# WARNING: credentials cannot be used with wildcard origin`
      );
    }
  }

  headers.push(`Access-Control-Max-Age: ${input.maxAge}`);

  const lines = [
    `# CORS Response Headers`,
    ...headers,
    ``,
    `# Express.js (Node.js)`,
    `app.use((req, res, next) => {`,
    `  res.header('Access-Control-Allow-Origin', '${input.allowOrigin}');`,
    `  res.header('Access-Control-Allow-Methods', '${input.allowMethods}');`,
    `  res.header('Access-Control-Allow-Headers', '${input.allowHeaders}');`,
    input.allowCredentials
      ? `  res.header('Access-Control-Allow-Credentials', 'true');`
      : "",
    `  res.header('Access-Control-Max-Age', '${input.maxAge}');`,
    `  if (req.method === 'OPTIONS') return res.sendStatus(204);`,
    `  next();`,
    `});`,
    ``,
    `# Nginx`,
    `add_header 'Access-Control-Allow-Origin' '${input.allowOrigin}';`,
    `add_header 'Access-Control-Allow-Methods' '${input.allowMethods}';`,
    `add_header 'Access-Control-Allow-Headers' '${input.allowHeaders}';`,
    `add_header 'Access-Control-Max-Age' '${input.maxAge}';`,
    ``,
    `# Apache (.htaccess)`,
    `Header set Access-Control-Allow-Origin "${input.allowOrigin}"`,
    `Header set Access-Control-Allow-Methods "${input.allowMethods}"`,
    `Header set Access-Control-Allow-Headers "${input.allowHeaders}"`,
  ].filter(Boolean);

  return { output: lines.join("\n") };
}

export const corsBuilder = defineTool({
  meta: {
    id: "web/cors-builder",
    name: "CORS Builder",
    description:
      "Free online CORS header builder — configure Cross-Origin Resource Sharing headers with Express, Nginx, and Apache examples instantly in your browser. No data is stored. Supports allowed origins, methods, headers, credentials, and preflight cache duration.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "cors",
      "cross-origin",
      "header",
      "builder",
      "access-control",
      "preflight",
      "origin",
      "express",
      "nginx",
      "apache",
      "api",
    ],
    examples: [
      {
        title: "API CORS headers with credentials for specific origin",
        description:
          "Build CORS headers allowing a specific frontend origin with credentials and common HTTP methods",
        input: {
          allowOrigin: "https://app.example.com",
          allowMethods: "GET, POST, PUT, DELETE",
          allowHeaders: "Content-Type, Authorization",
          exposeHeaders: "",
          allowCredentials: true,
          maxAge: 3600,
        },
        output: `# CORS Response Headers\nAccess-Control-Allow-Origin: https://app.example.com\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\nAccess-Control-Allow-Headers: Content-Type, Authorization\nAccess-Control-Allow-Credentials: true\nAccess-Control-Max-Age: 3600\n\n# Express.js (Node.js)\napp.use((req, res, next) => {\n  res.header('Access-Control-Allow-Origin', 'https://app.example.com');\n  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');\n  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');\n  res.header('Access-Control-Allow-Credentials', 'true');\n  res.header('Access-Control-Max-Age', '3600');\n  if (req.method === 'OPTIONS') return res.sendStatus(204);\n  next();\n});\n\n# Nginx\nadd_header 'Access-Control-Allow-Origin' 'https://app.example.com';\nadd_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE';\nadd_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';\nadd_header 'Access-Control-Max-Age' '3600';\n\n# Apache (.htaccess)\nHeader set Access-Control-Allow-Origin "https://app.example.com"\nHeader set Access-Control-Allow-Methods "GET, POST, PUT, DELETE"\nHeader set Access-Control-Allow-Headers "Content-Type, Authorization"`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
