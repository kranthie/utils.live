import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  category: z
    .enum([
      "all",
      "request",
      "response",
      "general",
      "security",
      "caching",
      "cors",
    ])
    .default("all")
    .describe("Header category"),
  search: z
    .string()
    .default("")
    .describe("Filter headers by name or description"),
});

const outputSchema = z.object({
  output: z.string().describe("HTTP headers reference"),
});

interface HeaderInfo {
  type: string;
  description: string;
  example: string;
}

const HEADERS: Record<string, HeaderInfo> = {
  Accept: {
    type: "request",
    description: "Media types the client can process",
    example: "Accept: application/json",
  },
  "Accept-Charset": {
    type: "request",
    description: "Character sets the client accepts",
    example: "Accept-Charset: utf-8",
  },
  "Accept-Encoding": {
    type: "request",
    description: "Encoding algorithms the client accepts",
    example: "Accept-Encoding: gzip, deflate, br",
  },
  "Accept-Language": {
    type: "request",
    description: "Natural languages the client prefers",
    example: "Accept-Language: en-US, en;q=0.9",
  },
  Authorization: {
    type: "request",
    description: "Credentials for authenticating the client",
    example: "Authorization: Bearer <token>",
  },
  "Cache-Control": {
    type: "caching",
    description: "Directives for caching mechanisms",
    example: "Cache-Control: no-cache, no-store, must-revalidate",
  },
  Connection: {
    type: "general",
    description: "Control options for the current connection",
    example: "Connection: keep-alive",
  },
  "Content-Disposition": {
    type: "response",
    description: "How content should be displayed",
    example: 'Content-Disposition: attachment; filename="file.pdf"',
  },
  "Content-Encoding": {
    type: "general",
    description: "Encoding applied to the message body",
    example: "Content-Encoding: gzip",
  },
  "Content-Length": {
    type: "general",
    description: "Size of the body in bytes",
    example: "Content-Length: 348",
  },
  "Content-Type": {
    type: "general",
    description: "Media type of the body",
    example: "Content-Type: application/json; charset=utf-8",
  },
  Cookie: {
    type: "request",
    description: "HTTP cookies previously sent by the server",
    example: "Cookie: session=abc123; theme=dark",
  },
  Date: {
    type: "general",
    description: "Date and time the message was sent",
    example: "Date: Tue, 15 Nov 2023 08:12:31 GMT",
  },
  ETag: {
    type: "caching",
    description: "Identifier for a specific version of a resource",
    example: 'ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"',
  },
  Expires: {
    type: "caching",
    description: "Date/time after which the response is stale",
    example: "Expires: Thu, 01 Dec 2023 16:00:00 GMT",
  },
  Host: {
    type: "request",
    description: "Domain name of the server and TCP port number",
    example: "Host: www.example.com",
  },
  "If-Modified-Since": {
    type: "caching",
    description: "Only return resource if modified since the date",
    example: "If-Modified-Since: Sat, 29 Oct 2023 19:43:31 GMT",
  },
  "If-None-Match": {
    type: "caching",
    description: "Only return resource if ETag does not match",
    example: 'If-None-Match: "737060cd8c284d8af7ad3082f209582d"',
  },
  "Last-Modified": {
    type: "caching",
    description: "Date the resource was last modified",
    example: "Last-Modified: Tue, 15 Nov 2023 12:45:26 GMT",
  },
  Location: {
    type: "response",
    description: "URL to redirect to",
    example: "Location: https://www.example.com/new-page",
  },
  Origin: {
    type: "request",
    description: "Origin of the request for CORS",
    example: "Origin: https://www.example.com",
  },
  Pragma: {
    type: "caching",
    description: "Implementation-specific directives (HTTP/1.0)",
    example: "Pragma: no-cache",
  },
  Referer: {
    type: "request",
    description: "URI of the resource that linked to the request",
    example: "Referer: https://www.example.com/page",
  },
  "Retry-After": {
    type: "response",
    description: "How long to wait before making a new request",
    example: "Retry-After: 120",
  },
  Server: {
    type: "response",
    description: "Information about the software used by the server",
    example: "Server: Apache/2.4.1",
  },
  "Set-Cookie": {
    type: "response",
    description: "Send a cookie from the server to the client",
    example:
      "Set-Cookie: id=a3fWa; Expires=Wed, 09 Jun 2021 10:18:14 GMT; HttpOnly; Secure",
  },
  "Strict-Transport-Security": {
    type: "security",
    description: "Force HTTPS connections",
    example: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  },
  "Transfer-Encoding": {
    type: "general",
    description: "Form of encoding used to safely transfer the body",
    example: "Transfer-Encoding: chunked",
  },
  "User-Agent": {
    type: "request",
    description: "Client application identification string",
    example: "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
  Vary: {
    type: "caching",
    description: "Determines how to match request headers for caching",
    example: "Vary: Accept-Encoding, Accept-Language",
  },
  "WWW-Authenticate": {
    type: "response",
    description: "Authentication method to access the resource",
    example: 'WWW-Authenticate: Bearer realm="example"',
  },
  "X-Content-Type-Options": {
    type: "security",
    description: "Prevents MIME type sniffing",
    example: "X-Content-Type-Options: nosniff",
  },
  "X-Frame-Options": {
    type: "security",
    description: "Controls iframe embedding",
    example: "X-Frame-Options: DENY",
  },
  "X-XSS-Protection": {
    type: "security",
    description: "Enables cross-site scripting filter",
    example: "X-XSS-Protection: 1; mode=block",
  },
  "Access-Control-Allow-Origin": {
    type: "cors",
    description: "Origins allowed to access the resource",
    example: "Access-Control-Allow-Origin: *",
  },
  "Access-Control-Allow-Methods": {
    type: "cors",
    description: "HTTP methods allowed for CORS",
    example: "Access-Control-Allow-Methods: GET, POST, PUT, DELETE",
  },
  "Access-Control-Allow-Headers": {
    type: "cors",
    description: "Headers allowed in CORS requests",
    example: "Access-Control-Allow-Headers: Content-Type, Authorization",
  },
  "Access-Control-Max-Age": {
    type: "cors",
    description: "How long CORS preflight results can be cached",
    example: "Access-Control-Max-Age: 86400",
  },
  "Access-Control-Allow-Credentials": {
    type: "cors",
    description: "Whether credentials can be exposed in CORS",
    example: "Access-Control-Allow-Credentials: true",
  },
  "Content-Security-Policy": {
    type: "security",
    description: "Controls resources the user agent is allowed to load",
    example: "Content-Security-Policy: default-src 'self'",
  },
  "Referrer-Policy": {
    type: "security",
    description: "Controls how much referrer info is sent",
    example: "Referrer-Policy: strict-origin-when-cross-origin",
  },
  "Permissions-Policy": {
    type: "security",
    description: "Controls browser features and APIs",
    example: "Permissions-Policy: camera=(), microphone=()",
  },
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let entries = Object.entries(HEADERS);

  if (input.category !== "all") {
    entries = entries.filter(([, info]) => info.type === input.category);
  }

  if (input.search.trim()) {
    const search = input.search.toLowerCase().trim();
    entries = entries.filter(
      ([name, info]) =>
        name.toLowerCase().includes(search) ||
        info.description.toLowerCase().includes(search)
    );
  }

  if (entries.length === 0) {
    return { output: "No matching headers found." };
  }

  const lines = entries.map(
    ([name, info]) =>
      `${name} [${info.type}]\n  ${info.description}\n  Example: ${info.example}`
  );
  return { output: lines.join("\n\n") };
}

export const httpHeadersReference = defineTool({
  meta: {
    id: "network/http-headers-reference",
    name: "HTTP Headers Reference",
    description:
      "Free online HTTP headers reference — browse 40+ standard headers by category (request, response, security, CORS, caching) with descriptions and usage examples instantly in your browser. No data is stored. Search by name or description.",
    category: "network",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "http",
      "header",
      "reference",
      "api",
      "cors",
      "security",
      "caching",
      "content-type",
      "authorization",
    ],
    ui: { outputRenderer: "code" as const },
    examples: [
      {
        title: "Browse security-related HTTP headers",
        description:
          "List all security headers like HSTS, CSP, X-Frame-Options with descriptions",
        input: { category: "security", search: "" },
        output:
          '{"output":"Strict-Transport-Security [security]\\n  Force HTTPS connections\\n  Example: Strict-Transport-Security: max-age=31536000; includeSubDomains\\n\\nX-Content-Type-Options [security]\\n  Prevents MIME type sniffing\\n  Example: X-Content-Type-Options: nosniff\\n\\nX-Frame-Options [security]\\n  Controls iframe embedding\\n  Example: X-Frame-Options: DENY\\n\\nX-XSS-Protection [security]\\n  Enables cross-site scripting filter\\n  Example: X-XSS-Protection: 1; mode=block\\n\\nContent-Security-Policy [security]\\n  Controls resources the user agent is allowed to load\\n  Example: Content-Security-Policy: default-src \'self\'\\n\\nReferrer-Policy [security]\\n  Controls how much referrer info is sent\\n  Example: Referrer-Policy: strict-origin-when-cross-origin\\n\\nPermissions-Policy [security]\\n  Controls browser features and APIs\\n  Example: Permissions-Policy: camera=(), microphone=()"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
