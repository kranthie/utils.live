import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First CSV string"),
  input2: z.string().describe("Second CSV string"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether the CSVs are identical"),
  headerDiff: z.object({
    added: z.array(z.string()),
    removed: z.array(z.string()),
    common: z.array(z.string()),
  }),
  rowDiff: z.object({
    added: z.number().describe("Rows only in second CSV"),
    removed: z.number().describe("Rows only in first CSV"),
    modified: z.number().describe("Rows with different values"),
    unchanged: z.number().describe("Identical rows"),
  }),
  details: z.array(
    z.object({
      row: z.number(),
      type: z.enum(["added", "removed", "modified"]),
      data: z.record(z.string(), z.unknown()),
      changes: z.array(z.string()).optional(),
    })
  ),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row is header"),
  delimiter: z.string().max(1).optional().describe("Column delimiter"),
  keyColumn: z
    .string()
    .optional()
    .describe("Column to use as unique key for matching rows"),
  maxDetails: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(100)
    .describe("Maximum detail entries"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface DetailEntry {
  row: number;
  type: "added" | "removed" | "modified";
  data: Record<string, unknown>;
  changes?: string[];
}

/**
 * Compares two CSV files and returns differences.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter;
  const keyColumn = options?.keyColumn;
  const maxDetails = options?.maxDetails ?? 100;

  const parseConfig: Papa.ParseConfig = {
    header,
    skipEmptyLines: true,
  };

  if (delimiter) {
    parseConfig.delimiter = delimiter;
  }

  let data1: Record<string, unknown>[];
  let data2: Record<string, unknown>[];

  try {
    const result1 = Papa.parse(input.input1, parseConfig);
    data1 = result1.data as Record<string, unknown>[];
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV in first input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    const result2 = Papa.parse(input.input2, parseConfig);
    data2 = result2.data as Record<string, unknown>[];
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV in second input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  // Compare headers
  const headers1 = data1.length > 0 && data1[0] ? Object.keys(data1[0]) : [];
  const headers2 = data2.length > 0 && data2[0] ? Object.keys(data2[0]) : [];
  const headerSet1 = new Set(headers1);
  const headerSet2 = new Set(headers2);

  const headerDiff = {
    added: headers2.filter((h) => !headerSet1.has(h)),
    removed: headers1.filter((h) => !headerSet2.has(h)),
    common: headers1.filter((h) => headerSet2.has(h)),
  };

  // Compare rows
  const details: DetailEntry[] = [];
  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  if (keyColumn && headerSet1.has(keyColumn) && headerSet2.has(keyColumn)) {
    // Key-based comparison
    const map1 = new Map(data1.map((row) => [String(row[keyColumn]), row]));
    const map2 = new Map(data2.map((row) => [String(row[keyColumn]), row]));

    // Find removed and modified
    for (const [key, row1] of map1) {
      const row2 = map2.get(key);
      if (!row2) {
        removed++;
        if (details.length < maxDetails) {
          details.push({ row: -1, type: "removed", data: row1 });
        }
      } else {
        const changes: string[] = [];
        for (const col of headerDiff.common) {
          if (JSON.stringify(row1[col]) !== JSON.stringify(row2[col])) {
            changes.push(col);
          }
        }
        if (changes.length > 0) {
          modified++;
          if (details.length < maxDetails) {
            details.push({ row: -1, type: "modified", data: row2, changes });
          }
        } else {
          unchanged++;
        }
      }
    }

    // Find added
    for (const [key, row2] of map2) {
      if (!map1.has(key)) {
        added++;
        if (details.length < maxDetails) {
          details.push({ row: -1, type: "added", data: row2 });
        }
      }
    }
  } else {
    // Position-based comparison
    const maxLen = Math.max(data1.length, data2.length);

    for (let i = 0; i < maxLen; i++) {
      const row1 = data1[i];
      const row2 = data2[i];

      if (!row1) {
        added++;
        if (details.length < maxDetails && row2) {
          details.push({ row: i, type: "added", data: row2 });
        }
      } else if (!row2) {
        removed++;
        if (details.length < maxDetails) {
          details.push({ row: i, type: "removed", data: row1 });
        }
      } else {
        const changes: string[] = [];
        for (const col of headerDiff.common) {
          if (JSON.stringify(row1[col]) !== JSON.stringify(row2[col])) {
            changes.push(col);
          }
        }
        if (changes.length > 0) {
          modified++;
          if (details.length < maxDetails) {
            details.push({ row: i, type: "modified", data: row2, changes });
          }
        } else {
          unchanged++;
        }
      }
    }
  }

  const identical =
    headerDiff.added.length === 0 &&
    headerDiff.removed.length === 0 &&
    added === 0 &&
    removed === 0 &&
    modified === 0;

  return {
    identical,
    headerDiff,
    rowDiff: { added, removed, modified, unchanged },
    details,
  };
}

/**
 * CSV Diff tool.
 * Compares two CSV files and shows differences.
 */
export const csvDiff = defineTool({
  meta: {
    id: "csv/diff",
    name: "CSV Diff",
    description:
      "Free online CSV diff tool — compare two CSV files and show row-level differences instantly in your browser. No data is stored. Supports key-column matching, header change detection, added/removed/modified row tracking, and custom delimiters.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "diff",
      "compare",
      "difference",
      "merge",
      "structural",
      "row",
      "column",
    ],
    ui: { outputRenderer: "json-tree" },
    examples: [
      {
        title: "Compare user lists by ID column",
        description:
          "Detect added, removed, and modified rows between two CSV versions using the id column as key",
        input: {
          input1:
            "id,name,email,role\n1,Alice,alice@example.com,admin\n2,Bob,bob@example.com,editor\n3,Carol,carol@example.com,viewer",
          input2:
            "id,name,email,role\n1,Alice,alice@example.com,admin\n2,Bob,bob@example.com,admin\n4,Dave,dave@example.com,editor",
        },
        options: { keyColumn: "id" },
        output:
          '{"identical":false,"headerDiff":{"added":[],"removed":[],"common":["id","name","email","role"]},"rowDiff":{"added":1,"removed":1,"modified":1,"unchanged":1},"details":[{"row":-1,"type":"modified","data":{"id":"2","name":"Bob","email":"bob@example.com","role":"admin"},"changes":["role"]},{"row":-1,"type":"removed","data":{"id":"3","name":"Carol","email":"carol@example.com","role":"viewer"}},{"row":-1,"type":"added","data":{"id":"4","name":"Dave","email":"dave@example.com","role":"editor"}}]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
