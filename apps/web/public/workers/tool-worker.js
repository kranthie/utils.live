/**
 * Web Worker for CPU-intensive tool operations.
 * Handles tool execution off the main thread to prevent UI blocking.
 *
 * Uses Comlink for seamless communication with the main thread.
 */

import { expose } from "comlink";

/**
 * Process large text data in chunks.
 * Useful for operations that need to process megabytes of text.
 *
 * @param {string} input - The input string to process
 * @param {string} operation - The operation type (split, join, transform)
 * @param {Record<string, unknown>} options - Processing options
 * @returns {Promise<unknown>} The processed result
 */
async function processLargeText(input, operation, options = {}) {
  try {
    const chunkSize = options.chunkSize || 1024 * 1024; // 1MB default
    const results = [];

    switch (operation) {
      case "lineCount":
        let lineCount = 0;
        for (let i = 0; i < input.length; i++) {
          if (input[i] === "\n") lineCount++;
        }
        return { success: true, data: lineCount + 1 };

      case "wordCount":
        const words = input.trim().split(/\s+/).filter(Boolean);
        return { success: true, data: words.length };

      case "charCount":
        return { success: true, data: input.length };

      case "findReplace":
        const { find, replace, regex, flags } = options;
        let processed;
        if (regex) {
          const re = new RegExp(find, flags || "g");
          processed = input.replace(re, replace || "");
        } else {
          processed = input.split(find).join(replace || "");
        }
        return { success: true, data: processed };

      case "sort":
        const lines = input.split("\n");
        const sortedLines = options.reverse
          ? lines.sort().reverse()
          : lines.sort();
        return { success: true, data: sortedLines.join("\n") };

      case "unique":
        const uniqueLines = [...new Set(input.split("\n"))];
        return { success: true, data: uniqueLines.join("\n") };

      case "reverse":
        if (options.byLine) {
          return {
            success: true,
            data: input.split("\n").reverse().join("\n"),
          };
        }
        return { success: true, data: input.split("").reverse().join("") };

      case "base64encode":
        return {
          success: true,
          data: btoa(unescape(encodeURIComponent(input))),
        };

      case "base64decode":
        return { success: true, data: decodeURIComponent(escape(atob(input))) };

      default:
        return {
          success: false,
          error: {
            code: "UNKNOWN_OPERATION",
            message: `Unknown operation: ${operation}`,
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "WORKER_PROCESSING_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Hash a string using the SubtleCrypto API.
 *
 * @param {string} input - The input string to hash
 * @param {string} algorithm - The hash algorithm (SHA-1, SHA-256, SHA-384, SHA-512)
 * @returns {Promise<string>} The hex-encoded hash
 */
async function hashString(input, algorithm = "SHA-256") {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { success: true, data: hashHex };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "HASH_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Parse and format JSON in the worker.
 *
 * @param {string} input - The JSON string to parse/format
 * @param {Record<string, unknown>} options - Formatting options
 * @returns {Promise<unknown>} The parsed or formatted result
 */
async function processJson(input, options = {}) {
  try {
    const parsed = JSON.parse(input);

    if (options.minify) {
      return { success: true, data: JSON.stringify(parsed) };
    }

    const indent = options.indent ?? 2;
    return { success: true, data: JSON.stringify(parsed, null, indent) };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "JSON_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Validate regex patterns in the worker.
 *
 * @param {string} pattern - The regex pattern to validate
 * @param {string} testString - Optional test string to match against
 * @param {string} flags - Regex flags
 * @returns {Promise<unknown>} Validation result and matches
 */
async function validateRegex(pattern, testString = "", flags = "") {
  try {
    const regex = new RegExp(pattern, flags);

    if (!testString) {
      return {
        success: true,
        data: { valid: true, pattern: regex.source, flags: regex.flags },
      };
    }

    const matches = [];
    let match;

    if (flags.includes("g")) {
      while ((match = regex.exec(testString)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups || {},
          captures: match.slice(1),
        });
        if (!flags.includes("g")) break;
      }
    } else {
      match = regex.exec(testString);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups || {},
          captures: match.slice(1),
        });
      }
    }

    return {
      success: true,
      data: {
        valid: true,
        pattern: regex.source,
        flags: regex.flags,
        matches,
        matchCount: matches.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "REGEX_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// The worker API exposed to the main thread
const workerApi = {
  processLargeText,
  hashString,
  processJson,
  validateRegex,

  // Utility: Check if worker is responsive
  ping: () => "pong",

  // Get worker capabilities
  getCapabilities: () => ({
    subtleCrypto: typeof crypto?.subtle !== "undefined",
    textEncoder: typeof TextEncoder !== "undefined",
    performance: typeof performance !== "undefined",
  }),
};

// Expose the API via Comlink
expose(workerApi);
