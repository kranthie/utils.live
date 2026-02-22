import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  defaultSrc: z.string().default("'self'").describe("default-src directive"),
  scriptSrc: z.string().default("'self'").describe("script-src directive"),
  styleSrc: z
    .string()
    .default("'self' 'unsafe-inline'")
    .describe("style-src directive"),
  imgSrc: z.string().default("'self' data:").describe("img-src directive"),
  fontSrc: z.string().default("'self'").describe("font-src directive"),
  connectSrc: z.string().default("'self'").describe("connect-src directive"),
  mediaSrc: z.string().default("").describe("media-src directive"),
  objectSrc: z.string().default("'none'").describe("object-src directive"),
  frameSrc: z.string().default("").describe("frame-src directive"),
  childSrc: z.string().default("").describe("child-src directive"),
  workerSrc: z.string().default("").describe("worker-src directive"),
  formAction: z.string().default("'self'").describe("form-action directive"),
  frameAncestors: z
    .string()
    .default("'none'")
    .describe("frame-ancestors directive"),
  baseUri: z.string().default("'self'").describe("base-uri directive"),
  upgradeInsecureRequests: z
    .boolean()
    .default(true)
    .describe("Include upgrade-insecure-requests"),
  reportUri: z.string().default("").describe("Report URI for CSP violations"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated CSP header"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const directives: string[] = [];

  const addDirective = (name: string, value: string): void => {
    if (value.trim()) {
      directives.push(`${name} ${value.trim()}`);
    }
  };

  addDirective("default-src", input.defaultSrc);
  addDirective("script-src", input.scriptSrc);
  addDirective("style-src", input.styleSrc);
  addDirective("img-src", input.imgSrc);
  addDirective("font-src", input.fontSrc);
  addDirective("connect-src", input.connectSrc);
  addDirective("media-src", input.mediaSrc);
  addDirective("object-src", input.objectSrc);
  addDirective("frame-src", input.frameSrc);
  addDirective("child-src", input.childSrc);
  addDirective("worker-src", input.workerSrc);
  addDirective("form-action", input.formAction);
  addDirective("frame-ancestors", input.frameAncestors);
  addDirective("base-uri", input.baseUri);

  if (input.upgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }

  if (input.reportUri.trim()) {
    addDirective("report-uri", input.reportUri);
  }

  const csp = directives.join("; ");

  const lines = [
    `# Content Security Policy Header`,
    ``,
    `Content-Security-Policy: ${csp}`,
    ``,
    `# HTML Meta Tag`,
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    ``,
    `# Apache (.htaccess)`,
    `Header set Content-Security-Policy "${csp}"`,
    ``,
    `# Nginx`,
    `add_header Content-Security-Policy "${csp}";`,
  ];

  return { output: lines.join("\n") };
}

export const cspBuilder = defineTool({
  meta: {
    id: "web/csp-builder",
    name: "CSP Builder",
    description:
      "Free online CSP builder — create Content Security Policy headers with directive configuration and server config examples instantly in your browser. No data is stored. Generates header, HTML meta tag, Apache, and Nginx formats.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "csp",
      "content security policy",
      "security",
      "header",
      "builder",
      "directive",
      "xss",
      "injection",
      "apache",
      "nginx",
      "meta-tag",
    ],
    examples: [
      {
        title: "Strict CSP with self-only scripts and inline styles",
        description:
          "Build a Content Security Policy that restricts scripts to same-origin while allowing inline styles",
        input: {
          defaultSrc: "'self'",
          scriptSrc: "'self'",
          styleSrc: "'self' 'unsafe-inline'",
          imgSrc: "'self' data:",
          fontSrc: "'self'",
          connectSrc: "'self'",
          mediaSrc: "",
          objectSrc: "'none'",
          frameSrc: "",
          childSrc: "",
          workerSrc: "",
          formAction: "'self'",
          frameAncestors: "'none'",
          baseUri: "'self'",
          upgradeInsecureRequests: true,
          reportUri: "",
        },
        output: `# Content Security Policy Header\n\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests\n\n# HTML Meta Tag\n<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests">\n\n# Apache (.htaccess)\nHeader set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests"\n\n# Nginx\nadd_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests";`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
