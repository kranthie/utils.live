import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
const NAMESPACE_OID = "6ba7b812-9dad-11d1-80b4-00c04fd430c8";
const NAMESPACE_X500 = "6ba7b814-9dad-11d1-80b4-00c04fd430c8";

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

async function generateUuidV5(
  namespace: string,
  name: string
): Promise<string> {
  const namespaceBytes = uuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(namespaceBytes.length + nameBytes.length);
  data.set(namespaceBytes);
  data.set(nameBytes, namespaceBytes.length);

  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashBytes = new Uint8Array(hashBuffer);

  // Set version 5
  hashBytes[6] = (hashBytes[6]! & 0x0f) | 0x50;
  // Set variant 10xx
  hashBytes[8] = (hashBytes[8]! & 0x3f) | 0x80;

  return bytesToUuid(hashBytes.slice(0, 16));
}

const inputSchema = z.object({
  name: z.string().default("example.com").describe("Name to hash"),
  namespace: z
    .enum(["dns", "url", "oid", "x500", "custom"])
    .default("dns")
    .describe("Namespace for UUID generation"),
  customNamespace: z
    .string()
    .default("")
    .describe("Custom namespace UUID (when namespace is 'custom')"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated UUID v5"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

async function execute(input: Input): Promise<Output> {
  const namespaceMap: Record<string, string> = {
    dns: NAMESPACE_DNS,
    url: NAMESPACE_URL,
    oid: NAMESPACE_OID,
    x500: NAMESPACE_X500,
  };

  let namespace: string;
  if (input.namespace === "custom") {
    if (!input.customNamespace) {
      throw new Error(
        "Custom namespace UUID is required when namespace is 'custom'"
      );
    }
    namespace = input.customNamespace;
  } else {
    namespace = namespaceMap[input.namespace]!;
  }

  const uuid = await generateUuidV5(namespace, input.name);
  return { output: uuid };
}

export const uuidV5Generator = defineTool({
  meta: {
    id: "identifiers/uuid-v5-generator",
    name: "UUID v5 Generator",
    description:
      "Free online UUID v5 generator — create deterministic name-based UUID version 5 identifiers using SHA-1 hashing instantly in your browser. No data is stored. Supports DNS, URL, OID, X.500 namespaces and custom namespace UUIDs.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "uuid",
      "v5",
      "generate",
      "name",
      "sha1",
      "namespace",
      "deterministic",
      "rfc4122",
    ],
    examples: [
      {
        title: "DNS Namespace",
        description:
          "Generate a UUID v5 for 'example.com' using the DNS namespace",
        input: { name: "example.com", namespace: "dns", customNamespace: "" },
        output: "cfbff0d1-9375-5685-968c-48ce8b15ae17",
      },
      {
        title: "URL Namespace",
        description: "Generate a UUID v5 for a URL using the URL namespace",
        input: {
          name: "https://example.com/resource",
          namespace: "url",
          customNamespace: "",
        },
        output: "1f70cc9d-a4b1-5e16-844a-32742876cc95",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
