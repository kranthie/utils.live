import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Password to calculate entropy for"),
});

const outputSchema = z.object({
  output: z.string().describe("Password entropy calculation"),
});

export const passwordEntropy = defineTool({
  meta: {
    id: "crypto/password-entropy",
    name: "Password Entropy Calculator",
    description:
      "Free online password entropy calculator — calculate password entropy in bits instantly in your browser. No data is stored. Computes standard and Shannon entropy, character pool analysis, and security level assessment.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "password",
      "entropy",
      "bits",
      "information",
      "security",
      "strength",
    ],
    icon: "Calculator",
    examples: [
      {
        title: "Calculate Entropy",
        description: "Measure the entropy of a password to assess its strength",
        input: "MyP@ssw0rd!2024",
        output:
          "=== Password Entropy Analysis ===\n\nPassword length: 15 characters\nUnique characters: 12\nCharacter pool size: 95\n\nStandard entropy: 98.55 bits\nShannon entropy: 52.60 bits\nBits per character: 6.57\n\nSecurity level: Very Good (strong)\nKey equivalent: DES-equivalent or weaker\n\nCharacter classes used:\n  Lowercase (a-z): Yes (+26)\n  Uppercase (A-Z): Yes (+26)\n  Digits (0-9): Yes (+10)\n  Symbols: Yes (+33)\n  Spaces: No\n  Unicode: No\n\nEntropy thresholds:\n  28 bits  = Weak       [PASS]\n  40 bits  = Fair       [PASS]\n  60 bits  = Good       [PASS]\n  80 bits  = Strong     [PASS]\n  128 bits = Excellent  [FAIL]",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const password = input.input;
    if (!password) {
      throw new Error("Password cannot be empty");
    }

    const length = password.length;

    // Calculate character pool size
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9\s]/.test(password);
    const hasSpace = /\s/.test(password);
    const hasUnicode = password.split("").some((ch) => ch.charCodeAt(0) > 127);

    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigit) poolSize += 10;
    if (hasSymbol) poolSize += 33;
    if (hasSpace) poolSize += 1;
    if (hasUnicode) poolSize += 100; // Approximate for Unicode

    // Standard entropy: log2(poolSize^length)
    const standardEntropy = length * Math.log2(poolSize || 1);

    // Shannon entropy (based on character frequency)
    const freq = new Map<string, number>();
    for (const char of password) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    let shannonEntropy = 0;
    for (const count of freq.values()) {
      const p = count / length;
      shannonEntropy -= p * Math.log2(p);
    }
    // Normalize to total bits
    const shannonTotal = shannonEntropy * length;

    // Unique characters
    const uniqueChars = freq.size;

    // Bits per character
    const bitsPerChar = standardEntropy / length;

    // Security level
    let securityLevel: string;
    if (standardEntropy >= 128) securityLevel = "Excellent (military-grade)";
    else if (standardEntropy >= 80) securityLevel = "Very Good (strong)";
    else if (standardEntropy >= 60) securityLevel = "Good (adequate)";
    else if (standardEntropy >= 40) securityLevel = "Fair (minimum acceptable)";
    else if (standardEntropy >= 28) securityLevel = "Weak (easily cracked)";
    else securityLevel = "Very Weak (trivially cracked)";

    // Equivalent key size comparison
    let keyEquivalent: string;
    if (standardEntropy >= 256) keyEquivalent = "AES-256 or stronger";
    else if (standardEntropy >= 192) keyEquivalent = "AES-192 equivalent";
    else if (standardEntropy >= 128) keyEquivalent = "AES-128 equivalent";
    else if (standardEntropy >= 80) keyEquivalent = "DES-equivalent or weaker";
    else keyEquivalent = "Below any standard key length";

    const lines = [
      "=== Password Entropy Analysis ===",
      "",
      `Password length: ${length} characters`,
      `Unique characters: ${uniqueChars}`,
      `Character pool size: ${poolSize}`,
      "",
      `Standard entropy: ${standardEntropy.toFixed(2)} bits`,
      `Shannon entropy: ${shannonTotal.toFixed(2)} bits`,
      `Bits per character: ${bitsPerChar.toFixed(2)}`,
      "",
      `Security level: ${securityLevel}`,
      `Key equivalent: ${keyEquivalent}`,
      "",
      "Character classes used:",
      `  Lowercase (a-z): ${hasLower ? "Yes (+26)" : "No"}`,
      `  Uppercase (A-Z): ${hasUpper ? "Yes (+26)" : "No"}`,
      `  Digits (0-9): ${hasDigit ? "Yes (+10)" : "No"}`,
      `  Symbols: ${hasSymbol ? "Yes (+33)" : "No"}`,
      `  Spaces: ${hasSpace ? "Yes (+1)" : "No"}`,
      `  Unicode: ${hasUnicode ? "Yes (+~100)" : "No"}`,
      "",
      "Entropy thresholds:",
      `  28 bits  = Weak       ${standardEntropy >= 28 ? "[PASS]" : "[FAIL]"}`,
      `  40 bits  = Fair       ${standardEntropy >= 40 ? "[PASS]" : "[FAIL]"}`,
      `  60 bits  = Good       ${standardEntropy >= 60 ? "[PASS]" : "[FAIL]"}`,
      `  80 bits  = Strong     ${standardEntropy >= 80 ? "[PASS]" : "[FAIL]"}`,
      `  128 bits = Excellent  ${standardEntropy >= 128 ? "[PASS]" : "[FAIL]"}`,
    ];

    return { output: lines.join("\n") };
  },
});
