import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Postman collection JSON (v2.0 or v2.1 format)"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("cURL commands for each request in the collection"),
});

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}
interface PostmanUrl {
  raw?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key: string; value: string; disabled?: boolean }>;
}
interface PostmanBody {
  mode?: string;
  raw?: string;
  urlencoded?: Array<{ key: string; value: string }>;
}
interface PostmanRequest {
  method?: string;
  header?: PostmanHeader[];
  url?: string | PostmanUrl;
  body?: PostmanBody;
  auth?: unknown;
}
interface PostmanItem {
  name?: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
}

function resolveUrl(url: string | PostmanUrl | undefined): string {
  if (!url) return "https://example.com";
  if (typeof url === "string") return url;
  if (url.raw) return url.raw;
  const host = url.host?.join(".") ?? "example.com";
  const path = url.path?.join("/") ?? "";
  let result = `https://${host}/${path}`;
  const query = url.query?.filter((q) => !q.disabled);
  if (query && query.length > 0) {
    result += "?" + query.map((q) => `${q.key}=${q.value}`).join("&");
  }
  return result;
}

function itemToCurl(item: PostmanItem, prefix: string = ""): string[] {
  const results: string[] = [];

  if (item.item && Array.isArray(item.item)) {
    const folderName = item.name ? `${prefix}${item.name}/` : prefix;
    for (const child of item.item) {
      results.push(...itemToCurl(child, folderName));
    }
    return results;
  }

  if (!item.request) return results;

  const req = item.request;
  const method = req.method ?? "GET";
  const url = resolveUrl(req.url);
  const name = `${prefix}${item.name ?? "Unnamed Request"}`;

  const parts: string[] = [`# ${name}`, "curl"];
  if (method !== "GET") parts.push(`-X ${method}`);

  if (req.header) {
    for (const h of req.header) {
      if (!h.disabled) parts.push(`-H '${h.key}: ${h.value}'`);
    }
  }

  if (req.body) {
    if (req.body.mode === "raw" && req.body.raw) {
      parts.push(`-d '${req.body.raw}'`);
    } else if (req.body.mode === "urlencoded" && req.body.urlencoded) {
      const data = req.body.urlencoded
        .map((p) => `${p.key}=${p.value}`)
        .join("&");
      parts.push(`-d '${data}'`);
    }
  }

  parts.push(`'${url}'`);
  results.push(parts.join(" \\\n  "));
  return results;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let collection: Record<string, unknown>;
  try {
    collection = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Input must be a valid Postman collection JSON");
  }

  const items: PostmanItem[] = (collection.item as PostmanItem[]) ?? [];
  if (items.length === 0)
    throw new Error("No requests found in the Postman collection");

  const collectionName =
    (collection.info as Record<string, string>)?.name ?? "Collection";
  const results: string[] = [`# ${collectionName}`, ""];

  for (const item of items) {
    results.push(...itemToCurl(item));
    results.push("");
  }

  return { output: results.join("\n").trimEnd() };
}

export const postmanToCurl = defineTool({
  meta: {
    id: "api/postman-to-curl",
    name: "Postman to cURL",
    description:
      "Free online Postman to cURL converter — transform Postman collection requests into cURL commands instantly in your browser. No data is stored. Supports v2.0/v2.1 collections with headers, body, query params, and nested folders.",
    category: "api",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "postman",
      "curl",
      "convert",
      "collection",
      "api",
      "export",
      "http",
      "request",
    ],
    ui: { inputLanguage: "json", outputLanguage: "shell" },
    examples: [
      {
        title: "Convert POST Request",
        description:
          "Convert a Postman collection POST request with JSON body to cURL",
        input:
          '{"info":{"name":"My API"},"item":[{"name":"Create User","request":{"method":"POST","url":"https://api.example.com/users","header":[{"key":"Content-Type","value":"application/json"}],"body":{"mode":"raw","raw":"{\\"name\\":\\"Alice\\"}"}}}]}',
        output:
          "# My API\n\n# Create User \\\n  curl \\\n  -X POST \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"Alice\"}' \\\n  'https://api.example.com/users'",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
