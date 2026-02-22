import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Avro schema in JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted Avro schema"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let schema: unknown;
  try {
    schema = JSON.parse(input.input);
  } catch {
    throw new Error("Invalid JSON: Could not parse the Avro schema");
  }

  if (typeof schema !== "object" || schema === null) {
    throw new Error("Avro schema must be a JSON object");
  }

  const record = schema as Record<string, unknown>;
  const validTypes = [
    "record",
    "enum",
    "array",
    "map",
    "fixed",
    "null",
    "boolean",
    "int",
    "long",
    "float",
    "double",
    "bytes",
    "string",
  ];

  if (
    record.type &&
    typeof record.type === "string" &&
    !validTypes.includes(record.type)
  ) {
    throw new Error(
      `Invalid Avro type: '${record.type}'. Valid types: ${validTypes.join(", ")}`
    );
  }

  return { output: JSON.stringify(schema, null, 2) };
}

export const avroSchemaFormatter = defineTool({
  meta: {
    id: "data/avro-schema-formatter",
    name: "Avro Schema Formatter",
    description:
      "Free online Avro schema formatter — pretty-print and validate Apache Avro schema JSON instantly in your browser. No data is stored. Validates Avro types (record, enum, array, map, fixed) and formats nested field definitions with proper indentation.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "avro",
      "schema",
      "format",
      "pretty-print",
      "apache",
      "kafka",
      "hadoop",
      "data-serialization",
      "json",
      "validate",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Format Avro Record Schema",
        description: "Pretty-print an Avro record schema with fields",
        input:
          '{"type":"record","name":"User","fields":[{"name":"id","type":"int"},{"name":"name","type":"string"}]}',
        output:
          '{\n  "type": "record",\n  "name": "User",\n  "fields": [\n    {\n      "name": "id",\n      "type": "int"\n    },\n    {\n      "name": "name",\n      "type": "string"\n    }\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
