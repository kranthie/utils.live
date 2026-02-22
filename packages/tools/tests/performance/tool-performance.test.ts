import { describe, it, expect } from "vitest";
import { executeTool } from "../../src/core/executor";

// JSON tools
import { jsonFormatter } from "../../src/tools/json/formatter";
import { jsonMinify } from "../../src/tools/json/minify";
import { jsonDiff } from "../../src/tools/json/diff";

// YAML tools
import { yamlFormatter } from "../../src/tools/yaml/formatter";
import { yamlToJson } from "../../src/tools/yaml/to-json";

// XML tools
import { xmlFormatter } from "../../src/tools/xml/formatter";
import { xmlToJson } from "../../src/tools/xml/to-json";

// CSV tools
import { csvToJson } from "../../src/tools/csv/to-json";
import { csvFormatter } from "../../src/tools/csv/formatter";

// Text tools
import { caseConverter } from "../../src/tools/text/case-converter";
import { wordFrequency } from "../../src/tools/text/word-frequency";

// Markdown tools
import { markdownToHtml } from "../../src/tools/markdown/to-html";
import { markdownFormatter } from "../../src/tools/markdown/formatter";

/**
 * Performance threshold in milliseconds.
 * Tools should execute within this time for ~100KB input.
 * Note: YAML parsing is typically slower than JSON due to the format complexity.
 */
const PERFORMANCE_THRESHOLD_MS = 500;

/**
 * Number of iterations for performance tests to get reliable measurements.
 */
const ITERATIONS = 3;

/**
 * Generate a large JSON object (approximately 100KB when stringified).
 */
function generateLargeJson(): string {
  const data = {
    users: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      address: {
        street: `${i} Main Street`,
        city: "Test City",
        state: "TS",
        zip: `${10000 + i}`,
      },
      tags: ["tag1", "tag2", "tag3"],
      active: i % 2 === 0,
    })),
  };
  return JSON.stringify(data);
}

/**
 * Generate a large YAML string (approximately 100KB).
 */
function generateLargeYaml(): string {
  const lines: string[] = ["users:"];
  for (let i = 0; i < 1000; i++) {
    lines.push(`  - id: ${i}`);
    lines.push(`    name: User ${i}`);
    lines.push(`    email: user${i}@example.com`);
    lines.push(`    address:`);
    lines.push(`      street: "${i} Main Street"`);
    lines.push(`      city: Test City`);
    lines.push(`      state: TS`);
    lines.push(`      zip: "${10000 + i}"`);
    lines.push(`    tags:`);
    lines.push(`      - tag1`);
    lines.push(`      - tag2`);
    lines.push(`      - tag3`);
    lines.push(`    active: ${i % 2 === 0}`);
  }
  return lines.join("\n");
}

/**
 * Generate a large XML string (approximately 100KB).
 */
function generateLargeXml(): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<users>"];
  for (let i = 0; i < 500; i++) {
    lines.push(`  <user id="${i}">`);
    lines.push(`    <name>User ${i}</name>`);
    lines.push(`    <email>user${i}@example.com</email>`);
    lines.push(`    <address>`);
    lines.push(`      <street>${i} Main Street</street>`);
    lines.push(`      <city>Test City</city>`);
    lines.push(`      <state>TS</state>`);
    lines.push(`      <zip>${10000 + i}</zip>`);
    lines.push(`    </address>`);
    lines.push(`    <tags>`);
    lines.push(`      <tag>tag1</tag>`);
    lines.push(`      <tag>tag2</tag>`);
    lines.push(`      <tag>tag3</tag>`);
    lines.push(`    </tags>`);
    lines.push(`    <active>${i % 2 === 0}</active>`);
    lines.push(`  </user>`);
  }
  lines.push("</users>");
  return lines.join("\n");
}

/**
 * Generate a large CSV string (approximately 100KB).
 */
function generateLargeCsv(): string {
  const headers = "id,name,email,street,city,state,zip,tag1,tag2,tag3,active";
  const rows: string[] = [headers];
  for (let i = 0; i < 1500; i++) {
    rows.push(
      `${i},User ${i},user${i}@example.com,${i} Main Street,Test City,TS,${10000 + i},tag1,tag2,tag3,${i % 2 === 0}`
    );
  }
  return rows.join("\n");
}

/**
 * Generate a large text string (approximately 100KB).
 */
