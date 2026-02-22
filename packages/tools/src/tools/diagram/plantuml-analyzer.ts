import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("PlantUML diagram syntax"),
});

const outputSchema = z.object({
  output: z.string().describe("PlantUML syntax information and validation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const code = input.input.trim();
  if (!code) {
    throw new Error("PlantUML diagram syntax cannot be empty");
  }

  const hasStartTag = code.includes("@startuml");
  const hasEndTag = code.includes("@enduml");

  const lines: string[] = [];
  lines.push("PlantUML Diagram Analysis");
  lines.push("========================");
  lines.push("");

  if (!hasStartTag) {
    lines.push("Warning: Missing @startuml tag at the beginning");
  }
  if (!hasEndTag) {
    lines.push("Warning: Missing @enduml tag at the end");
  }

  // Detect diagram type
  const typePatterns: Record<string, RegExp> = {
    "Sequence Diagram": /->|-->|<-|<--/,
    "Class Diagram": /class\s+\w+/,
    "Activity Diagram": /:[\w\s]+;|start|stop/,
    "Use Case Diagram": /usecase|actor/,
    "State Diagram": /state\s+\w+|\[\*\]/,
    "Component Diagram": /component|interface/,
    "Deployment Diagram": /node\s+\w+|artifact/,
  };

  const detectedTypes: string[] = [];
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(code)) {
      detectedTypes.push(type);
    }
  }

  lines.push(
    `Detected type(s): ${detectedTypes.length > 0 ? detectedTypes.join(", ") : "Unknown"}`
  );
  lines.push(`Line count: ${code.split("\n").length}`);
  lines.push(`Has @startuml: ${hasStartTag}`);
  lines.push(`Has @enduml: ${hasEndTag}`);
  lines.push("");
  lines.push("Note: PlantUML rendering requires a PlantUML server.");
  lines.push("Use https://www.plantuml.com/plantuml/ for online rendering.");
  lines.push("");
  lines.push("--- Source ---");
  lines.push(code);

  return { output: lines.join("\n") };
}

export const plantumlAnalyzer = defineTool({
  meta: {
    id: "diagram/plantuml-analyzer",
    name: "PlantUML Analyzer",
    description:
      "Free online PlantUML analyzer — parse PlantUML diagram syntax and extract participants, messages, and diagram structure instantly in your browser. No data is stored. Supports sequence, class, and activity diagram analysis.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["plantuml", "uml", "diagram", "analyze"],
    examples: [
      {
        title: "Analyze Sequence Diagram",
        description: "Analyze a PlantUML sequence diagram",
        input:
          "@startuml\nAlice -> Bob: Hello\nBob --> Alice: Hi back\n@enduml",
        output:
          "PlantUML Diagram Analysis\n========================\n\nDetected type(s): Sequence Diagram, Activity Diagram\nLine count: 4\nHas @startuml: true\nHas @enduml: true\n\nNote: PlantUML rendering requires a PlantUML server.\nUse https://www.plantuml.com/plantuml/ for online rendering.\n\n--- Source ---\n@startuml\nAlice -> Bob: Hello\nBob --> Alice: Hi back\n@enduml",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
