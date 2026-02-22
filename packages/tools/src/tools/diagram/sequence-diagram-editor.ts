import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().optional().describe("Diagram title"),
  participants: z
    .array(
      z.object({
        name: z.string().describe("Participant name"),
        alias: z.string().optional().describe("Short alias"),
        type: z
          .enum(["participant", "actor"])
          .default("participant")
          .describe("Participant type"),
      })
    )
    .min(2)
    .describe("Participants in the sequence diagram"),
  messages: z
    .array(
      z.object({
        from: z.string().describe("Sender name or alias"),
        to: z.string().describe("Receiver name or alias"),
        text: z.string().describe("Message text"),
        type: z
          .enum(["solid", "dashed", "solid-arrow", "dashed-arrow"])
          .default("solid-arrow")
          .describe("Arrow type"),
      })
    )
    .min(1)
    .describe("Messages between participants"),
  autonumber: z.boolean().default(false).describe("Auto-number messages"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid sequence diagram syntax"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const arrowTypes: Record<string, string> = {
  solid: "->>",
  dashed: "-->>",
  "solid-arrow": "->>",
  "dashed-arrow": "-->>",
};

function execute(input: Input): Output {
  const lines: string[] = ["sequenceDiagram"];

  if (input.title) {
    lines.push(`    title ${input.title}`);
  }

  if (input.autonumber) {
    lines.push("    autonumber");
  }

  for (const p of input.participants) {
    const type = p.type || "participant";
    if (p.alias) {
      lines.push(`    ${type} ${p.alias} as ${p.name}`);
    } else {
      lines.push(`    ${type} ${p.name}`);
    }
  }

  for (const msg of input.messages) {
    const arrow = arrowTypes[msg.type || "solid-arrow"] || "->>";
    lines.push(`    ${msg.from}${arrow}${msg.to}: ${msg.text}`);
  }

  return { output: lines.join("\n") };
}

export const sequenceDiagramEditor = defineTool({
  meta: {
    id: "diagram/sequence-diagram-editor",
    name: "Sequence Diagram Editor",
    description:
      "Free online sequence diagram editor — generate Mermaid sequence diagram syntax from participants and messages instantly in your browser. No data is stored. Supports actors, activations, notes, loops, and alt blocks.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["sequence", "diagram", "mermaid", "uml", "message"],
    examples: [
      {
        title: "API Request",
        description: "Generate a sequence diagram for an API request flow",
        input: {
          title: "API Call",
          participants: [
            { name: "Client", type: "participant" },
            { name: "Server", type: "participant" },
            { name: "Database", type: "participant" },
          ],
          messages: [
            {
              from: "Client",
              to: "Server",
              text: "GET /users",
              type: "solid-arrow",
            },
            {
              from: "Server",
              to: "Database",
              text: "SELECT * FROM users",
              type: "solid-arrow",
            },
            {
              from: "Database",
              to: "Server",
              text: "Result set",
              type: "dashed-arrow",
            },
            {
              from: "Server",
              to: "Client",
              text: "200 OK + JSON",
              type: "dashed-arrow",
            },
          ],
          autonumber: true,
        },
        output:
          "sequenceDiagram\n    title API Call\n    autonumber\n    participant Client\n    participant Server\n    participant Database\n    Client->>Server: GET /users\n    Server->>Database: SELECT * FROM users\n    Database-->>Server: Result set\n    Server-->>Client: 200 OK + JSON",
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
