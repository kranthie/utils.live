import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Protocol Buffer .proto file content"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted .proto content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function formatProto(input: string): string {
  const lines = input.split("\n");
  const result: string[] = [];
  let indentLevel = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      continue;
    }

    // Handle closing braces
    if (trimmed.startsWith("}")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indent = "  ".repeat(indentLevel);

    // Handle comments
    if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
      result.push(`${indent}${trimmed}`);
    } else if (
      trimmed.startsWith("syntax") ||
      trimmed.startsWith("package") ||
      trimmed.startsWith("option")
    ) {
      result.push(`${indent}${trimmed}`);
    } else if (trimmed.startsWith("import")) {
      result.push(`${indent}${trimmed}`);
    } else if (
      trimmed.startsWith("message") ||
      trimmed.startsWith("service") ||
      trimmed.startsWith("enum") ||
      trimmed.startsWith("oneof") ||
      trimmed.startsWith("extend")
    ) {
      // Ensure blank line before message/service/enum
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      result.push(`${indent}${trimmed}`);
    } else if (trimmed.startsWith("rpc")) {
      result.push(`${indent}${trimmed}`);
    } else {
      result.push(`${indent}${trimmed}`);
    }

    // Handle opening braces
    if (trimmed.endsWith("{")) {
      indentLevel++;
    }
  }

  // Remove trailing blank lines
  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }

  return result.join("\n") + "\n";
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const formatted = formatProto(input.input);
  return { output: formatted };
}

export const protobufEditor = defineTool({
  meta: {
    id: "data/protobuf-editor",
    name: "Protobuf Editor",
    description:
      "Free online Protobuf editor — format and indent Protocol Buffer .proto files instantly in your browser. No data is stored. Auto-indents message, service, enum, and oneof blocks with consistent 2-space indentation.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "protobuf",
      "proto",
      "protocol",
      "buffer",
      "grpc",
      "format",
      "indent",
      "schema",
    ],
    ui: { inputLanguage: "protobuf" },
    examples: [
      {
        title: "User message with name and age fields",
        description:
          "Format a Protocol Buffer message definition with proper indentation",
        input:
          'syntax = "proto3";\n\nmessage User {\nstring name = 1;\nint32 age = 2;\n}',
        output:
          'syntax = "proto3";\n\nmessage User {\n  string name = 1;\n  int32 age = 2;\n}\n',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
