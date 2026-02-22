import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Password to analyze"),
});

const outputSchema = z.object({
  output: z.string().describe("Password strength analysis"),
});

function analyzePassword(password: string): string {
  if (!password) {
    throw new Error("Password cannot be empty");
  }

  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const hasSpace = /\s/.test(password);

  // Character pool size
  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 33;
  if (hasSpace) poolSize += 1;

  // Entropy
  const entropy = length * Math.log2(poolSize || 1);

  // Check for common patterns
  const warnings: string[] = [];

  // Sequential characters
  let sequential = 0;
  for (let i = 1; i < password.length; i++) {
    if (password.charCodeAt(i) === password.charCodeAt(i - 1) + 1) {
      sequential++;
    }
  }
  if (sequential > 2) {
    warnings.push("Contains sequential characters (abc, 123)");
  }

  // Repeated characters
  let maxRepeat = 0;
  let currentRepeat = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      currentRepeat++;
      maxRepeat = Math.max(maxRepeat, currentRepeat);
    } else {
      currentRepeat = 1;
    }
  }
  if (maxRepeat > 2) {
    warnings.push(`Has ${maxRepeat} repeated consecutive characters`);
  }

  // Common passwords check (small set)
  const commonPasswords = [
    "password",
    "123456",
    "qwerty",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "master",
    "dragon",
    "login",
    "abc123",
    "password1",
    "iloveyou",
    "trustno1",
    "sunshine",
    "princess",
    "football",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    warnings.push("This is a commonly used password");
  }

  // Keyboard patterns
  const keyboardPatterns = ["qwerty", "asdf", "zxcv", "qazwsx", "1qaz", "2wsx"];
  for (const pattern of keyboardPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      warnings.push("Contains keyboard pattern");
      break;
    }
  }

  // Score calculation (0-100)
  let score = 0;

  // Length scoring
  score += Math.min(length * 4, 40);

  // Character variety
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean
  ).length;
  score += variety * 10;

  // Entropy bonus
  score += Math.min(entropy / 2, 20);

  // Penalties
  if (warnings.length > 0) {
    score -= warnings.length * 10;
  }
  if (length < 8) score -= 20;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Strength label
  let strength: string;
  if (score >= 80) strength = "Very Strong";
  else if (score >= 60) strength = "Strong";
  else if (score >= 40) strength = "Moderate";
  else if (score >= 20) strength = "Weak";
  else strength = "Very Weak";

  // Time to crack estimate
  let crackTime: string;
  const guessesPerSec = 1e10; // 10 billion (modern GPU cluster)
  const totalGuesses = Math.pow(poolSize || 1, length);
  const seconds = totalGuesses / guessesPerSec / 2;

  if (seconds < 1) crackTime = "Instantly";
  else if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`;
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`;
  else if (seconds < 31536000)
    crackTime = `${Math.round(seconds / 86400)} days`;
  else if (seconds < 31536000 * 1000)
    crackTime = `${Math.round(seconds / 31536000)} years`;
  else if (seconds < 31536000 * 1e6)
    crackTime = `${Math.round(seconds / 31536000 / 1000)}k years`;
  else crackTime = "Centuries+";

  const lines = [
    "=== Password Strength Analysis ===",
    "",
    `Password length: ${length}`,
    `Strength: ${strength} (${score}/100)`,
    `Entropy: ${entropy.toFixed(1)} bits`,
    `Character pool: ${poolSize} characters`,
    `Estimated crack time: ${crackTime} (10B guesses/sec)`,
    "",
    "Character types:",
    `  Lowercase: ${hasLower ? "Yes" : "No"}`,
    `  Uppercase: ${hasUpper ? "Yes" : "No"}`,
    `  Numbers: ${hasDigit ? "Yes" : "No"}`,
    `  Symbols: ${hasSymbol ? "Yes" : "No"}`,
    `  Spaces: ${hasSpace ? "Yes" : "No"}`,
  ];

  if (warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const w of warnings) {
      lines.push(`  - ${w}`);
    }
  }

  // Recommendations
  const recommendations: string[] = [];
  if (length < 12) recommendations.push("Use at least 12 characters");
  if (!hasUpper) recommendations.push("Add uppercase letters");
  if (!hasDigit) recommendations.push("Add numbers");
  if (!hasSymbol) recommendations.push("Add special characters");
  if (variety < 3) recommendations.push("Use more character types");

  if (recommendations.length > 0) {
    lines.push("");
    lines.push("Recommendations:");
    for (const r of recommendations) {
      lines.push(`  - ${r}`);
    }
  }

  return lines.join("\n");
}

export const passwordStrength = defineTool({
  meta: {
    id: "crypto/password-strength",
    name: "Password Strength Analyzer",
    description:
      "Free online password strength analyzer — analyze password security instantly in your browser. No data is stored. Calculates entropy, crack time estimates, detects common patterns, keyboard sequences, and repeated characters.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "password",
      "strength",
      "analyze",
      "entropy",
      "security",
      "crack",
    ],
    icon: "ShieldCheck",
    examples: [
      {
        title: "Weak Password",
        description: "Analyze a common weak password",
        input: "password123",
        output:
          "=== Password Strength Analysis ===\n\nPassword length: 11\nStrength: Very Strong (80/100)\nEntropy: 56.9 bits\nCharacter pool: 36 characters\nEstimated crack time: 76 days (10B guesses/sec)\n\nCharacter types:\n  Lowercase: Yes\n  Uppercase: No\n  Numbers: Yes\n  Symbols: No\n  Spaces: No\n\nRecommendations:\n  - Use at least 12 characters\n  - Add uppercase letters\n  - Add special characters\n  - Use more character types",
      },
      {
        title: "Strong Password",
        description: "Analyze a strong password with mixed character types",
        input: "Tr0ub4dor&3#Kx!m",
        output:
          "=== Password Strength Analysis ===\n\nPassword length: 16\nStrength: Very Strong (100/100)\nEntropy: 105.1 bits\nCharacter pool: 95 characters\nEstimated crack time: Centuries+ (10B guesses/sec)\n\nCharacter types:\n  Lowercase: Yes\n  Uppercase: Yes\n  Numbers: Yes\n  Symbols: Yes\n  Spaces: No",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    return { output: analyzePassword(input.input) };
  },
});
