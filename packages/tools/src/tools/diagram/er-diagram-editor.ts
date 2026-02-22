import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().optional().describe("Diagram title"),
  entities: z
    .array(
      z.object({
        name: z.string().describe("Entity name"),
        attributes: z
          .array(
            z.object({
              type: z.string().describe("Attribute data type"),
              name: z.string().describe("Attribute name"),
              key: z
                .enum(["PK", "FK", "UK", ""])
                .default("")
                .describe("Key type"),
              comment: z.string().optional().describe("Attribute comment"),
            })
          )
          .default([])
          .describe("Entity attributes"),
      })
    )
    .min(1)
    .describe("Entities in the ER diagram"),
  relationships: z
    .array(
      z.object({
        from: z.string().describe("Left entity name"),
        to: z.string().describe("Right entity name"),
        fromCardinality: z
          .enum(["||", "|{", "o|", "o{"])
          .describe(
            "Left cardinality (||=exactly one, |{=one or more, o|=zero or one, o{=zero or more)"
          ),
        toCardinality: z
          .enum(["||", "}|", "|o", "}o"])
          .describe("Right cardinality"),
        label: z.string().describe("Relationship label"),
      })
    )
    .default([])
    .describe("Relationships between entities"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid ER diagram syntax"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines: string[] = ["erDiagram"];

  if (input.title) {
    lines.push(`    %% ${input.title}`);
  }

  for (const entity of input.entities) {
    if (entity.attributes.length > 0) {
      lines.push(`    ${entity.name} {`);
      for (const attr of entity.attributes) {
        const keyStr = attr.key ? ` ${attr.key}` : "";
        const commentStr = attr.comment ? ` "${attr.comment}"` : "";
        lines.push(`        ${attr.type} ${attr.name}${keyStr}${commentStr}`);
      }
      lines.push("    }");
    }
  }

  for (const rel of input.relationships) {
    lines.push(
      `    ${rel.from} ${rel.fromCardinality}--${rel.toCardinality} ${rel.to} : "${rel.label}"`
    );
  }

  return { output: lines.join("\n") };
}

export const erDiagramEditor = defineTool({
  meta: {
    id: "diagram/er-diagram-editor",
    name: "ER Diagram Editor",
    description:
      "Free online ER diagram editor — generate Mermaid entity-relationship diagram syntax from entities, attributes, and relationships instantly in your browser. No data is stored. Supports primary/foreign key annotations and cardinality notation.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: [
      "er",
      "entity",
      "relationship",
      "diagram",
      "database",
      "mermaid",
    ],
    examples: [
      {
        title: "Blog Database",
        description: "Generate an ER diagram for a blog database",
        input: {
          title: "Blog Schema",
          entities: [
            {
              name: "User",
              attributes: [
                { type: "int", name: "id", key: "PK" },
                { type: "string", name: "email", key: "UK" },
                { type: "string", name: "name", key: "" },
              ],
            },
            {
              name: "Post",
              attributes: [
                { type: "int", name: "id", key: "PK" },
                { type: "int", name: "author_id", key: "FK" },
                { type: "string", name: "title", key: "" },
              ],
            },
          ],
          relationships: [
            {
              from: "User",
              to: "Post",
              fromCardinality: "||",
              toCardinality: "}o",
              label: "writes",
            },
          ],
        },
        output:
          'erDiagram\n    %% Blog Schema\n    User {\n        int id PK\n        string email UK\n        string name\n    }\n    Post {\n        int id PK\n        int author_id FK\n        string title\n    }\n    User ||--}o Post : "writes"',
      },
    ],
    ui: {
      outputRenderer: "diagram",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
