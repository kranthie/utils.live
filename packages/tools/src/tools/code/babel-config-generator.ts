import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  env: z
    .enum(["browser", "node", "universal"])
    .default("browser")
    .describe("Target environment"),
  typescript: z.boolean().default(false).describe("TypeScript support"),
  react: z.boolean().default(false).describe("React/JSX support"),
  modules: z
    .enum(["auto", "commonjs", "false"])
    .default("auto")
    .describe("Module transformation"),
  targets: z
    .string()
    .default("> 0.25%, not dead")
    .describe("Browserslist targets"),
  decorators: z.boolean().default(false).describe("Decorator support"),
  format: z.enum(["json", "js"]).default("json").describe("Output format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Babel config"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const presets: Array<unknown> = [];
  const plugins: string[] = [];

  // @babel/preset-env
  const envOpts: Record<string, unknown> = {};
  if (input.env === "node") envOpts.targets = { node: "current" };
  else envOpts.targets = input.targets;
  if (input.modules !== "auto")
    envOpts.modules = input.modules === "false" ? false : input.modules;
  envOpts.useBuiltIns = "usage";
  envOpts.corejs = 3;
  presets.push(["@babel/preset-env", envOpts]);

  if (input.typescript) presets.push("@babel/preset-typescript");
  if (input.react)
    presets.push(["@babel/preset-react", { runtime: "automatic" }]);
  if (input.decorators) {
    plugins.push("@babel/plugin-proposal-decorators");
    plugins.push("@babel/plugin-proposal-class-properties");
  }

  const config: Record<string, unknown> = { presets };
  if (plugins.length > 0) config.plugins = plugins;

  if (input.format === "js") {
    return { output: `module.exports = ${JSON.stringify(config, null, 2)};` };
  }
  return { output: JSON.stringify(config, null, 2) };
}

export const babelConfigGenerator = defineTool({
  meta: {
    id: "code/babel-config-generator",
    name: "Babel Config Generator",
    description:
      "Free online Babel config generator — create Babel configuration for browser, Node.js, or universal environments with TypeScript, React, and decorator support instantly in your browser. No data is stored. Outputs JSON or JS module format.",
    category: "code",
    subgroup: "Config Generators",
    tier: ToolTier.CLIENT,
    keywords: ["babel", "config", "transpile", "javascript", "generate"],
    examples: [
      {
        title: "React with TypeScript",
        description: "Generate a Babel config for a React + TypeScript project",
        input: {
          env: "browser",
          typescript: true,
          react: true,
          modules: "auto",
          targets: "> 0.25%, not dead",
          decorators: false,
          format: "json",
        },
        output:
          '{\n  "presets": [\n    [\n      "@babel/preset-env",\n      {\n        "targets": "> 0.25%, not dead",\n        "useBuiltIns": "usage",\n        "corejs": 3\n      }\n    ],\n    "@babel/preset-typescript",\n    [\n      "@babel/preset-react",\n      {\n        "runtime": "automatic"\n      }\n    ]\n  ]\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
