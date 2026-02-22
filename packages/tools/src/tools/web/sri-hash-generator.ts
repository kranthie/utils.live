import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Content to generate SRI hash for (script/stylesheet content)"),
});

const outputSchema = z.object({
  output: z.string().describe("SRI hash and example usage"),
  hash256: z.string().describe("SHA-256 hash"),
  hash384: z.string().describe("SHA-384 hash"),
  hash512: z.string().describe("SHA-512 hash"),
});

const optionsSchema = z.object({
  algorithm: z
    .enum(["sha256", "sha384", "sha512"])
    .default("sha384")
    .describe("Hash algorithm"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

async function computeHash(
  content: string,
  algorithm: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const algoMap: Record<string, string> = {
    sha256: "SHA-256",
    sha384: "SHA-384",
    sha512: "SHA-512",
  };
  const hashBuffer = await crypto.subtle.digest(algoMap[algorithm]!, data);
  const hashArray = new Uint8Array(hashBuffer);
  // Convert to base64
  let binary = "";
  for (const byte of hashArray) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function execute(input: Input, options?: Options): Promise<Output> {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const algorithm = options?.algorithm ?? "sha384";

  const [hash256, hash384, hash512] = await Promise.all([
    computeHash(raw, "sha256"),
    computeHash(raw, "sha384"),
    computeHash(raw, "sha512"),
  ]);

  const selectedHash =
    algorithm === "sha256"
      ? hash256
      : algorithm === "sha384"
        ? hash384
        : hash512;
  const integrity = `${algorithm}-${selectedHash}`;

  const lines = [
    `# Subresource Integrity Hash`,
    ``,
    `Integrity: ${integrity}`,
    ``,
    `# SHA-256: sha256-${hash256}`,
    `# SHA-384: sha384-${hash384}`,
    `# SHA-512: sha512-${hash512}`,
    ``,
    `# Script Tag`,
    `<script src="URL" integrity="${integrity}" crossorigin="anonymous"></script>`,
    ``,
    `# Stylesheet Tag`,
    `<link rel="stylesheet" href="URL" integrity="${integrity}" crossorigin="anonymous">`,
  ];

  return {
    output: lines.join("\n"),
    hash256: `sha256-${hash256}`,
    hash384: `sha384-${hash384}`,
    hash512: `sha512-${hash512}`,
  };
}

export const sriHashGenerator = defineTool({
  meta: {
    id: "web/sri-hash-generator",
    name: "SRI Hash Generator",
    description:
      "Free online SRI hash generator — generate Subresource Integrity hashes for scripts and stylesheets with SHA-256, SHA-384, and SHA-512 instantly in your browser. No data is stored. Outputs integrity attribute with ready-to-use script and link tags.",
    category: "web",
    subgroup: "Security",
    tier: ToolTier.CLIENT,
    keywords: [
      "sri",
      "subresource integrity",
      "hash",
      "security",
      "sha256",
      "sha384",
      "sha512",
      "crossorigin",
      "cdn",
      "script",
      "stylesheet",
      "integrity",
    ],
    examples: [
      {
        title: "Generate SRI hash for JavaScript content",
        description:
          "Compute SHA-384 integrity hash for a script with ready-to-use HTML tags",
        input: "console.log('Hello, World!');",
        options: { algorithm: "sha384" },
        output:
          '# Subresource Integrity Hash\n\nIntegrity: sha384-AbXMBJEf72gjQYPpnzblmu6EMIjgH7+GKr1dqa+zMcargkw+4UwBZhjbltwmSfcI\n\n# SHA-256: sha256-VrXiRzNabZlVUzrPKgON5EtG2BuRUP8wULVkbIOqqkA=\n# SHA-384: sha384-AbXMBJEf72gjQYPpnzblmu6EMIjgH7+GKr1dqa+zMcargkw+4UwBZhjbltwmSfcI\n# SHA-512: sha512-NPJXEZdKRVSg+mZDCNsuCXB4f8Rh3GOLcDlrR6mmDYeJVNgb9sgVc3We3eE5SNdIMzcK9PnrRKPschwvl45Ibg==\n\n# Script Tag\n<script src="URL" integrity="sha384-AbXMBJEf72gjQYPpnzblmu6EMIjgH7+GKr1dqa+zMcargkw+4UwBZhjbltwmSfcI" crossorigin="anonymous"></script>\n\n# Stylesheet Tag\n<link rel="stylesheet" href="URL" integrity="sha384-AbXMBJEf72gjQYPpnzblmu6EMIjgH7+GKr1dqa+zMcargkw+4UwBZhjbltwmSfcI" crossorigin="anonymous">',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
