import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { passwordGenerator } from "../../../src/tools/crypto/password-generator";
import { passphraseGenerator } from "../../../src/tools/crypto/passphrase-generator";
import { passwordStrength } from "../../../src/tools/crypto/password-strength";
import { pinGenerator } from "../../../src/tools/crypto/pin-generator";
import { memorablePassword } from "../../../src/tools/crypto/memorable-password";
import { passwordHashCheck } from "../../../src/tools/crypto/password-hash-check";
import { passwordEntropy } from "../../../src/tools/crypto/password-entropy";
import { apiKeyGenerator } from "../../../src/tools/crypto/api-key-generator";

describe("Password Generator", () => {
  it("should generate a password with default options", async () => {
    const result = await executeTool(passwordGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output.length).toBe(16);
    }
  });

  it("should generate a password of specified length", async () => {
    const result = await executeTool(passwordGenerator, { length: 32 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output.length).toBe(32);
    }
  });

  it("should generate multiple passwords", async () => {
    const result = await executeTool(passwordGenerator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const passwords = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(passwords.length).toBe(5);
    }
  });

  it("should include symbols when requested", async () => {
    const result = await executeTool(passwordGenerator, {
      length: 100,
      includeSymbols: true,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /[!@#$%^&*()_+\-=[\]{}|;:',.<>?/~`]/
      );
    }
  });

  it("should generate unique passwords each time", async () => {
    const r1 = await executeTool(passwordGenerator, { length: 32 });
    const r2 = await executeTool(passwordGenerator, { length: 32 });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should exclude ambiguous characters when requested", async () => {
    const result = await executeTool(passwordGenerator, {
      length: 100,
      excludeAmbiguous: true,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toMatch(
        /[0OIl1]/
      );
    }
  });
});

describe("Passphrase Generator", () => {
  it("should generate a passphrase with default options", async () => {
    const result = await executeTool(passphraseGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      const words = String(
        (result.data as Record<string, unknown>).output
      ).split("-");
      expect(words.length).toBe(6);
    }
  });

  it("should respect word count", async () => {
    const result = await executeTool(passphraseGenerator, { wordCount: 4 });
    expect(result.success).toBe(true);
    if (result.success) {
      const words = String(
        (result.data as Record<string, unknown>).output
      ).split("-");
      expect(words.length).toBe(4);
    }
  });

  it("should capitalize words when requested", async () => {
    const result = await executeTool(passphraseGenerator, {
      wordCount: 3,
      capitalize: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const words = String(
        (result.data as Record<string, unknown>).output
      ).split("-");
      for (const word of words) {
        expect(word[0]).toBe(word[0]!.toUpperCase());
      }
    }
  });

  it("should use custom separator", async () => {
    const result = await executeTool(passphraseGenerator, {
      wordCount: 3,
      separator: "_",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("_");
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "-"
      );
    }
  });

  it("should append number when requested", async () => {
    const result = await executeTool(passphraseGenerator, {
      wordCount: 3,
      includeNumber: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const parts = String(
        (result.data as Record<string, unknown>).output
      ).split("-");
      expect(parts.length).toBe(4); // 3 words + 1 number
      expect(parts[parts.length - 1]).toMatch(/^\d+$/);
    }
  });

  it("should generate multiple passphrases", async () => {
    const result = await executeTool(passphraseGenerator, {
      wordCount: 3,
      count: 4,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const passphrases = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(passphrases.length).toBe(4);
    }
  });
});

describe("Password Strength Analyzer", () => {
  it("should analyze a strong password", async () => {
    const result = await executeTool(passwordStrength, {
      input: "C0mpl3x!P@ssw0rd#2024",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Strength:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Entropy:"
      );
    }
  });

  it("should identify weak passwords", async () => {
    const result = await executeTool(passwordStrength, { input: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /Weak|Very Weak/
      );
    }
  });

  it("should detect common passwords", async () => {
    const result = await executeTool(passwordStrength, { input: "password" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "commonly used password"
      );
    }
  });

  it("should detect sequential characters", async () => {
    const result = await executeTool(passwordStrength, { input: "abcdefgh" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "sequential"
      );
    }
  });

  it("should fail on empty password", async () => {
    const result = await executeTool(passwordStrength, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("PIN Generator", () => {
  it("should generate a 4-digit PIN by default", async () => {
    const result = await executeTool(pinGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^\d{4}$/
      );
    }
  });

  it("should generate a PIN of specified length", async () => {
    const result = await executeTool(pinGenerator, { length: 6 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^\d{6}$/
      );
    }
  });

  it("should generate multiple PINs", async () => {
    const result = await executeTool(pinGenerator, { count: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      const pins = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(pins.length).toBe(10);
      for (const pin of pins) {
        expect(pin).toMatch(/^\d{4}$/);
      }
    }
  });

  it("should generate unique PINs each time", async () => {
    const r1 = await executeTool(pinGenerator, { length: 8 });
    const r2 = await executeTool(pinGenerator, { length: 8 });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      // Note: there's a tiny chance of collision but with 8 digits it's ~1 in 100M
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should generate non-repeating PINs when allowRepeating is false", async () => {
    const result = await executeTool(pinGenerator, {
      length: 10,
      allowRepeating: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const digits = String(
        (result.data as Record<string, unknown>).output
      ).split("");
      const unique = new Set(digits);
      expect(unique.size).toBe(10);
    }
  });
});

describe("Memorable Password Generator", () => {
  it("should generate word-number-word pattern by default", async () => {
    const result = await executeTool(memorablePassword, {});
    expect(result.success).toBe(true);
    if (result.success) {
      // Default generates 5 passwords
      const passwords = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(passwords.length).toBe(5);
    }
  });

  it("should generate a single password", async () => {
    const result = await executeTool(memorablePassword, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).split("\n")
          .length
      ).toBe(1);
      // Should start with an uppercase letter (capitalized word)
      expect((result.data as Record<string, unknown>).output[0]).toMatch(
        /[A-Z]/
      );
    }
  });

  it("should generate adjective-noun-number pattern", async () => {
    const result = await executeTool(memorablePassword, {
      pattern: "adjective-noun-number",
      count: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Should contain a number at the end
      expect((result.data as Record<string, unknown>).output).toMatch(/\d+$/);
      // Should start with uppercase letter
      expect((result.data as Record<string, unknown>).output[0]).toMatch(
        /[A-Z]/
      );
    }
  });

  it("should generate unique passwords", async () => {
    const r1 = await executeTool(memorablePassword, { count: 1 });
    const r2 = await executeTool(memorablePassword, { count: 1 });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      // Very unlikely to be same given randomness
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should generate word-symbol-word-number pattern", async () => {
    const result = await executeTool(memorablePassword, {
      pattern: "word-symbol-word-number",
      count: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Should contain at least one symbol
      expect((result.data as Record<string, unknown>).output).toMatch(
        /[!@#$%&*+=?]/
      );
    }
  });
});

describe("Password Hash Format Check", () => {
  it("should identify bcrypt hash", async () => {
    const result = await executeTool(passwordHashCheck, {
      input: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "bcrypt"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "VALID FORMAT"
      );
    }
  });

  it("should identify MD5 hex hash", async () => {
    const result = await executeTool(passwordHashCheck, {
      input: "d41d8cd98f00b204e9800998ecf8427e",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("MD5");
      expect((result.data as Record<string, unknown>).output).toContain(
        "VALID FORMAT"
      );
    }
  });

  it("should identify SHA-256 hex hash", async () => {
    const result = await executeTool(passwordHashCheck, {
      input: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-256"
      );
    }
  });

  it("should report unknown format for unrecognized hash", async () => {
    const result = await executeTool(passwordHashCheck, {
      input: "not-a-valid-hash-format",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "UNKNOWN FORMAT"
      );
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(passwordHashCheck, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should warn about weak hash formats", async () => {
    const result = await executeTool(passwordHashCheck, {
      input: "d41d8cd98f00b204e9800998ecf8427e",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "WARNING"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "weak hash format"
      );
    }
  });
});

describe("Password Entropy Calculator", () => {
  it("should calculate entropy for a simple password", async () => {
    const result = await executeTool(passwordEntropy, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Standard entropy:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Shannon entropy:"
      );
      expect((result.data as Record<string, unknown>).output).toContain("bits");
    }
  });

  it("should detect character classes", async () => {
    const result = await executeTool(passwordEntropy, { input: "Hello123!" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Lowercase (a-z): Yes"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Uppercase (A-Z): Yes"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Digits (0-9): Yes"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Symbols: Yes"
      );
    }
  });

  it("should show security level", async () => {
    const result = await executeTool(passwordEntropy, { input: "Ab" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Security level:"
      );
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(passwordEntropy, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should show higher entropy for longer passwords", async () => {
    const r1 = await executeTool(passwordEntropy, { input: "abc" });
    const r2 = await executeTool(passwordEntropy, {
      input: "abcdefghijklmnop",
    });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      const entropy1 = parseFloat(
        String((r1.data as Record<string, unknown>).output).match(
          /Standard entropy: ([\d.]+)/
        )?.[1] || "0"
      );
      const entropy2 = parseFloat(
        String((r2.data as Record<string, unknown>).output).match(
          /Standard entropy: ([\d.]+)/
        )?.[1] || "0"
      );
      expect(entropy2).toBeGreaterThan(entropy1);
    }
  });
});

describe("API Key Generator", () => {
  it("should generate base62 key by default", async () => {
    const result = await executeTool(apiKeyGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[A-Za-z0-9]{32}$/
      );
    }
  });

  it("should generate hex format key", async () => {
    const result = await executeTool(apiKeyGenerator, {
      format: "hex",
      length: 32,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{32}$/
      );
    }
  });

  it("should add prefix", async () => {
    const result = await executeTool(apiKeyGenerator, {
      prefix: "sk_test_",
      format: "base62",
      length: 24,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^sk_test_[A-Za-z0-9]{24}$/
      );
    }
  });

  it("should generate multiple keys", async () => {
    const result = await executeTool(apiKeyGenerator, { count: 5, length: 16 });
    expect(result.success).toBe(true);
    if (result.success) {
      const keys = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(keys.length).toBe(5);
    }
  });

  it("should generate unique keys each time", async () => {
    const r1 = await executeTool(apiKeyGenerator, { length: 32 });
    const r2 = await executeTool(apiKeyGenerator, { length: 32 });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should generate alphanumeric format key", async () => {
    const result = await executeTool(apiKeyGenerator, {
      format: "alphanumeric",
      length: 32,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[A-Za-z0-9]{32}$/
      );
    }
  });
});
