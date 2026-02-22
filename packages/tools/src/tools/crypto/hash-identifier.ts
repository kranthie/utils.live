import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Hash string to identify"),
});

const outputSchema = z.object({
  output: z.string().describe("Identified hash type(s)"),
});

interface HashPattern {
  name: string;
  regex: RegExp;
  description: string;
}

const HASH_PATTERNS: HashPattern[] = [
  { name: "MD5", regex: /^[a-f0-9]{32}$/i, description: "128-bit hash" },
  { name: "SHA-1", regex: /^[a-f0-9]{40}$/i, description: "160-bit hash" },
  { name: "RIPEMD-160", regex: /^[a-f0-9]{40}$/i, description: "160-bit hash" },
  { name: "SHA-224", regex: /^[a-f0-9]{56}$/i, description: "224-bit hash" },
  { name: "SHA-256", regex: /^[a-f0-9]{64}$/i, description: "256-bit hash" },
  { name: "SHA-384", regex: /^[a-f0-9]{96}$/i, description: "384-bit hash" },
  { name: "SHA-512", regex: /^[a-f0-9]{128}$/i, description: "512-bit hash" },
  { name: "SHA3-256", regex: /^[a-f0-9]{64}$/i, description: "256-bit hash" },
  { name: "SHA3-512", regex: /^[a-f0-9]{128}$/i, description: "512-bit hash" },
  {
    name: "BLAKE2b-256",
    regex: /^[a-f0-9]{64}$/i,
    description: "256-bit hash",
  },
  {
    name: "BLAKE2b-512",
    regex: /^[a-f0-9]{128}$/i,
    description: "512-bit hash",
  },
  { name: "CRC32", regex: /^[a-f0-9]{8}$/i, description: "32-bit checksum" },
  { name: "Adler-32", regex: /^[a-f0-9]{8}$/i, description: "32-bit checksum" },
  {
    name: "xxHash32",
    regex: /^[a-f0-9]{8}$/i,
    description: "32-bit non-cryptographic hash",
  },
  {
    name: "MurmurHash3-32",
    regex: /^[a-f0-9]{8}$/i,
    description: "32-bit non-cryptographic hash",
  },
  {
    name: "bcrypt",
    regex: /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
    description: "bcrypt password hash",
  },
  {
    name: "Argon2",
    regex: /^\$argon2(i|d|id)\$/,
    description: "Argon2 password hash",
  },
  { name: "PBKDF2", regex: /^\$pbkdf2/, description: "PBKDF2 derived key" },
  { name: "scrypt", regex: /^\$scrypt\$/, description: "scrypt derived key" },
  {
    name: "MD5 (Unix)",
    regex: /^\$1\$[./A-Za-z0-9]{8}\$[./A-Za-z0-9]{22}$/,
    description: "Unix MD5 crypt",
  },
  {
    name: "SHA-256 (Unix)",
    regex: /^\$5\$/,
    description: "Unix SHA-256 crypt",
  },
  {
    name: "SHA-512 (Unix)",
    regex: /^\$6\$/,
    description: "Unix SHA-512 crypt",
  },
  {
    name: "NTLM",
    regex: /^[a-f0-9]{32}$/i,
    description: "32-char hex (same as MD5)",
  },
  {
    name: "MySQL 4.1+",
    regex: /^\*[A-F0-9]{40}$/,
    description: "MySQL password hash",
  },
];

function identifyHash(hash: string): string {
  const trimmed = hash.trim();
  if (!trimmed) {
    throw new Error("Input hash cannot be empty");
  }

  const matches = HASH_PATTERNS.filter((p) => p.regex.test(trimmed));

  if (matches.length === 0) {
    return `Unable to identify hash type.\nInput: ${trimmed}\nLength: ${trimmed.length} characters`;
  }

  const lines = [
    `Input: ${trimmed}`,
    `Length: ${trimmed.length} characters`,
    "",
    "Possible hash types:",
  ];
  const seen = new Set<string>();
  for (const match of matches) {
    const key = match.name;
    if (!seen.has(key)) {
      seen.add(key);
      lines.push(`  - ${match.name} (${match.description})`);
    }
  }

  return lines.join("\n");
}

export const hashIdentifier = defineTool({
  meta: {
    id: "crypto/hash-identifier",
    name: "Hash Identifier",
    description:
      "Free online hash identifier — detect hash types from a hash string instantly in your browser. No data is stored. Recognizes MD5, SHA-1, SHA-256, SHA-512, bcrypt, Argon2, CRC32, and more by length and format.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["hash", "identify", "detect", "type", "md5", "sha", "bcrypt"],
    icon: "Search",
    examples: [
      {
        title: "Identify MD5 Hash",
        description:
          "Detect the type of a hash string by its length and format",
        input: "d41d8cd98f00b204e9800998ecf8427e",
        output:
          "Input: d41d8cd98f00b204e9800998ecf8427e\nLength: 32 characters\n\nPossible hash types:\n  - MD5 (128-bit hash)\n  - NTLM (32-char hex (same as MD5))",
      },
      {
        title: "Identify bcrypt Hash",
        description: "Recognize a bcrypt password hash",
        input: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        output:
          "Input: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy\nLength: 60 characters\n\nPossible hash types:\n  - bcrypt (bcrypt password hash)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    return { output: identifyHash(input.input) };
  },
});
