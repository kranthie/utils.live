import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["contributor-covenant", "citizen-code", "minimal"])
    .default("contributor-covenant")
    .describe("Code of conduct type"),
});

const optionsSchema = z.object({
  projectName: z.string().default("Project").describe("Project name"),
  contactEmail: z
    .string()
    .default("conduct@example.com")
    .describe("Contact email"),
});

const outputSchema = z.object({
  output: z.string().describe("Code of conduct content"),
  filename: z.string().describe("Suggested filename"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Generates code of conduct documents.
 */
function execute(input: Input, options?: Options): Output {
  const projectName = options?.projectName ?? "Project";
  const contactEmail = options?.contactEmail ?? "conduct@example.com";

  let output: string;

  switch (input.type) {
    case "minimal":
      output = `# Code of Conduct

## Our Pledge

We pledge to make participation in ${projectName} a harassment-free experience for everyone.

## Our Standards

**Positive behavior:**
- Being respectful and inclusive
- Accepting constructive criticism gracefully
- Focusing on what is best for the community

**Unacceptable behavior:**
- Harassment, trolling, or personal attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## Enforcement

Violations may be reported to ${contactEmail}. All complaints will be reviewed and investigated.

## Attribution

This Code of Conduct is adapted from the Contributor Covenant.
`;
      break;

    case "citizen-code":
      output = `# Citizen Code of Conduct

## 1. Purpose

${projectName} is dedicated to providing a harassment-free experience for everyone. We do not tolerate harassment of participants in any form.

## 2. Expected Behavior

- Participate authentically and actively
- Exercise consideration and respect
- Attempt collaboration before conflict
- Refrain from demeaning, discriminatory, or harassing behavior

## 3. Unacceptable Behavior

- Violence, threats of violence, or violent language
- Discriminatory jokes and language
- Posting sexually explicit or violent material
- Personal insults
- Inappropriate photography or recording
- Unwelcome sexual attention
- Advocating for or encouraging any of the above

## 4. Consequences

Unacceptable behavior will not be tolerated. Anyone asked to stop is expected to comply immediately.

## 5. Reporting

If you experience unacceptable behavior, report it to ${contactEmail}.

## 6. Addressing Grievances

If you feel falsely accused, contact us with a description of your grievance.

## 7. Scope

This code applies within project spaces and in public when representing the project.

## 8. Contact

${contactEmail}
`;
      break;

    case "contributor-covenant":
    default:
      output = `# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in ${projectName} a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste, color, religion, or sexual identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming, diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience
* Focusing on what is best not just for us as individuals, but for the overall community

Examples of unacceptable behavior:

* The use of sexualized language or imagery, and sexual attention or advances of any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information without explicit permission
* Other conduct which could reasonably be considered inappropriate in a professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful.

## Scope

This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public spaces.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement at ${contactEmail}. All complaints will be reviewed and investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.
`;
      break;
  }

  return { output, filename: "CODE_OF_CONDUCT.md" };
}

/**
 * Code of Conduct Generator tool.
 * Generates code of conduct documents.
 */
export const codeOfConduct = defineTool({
  meta: {
    id: "markdown/code-of-conduct",
    name: "Code of Conduct Generator",
    description:
      "Free online code of conduct generator — create Contributor Covenant, Citizen Code, or minimal code of conduct documents instantly in your browser. No data is stored. Customize with your project name and contact email.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "code-of-conduct", "community", "guidelines"],
    examples: [
      {
        title: "Generate Contributor Covenant",
        description: "Create a standard Code of Conduct document",
        input: { type: "contributor-covenant" },
        output:
          "# Contributor Covenant Code of Conduct\n\n## Our Pledge\n\nWe as members, contributors, and leaders pledge to make participation in Project a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste, color, religion, or sexual identity and orientation.\n\nWe pledge to act and interact in ways that contribute to an open, welcoming, diverse, inclusive, and healthy community.\n\n## Our Standards\n\nExamples of behavior that contributes to a positive environment:\n\n* Demonstrating empathy and kindness toward other people\n* Being respectful of differing opinions, viewpoints, and experiences\n* Giving and gracefully accepting constructive feedback\n* Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience\n* Focusing on what is best not just for us as individuals, but for the overall community\n\nExamples of unacceptable behavior:\n\n* The use of sexualized language or imagery, and sexual attention or advances of any kind\n* Trolling, insulting or derogatory comments, and personal or political attacks\n* Public or private harassment\n* Publishing others' private information without explicit permission\n* Other conduct which could reasonably be considered inappropriate in a professional setting\n\n## Enforcement Responsibilities\n\nCommunity leaders are responsible for clarifying and enforcing our standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful.\n\n## Scope\n\nThis Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public spaces.\n\n## Enforcement\n\nInstances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement at conduct@example.com. All complaints will be reviewed and investigated promptly and fairly.\n\n## Attribution\n\nThis Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