function generateLargeText(): string {
  const sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Pack my box with five dozen liquor jugs.",
    "How vexingly quick daft zebras jump!",
    "The five boxing wizards jump quickly.",
    "Jackdaws love my big sphinx of quartz.",
  ];

  const paragraphs: string[] = [];
  for (let i = 0; i < 200; i++) {
    const paragraph = Array.from(
      { length: 5 },
      (_, j) => sentences[(i + j) % sentences.length]
    ).join(" ");
    paragraphs.push(paragraph);
  }
  return paragraphs.join("\n\n");
}

/**
 * Generate a large Markdown string (approximately 100KB).
 */
function generateLargeMarkdown(): string {
  const lines: string[] = ["# Large Document", ""];

  for (let i = 0; i < 100; i++) {
    lines.push(`## Section ${i + 1}`);
    lines.push("");
    lines.push(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
    );
    lines.push("");
    lines.push("- Item one with some text content");
    lines.push("- Item two with additional details");
    lines.push("- Item three with more information");
    lines.push("");
    lines.push("```javascript");
    lines.push(`function example${i}() {`);
    lines.push('  console.log("Hello, world!");');
    lines.push("  return true;");
    lines.push("}");
    lines.push("```");
    lines.push("");
    lines.push("| Column 1 | Column 2 | Column 3 |");
    lines.push("|----------|----------|----------|");
    lines.push(`| Value ${i}a | Value ${i}b | Value ${i}c |`);
    lines.push(`| Value ${i}d | Value ${i}e | Value ${i}f |`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Run a tool multiple times and return the median execution time.
 * Includes a warmup run to avoid cold-start JIT skew.
 */
async function measureMedianTime(
  fn: () => Promise<unknown>,
  iterations: number = ITERATIONS
): Promise<number> {
  // Warmup run (not measured) to avoid JIT compilation skew
  await fn();

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Return the median time to reduce noise
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)]!;
}

describe("Performance Tests", () => {
  describe("JSON tools", () => {
    const largeJson = generateLargeJson();

    it(`should format ~100KB JSON in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(jsonFormatter, { input: largeJson });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should minify ~100KB JSON in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(jsonMinify, { input: largeJson });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should diff two ~50KB JSONs in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const json1 = generateLargeJson();
      const parsed = JSON.parse(json1) as {
        users: Array<{ id: number; name: string }>;
      };
      // Make some modifications for diffing
      parsed.users[0]!.name = "Modified User";
      parsed.users.push({ id: 9999, name: "New User" });
      const json2 = JSON.stringify(parsed);

      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(jsonDiff, {
          input1: json1,
          input2: json2,
        });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("YAML tools", () => {
    const largeYaml = generateLargeYaml();

    it(`should format ~100KB YAML in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(yamlFormatter, { input: largeYaml });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should convert ~100KB YAML to JSON in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(yamlToJson, { input: largeYaml });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("XML tools", () => {
    const largeXml = generateLargeXml();

    it(`should format ~100KB XML in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(xmlFormatter, { input: largeXml });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should convert ~100KB XML to JSON in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(xmlToJson, { input: largeXml });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("CSV tools", () => {
    const largeCsv = generateLargeCsv();

    it(`should convert ~100KB CSV to JSON in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(csvToJson, { input: largeCsv });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should format ~100KB CSV in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(csvFormatter, { input: largeCsv });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Text tools", () => {
    const largeText = generateLargeText();

    it(`should convert case for ~100KB text in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(caseConverter, { input: largeText });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should count words in ~100KB text in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(wordFrequency, { input: largeText });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Markdown tools", () => {
    const largeMarkdown = generateLargeMarkdown();

    it(`should convert ~100KB Markdown to HTML in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(markdownToHtml, {
          input: largeMarkdown,
        });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it(`should format ~100KB Markdown in < ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      const avgTime = await measureMedianTime(async () => {
        const result = await executeTool(markdownFormatter, {
          input: largeMarkdown,
        });
        expect(result.success).toBe(true);
      });

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Input size verification", () => {
    it("should generate approximately 100KB test inputs", () => {
      const sizes = {
        json: generateLargeJson().length,
        yaml: generateLargeYaml().length,
        xml: generateLargeXml().length,
        csv: generateLargeCsv().length,
        text: generateLargeText().length,
        markdown: generateLargeMarkdown().length,
      };

      // Verify each is roughly around 100KB (30KB - 250KB is acceptable)
      // Some formats are more verbose than others
      Object.entries(sizes).forEach(([, size]) => {
        expect(size).toBeGreaterThan(30 * 1024);
        expect(size).toBeLessThan(250 * 1024);
      });
    });
  });
});
