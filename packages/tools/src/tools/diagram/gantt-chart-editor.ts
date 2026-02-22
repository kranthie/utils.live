import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Project Schedule").describe("Chart title"),
  dateFormat: z.string().default("YYYY-MM-DD").describe("Date format string"),
  sections: z
    .array(
      z.object({
        name: z.string().describe("Section name"),
        tasks: z
          .array(
            z.object({
              name: z.string().describe("Task name"),
              id: z.string().optional().describe("Task ID for dependencies"),
              status: z
                .enum(["done", "active", "crit", ""])
                .default("")
                .describe("Task status"),
              start: z.string().describe("Start date or 'after taskId'"),
              duration: z
                .string()
                .describe("Duration (e.g., '5d', '2w') or end date"),
            })
          )
          .min(1)
          .describe("Tasks in this section"),
      })
    )
    .min(1)
    .describe("Gantt chart sections"),
  excludes: z
    .string()
    .optional()
    .describe("Exclude certain days (e.g., 'weekends')"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid Gantt chart syntax"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines: string[] = ["gantt"];
  lines.push(`    title ${input.title}`);
  lines.push(`    dateFormat ${input.dateFormat}`);

  if (input.excludes) {
    lines.push(`    excludes ${input.excludes}`);
  }

  for (const section of input.sections) {
    lines.push(`    section ${section.name}`);
    for (const task of section.tasks) {
      const parts: string[] = [];
      parts.push(`        ${task.name}`);

      const meta: string[] = [];
      if (task.status) meta.push(task.status);
      if (task.id) meta.push(task.id);
      meta.push(task.start);
      meta.push(task.duration);

      parts.push(meta.join(", "));
      lines.push(`${parts[0]} : ${parts[1]}`);
    }
  }

  return { output: lines.join("\n") };
}

export const ganttChartEditor = defineTool({
  meta: {
    id: "diagram/gantt-chart-editor",
    name: "Gantt Chart Editor",
    description:
      "Free online Gantt chart editor — generate Mermaid Gantt chart syntax from project sections, tasks, and timelines instantly in your browser. No data is stored. Supports task dependencies, milestones, and active/done/critical status.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["gantt", "chart", "schedule", "project", "timeline", "mermaid"],
    examples: [
      {
        title: "Sprint Plan",
        description: "Generate a Gantt chart for a sprint",
        input: {
          title: "Sprint 1",
          dateFormat: "YYYY-MM-DD",
          sections: [
            {
              name: "Design",
              tasks: [
                {
                  name: "Wireframes",
                  id: "w1",
                  status: "done",
                  start: "2024-01-01",
                  duration: "3d",
                },
                {
                  name: "Mockups",
                  status: "active",
                  start: "after w1",
                  duration: "5d",
                },
              ],
            },
            {
              name: "Development",
              tasks: [
                {
                  name: "Frontend",
                  status: "",
                  start: "2024-01-09",
                  duration: "10d",
                },
              ],
            },
          ],
        },
        output:
          "gantt\n    title Sprint 1\n    dateFormat YYYY-MM-DD\n    section Design\n        Wireframes : done, w1, 2024-01-01, 3d\n        Mockups : active, after w1, 5d\n    section Development\n        Frontend : 2024-01-09, 10d",
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
