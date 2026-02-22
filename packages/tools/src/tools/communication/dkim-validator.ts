import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("DKIM record value (TXT record content)"),
});

const outputSchema = z.object({
  output: z.string().describe("DKIM record analysis as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const record = input.input.trim().replace(/"\s*"/g, "").replace(/"/g, "");
  const errors: string[] = [];
  const warnings: string[] = [];
  const tags: Record<string, string> = {};

  // Parse tags
  const parts = record
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx > 0) {
      const key = part.substring(0, eqIdx).trim();
      const value = part.substring(eqIdx + 1).trim();
      tags[key] = value;
    }
  }

  // Validate required tags
  if (!tags.v) {
    errors.push("Missing required 'v' tag (version)");
  } else if (tags.v !== "DKIM1") {
    errors.push(`Invalid version: '${tags.v}' (must be 'DKIM1')`);
  }

  if (!tags.p) {
    errors.push("Missing required 'p' tag (public key)");
  } else if (tags.p === "") {
    warnings.push("Empty 'p' tag indicates key has been revoked");
  }

  // Validate optional tags
  if (tags.k) {
    const validKeyTypes = ["rsa", "ed25519"];
    if (!validKeyTypes.includes(tags.k.toLowerCase())) {
      warnings.push(`Unusual key type: '${tags.k}' (expected: rsa or ed25519)`);
    }
  }

  if (tags.t) {
    const flags = tags.t.split(":").map((f) => f.trim());
    for (const flag of flags) {
      if (flag !== "y" && flag !== "s") {
        warnings.push(`Unknown flag: '${flag}' (valid: y=testing, s=strict)`);
      }
    }
  }

  if (tags.h) {
    const validHashes = ["sha1", "sha256"];
    const hashes = tags.h.split(":").map((h) => h.trim());
    for (const hash of hashes) {
      if (!validHashes.includes(hash.toLowerCase())) {
        warnings.push(`Unusual hash algorithm: '${hash}'`);
      }
    }
    if (hashes.includes("sha1") && !hashes.includes("sha256")) {
      warnings.push("SHA-1 only is deprecated; consider adding SHA-256");
    }
  }

  if (tags.s) {
    const validServices = ["*", "email"];
    if (!validServices.includes(tags.s)) {
      warnings.push(`Unusual service type: '${tags.s}' (expected: * or email)`);
    }
  }

  const result: Record<string, unknown> = {
    valid: errors.length === 0,
    tags: {
      version: tags.v ?? null,
      keyType: tags.k ?? "rsa",
      publicKey: tags.p ? `${tags.p.substring(0, 20)}...` : null,
      publicKeyLength: tags.p ? tags.p.length : 0,
      hashAlgorithms: tags.h ?? null,
      serviceType: tags.s ?? "*",
      flags: tags.t ?? null,
      notes: tags.n ?? null,
    },
    errors,
    warnings,
    rawTags: tags,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const dkimValidator = defineTool({
  meta: {
    id: "communication/dkim-validator",
    name: "DKIM Validator",
    description:
      "Free online DKIM record validator — paste your DKIM DNS TXT record and check its format instantly in your browser. No data is stored. Validates version, key type, public key, hash algorithms, service type, and flags with detailed error and warning messages.",
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "dkim",
      "dns",
      "email",
      "validate",
      "authentication",
      "record",
      "txt",
      "selector",
      "dmarc",
      "spf",
    ],
    examples: [
      {
        title: "RSA DKIM record with hash algorithms",
        description:
          "Validate a DKIM record with RSA key type and SHA-256 hash",
        input:
          "v=DKIM1; k=rsa; h=sha256; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3",
        output:
          '{\n  "valid": true,\n  "tags": {\n    "version": "DKIM1",\n    "keyType": "rsa",\n    "publicKey": "MIGfMA0GCSqGSIb3DQEB...",\n    "publicKeyLength": 40,\n    "hashAlgorithms": "sha256",\n    "serviceType": "*",\n    "flags": null,\n    "notes": null\n  },\n  "errors": [],\n  "warnings": [],\n  "rawTags": {\n    "v": "DKIM1",\n    "k": "rsa",\n    "h": "sha256",\n    "p": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3"\n  }\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
