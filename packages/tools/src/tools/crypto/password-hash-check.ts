import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Password hash to check format validity"),
});

const outputSchema = z.object({
  output: z.string().describe("Hash format validation result"),
});

interface HashFormat {
  name: string;
  pattern: RegExp;
  description: string;
  example: string;
}

const HASH_FORMATS: HashFormat[] = [
  {
    name: "bcrypt",
    pattern: /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/,
    description: "Bcrypt password hash (Blowfish-based)",
    example: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  },
  {
    name: "Argon2",
    pattern:
      /^\$argon2(i|d|id)\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
    description: "Argon2 password hash",
    example: "$argon2id$v=19$m=4096,t=3,p=1$<salt>$<hash>",
  },
  {
    name: "scrypt",
    pattern: /^\$scrypt\$/,
    description: "Scrypt key derivation hash",
    example: "$scrypt$...",
  },
  {
    name: "PBKDF2",
    pattern: /^\$pbkdf2(-sha(1|256|512))?\$/,
    description: "PBKDF2 derived key",
    example: "$pbkdf2-sha256$...",
  },
  {
    name: "MD5 (Unix crypt)",
    pattern: /^\$1\$[./A-Za-z0-9]{1,8}\$[./A-Za-z0-9]{22}$/,
    description: "Unix MD5 crypt hash",
    example: "$1$salt$hash",
  },
  {
    name: "SHA-256 (Unix crypt)",
    pattern: /^\$5\$(rounds=\d+\$)?[./A-Za-z0-9]+\$[./A-Za-z0-9]{43}$/,
    description: "Unix SHA-256 crypt hash",
    example: "$5$rounds=5000$salt$hash",
  },
  {
    name: "SHA-512 (Unix crypt)",
    pattern: /^\$6\$(rounds=\d+\$)?[./A-Za-z0-9]+\$[./A-Za-z0-9]{86}$/,
    description: "Unix SHA-512 crypt hash",
    example: "$6$rounds=5000$salt$hash",
  },
  {
    name: "MD5 (hex)",
    pattern: /^[a-f0-9]{32}$/i,
    description: "Plain MD5 hash (hex encoded)",
    example: "d41d8cd98f00b204e9800998ecf8427e",
  },
  {
    name: "SHA-1 (hex)",
    pattern: /^[a-f0-9]{40}$/i,
    description: "Plain SHA-1 hash (hex encoded)",
    example: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  },
  {
    name: "SHA-256 (hex)",
    pattern: /^[a-f0-9]{64}$/i,
    description: "Plain SHA-256 hash (hex encoded)",
    example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    name: "SHA-512 (hex)",
    pattern: /^[a-f0-9]{128}$/i,
    description: "Plain SHA-512 hash (hex encoded)",
    example: "cf83e1357eefb8bd...",
  },
  {
    name: "MySQL 4.1+",
    pattern: /^\*[A-F0-9]{40}$/,
    description: "MySQL 4.1+ password hash",
    example: "*2470C0C06DEE42FD1618BB99005ADCA2EC9D1E19",
  },
];

export const passwordHashCheck = defineTool({
  meta: {
    id: "crypto/password-hash-check",
    name: "Password Hash Format Check",
    description:
      "Free online password hash format checker — validate password hash formats instantly in your browser. No data is stored. Recognizes bcrypt, Argon2, scrypt, PBKDF2, Unix crypt, MD5, SHA-1, SHA-256, and SHA-512 hash formats.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "password",
      "hash",
      "check",
      "format",
      "validate",
      "bcrypt",
      "argon2",
    ],
    icon: "ShieldCheck",
    examples: [
      {
        title: "Check bcrypt Hash",
        description:
          "Validate that a hash string is in a recognized password hash format",
        input: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        output:
          "=== Password Hash Format Check ===\nInput: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy\nLength: 60 characters\n\nResult: VALID FORMAT (1 match)\n\nFormat: bcrypt\nDescription: Bcrypt password hash (Blowfish-based)\nExample: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const hash = input.input.trim();
    if (!hash) {
      throw new Error("Hash string cannot be empty");
    }

    const matches = HASH_FORMATS.filter((f) => f.pattern.test(hash));

    const lines: string[] = ["=== Password Hash Format Check ==="];
    lines.push(
      `Input: ${hash.substring(0, 80)}${hash.length > 80 ? "..." : ""}`
    );
    lines.push(`Length: ${hash.length} characters`);
    lines.push("");

    if (matches.length === 0) {
      lines.push("Result: UNKNOWN FORMAT");
      lines.push(
        "The hash does not match any recognized password hash format."
      );
      lines.push("");
      lines.push("Supported formats:");
      for (const f of HASH_FORMATS) {
        lines.push(`  - ${f.name}: ${f.description}`);
      }
    } else {
      lines.push(
        `Result: VALID FORMAT (${matches.length} match${matches.length > 1 ? "es" : ""})`
      );
      lines.push("");
      for (const m of matches) {
        lines.push(`Format: ${m.name}`);
        lines.push(`Description: ${m.description}`);
        lines.push(`Example: ${m.example}`);
        lines.push("");
      }

      // Warnings for weak hash types
      const weakHashes = ["MD5 (hex)", "SHA-1 (hex)", "MD5 (Unix crypt)"];
      const weakMatches = matches.filter((m) => weakHashes.includes(m.name));
      if (weakMatches.length > 0) {
        lines.push("WARNING: This appears to be a weak hash format.");
        lines.push(
          "Consider using bcrypt, Argon2, or scrypt for password hashing."
        );
      }
    }

    return { output: lines.join("\n") };
  },
});
