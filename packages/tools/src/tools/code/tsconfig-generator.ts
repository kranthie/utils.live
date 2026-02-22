import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  target: z
    .enum(["ES2020", "ES2021", "ES2022", "ES2023", "ESNext"])
    .default("ES2022")
    .describe("Target ECMAScript version"),
  module: z
    .enum(["commonjs", "ESNext", "NodeNext", "ES2022"])
    .default("ESNext")
    .describe("Module system"),
  framework: z
    .enum(["none", "nextjs", "react", "node", "library"])
    .default("none")
    .describe("Framework preset"),
  strict: z.boolean().default(true).describe("Enable strict mode"),
  declaration: z.boolean().default(false).describe("Generate .d.ts files"),
  sourceMap: z.boolean().default(true).describe("Generate source maps"),
  outDir: z.string().default("dist").describe("Output directory"),
  rootDir: z.string().default("src").describe("Root directory"),
  jsx: z
    .enum(["none", "react", "react-jsx", "react-jsxdev", "preserve"])
    .default("none")
    .describe("JSX support"),
  paths: z.boolean().default(false).describe("Include path aliases"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated tsconfig.json"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const config: Record<string, unknown> = { compilerOptions: {} };
  const opts = config.compilerOptions as Record<string, unknown>;

  opts.target = input.target;
  opts.module = input.module;
  opts.lib = ["ES2022", "DOM", "DOM.Iterable"];
  if (input.module === "NodeNext" || input.module === "ESNext")
    opts.moduleResolution =
      input.module === "NodeNext" ? "NodeNext" : "bundler";
  else opts.moduleResolution = "node";
  opts.esModuleInterop = true;
  opts.forceConsistentCasingInFileNames = true;
  opts.resolveJsonModule = true;
  opts.isolatedModules = true;
  opts.skipLibCheck = true;

  if (input.strict) {
    opts.strict = true;
    opts.noUncheckedIndexedAccess = true;
    opts.noImplicitOverride = true;
  }

  if (input.declaration) {
    opts.declaration = true;
    opts.declarationMap = true;
  }
  if (input.sourceMap) opts.sourceMap = true;
  opts.outDir = `./${input.outDir}`;
  opts.rootDir = `./${input.rootDir}`;

  if (input.jsx !== "none") opts.jsx = input.jsx;

  if (input.paths) {
    opts.baseUrl = ".";
    opts.paths = { "@/*": [`./${input.rootDir}/*`] };
  }

  if (input.framework === "nextjs") {
    opts.jsx = "preserve";
    opts.incremental = true;
    opts.plugins = [{ name: "next" }];
    config.include = [
      "next-env.d.ts",
      "**/*.ts",
      "**/*.tsx",
      ".next/types/**/*.ts",
    ];
    config.exclude = ["node_modules"];
  } else if (input.framework === "react") {
    opts.jsx = "react-jsx";
    config.include = ["src"];
    config.exclude = ["node_modules", "dist"];
  } else if (input.framework === "node") {
    opts.module = "NodeNext";
    opts.moduleResolution = "NodeNext";
    delete opts.lib;
    opts.lib = ["ES2022"];
    config.include = ["src"];
    config.exclude = ["node_modules", "dist"];
  } else if (input.framework === "library") {
    opts.declaration = true;
    opts.declarationMap = true;
    config.include = ["src"];
    config.exclude = ["node_modules", "dist", "**/*.test.ts"];
  } else {
    config.include = ["src"];
    config.exclude = ["node_modules", "dist"];
  }

  return { output: JSON.stringify(config, null, 2) };
}

export const tsconfigGenerator = defineTool({
  meta: {
    id: "code/tsconfig-generator",
    name: "tsconfig.json Generator",
    description:
      "Free online tsconfig.json generator — create TypeScript compiler configuration for Next.js, React, Node.js, or library projects with strict mode, path aliases, and source maps instantly in your browser. No data is stored.",
    category: "code",
    subgroup: "Config Generators",
    tier: ToolTier.CLIENT,
    keywords: ["tsconfig", "typescript", "config", "generate", "compiler"],
    examples: [
      {
        title: "Next.js tsconfig",
        description: "Generate a tsconfig.json for a Next.js project",
        input: {
          target: "ES2022",
          module: "ESNext",
          framework: "nextjs",
          strict: true,
          declaration: false,
          sourceMap: true,
          outDir: "dist",
          rootDir: "src",
          jsx: "none",
          paths: true,
        },
        output:
          '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "lib": [\n      "ES2022",\n      "DOM",\n      "DOM.Iterable"\n    ],\n    "moduleResolution": "bundler",\n    "esModuleInterop": true,\n    "forceConsistentCasingInFileNames": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "skipLibCheck": true,\n    "strict": true,\n    "noUncheckedIndexedAccess": true,\n    "noImplicitOverride": true,\n    "sourceMap": true,\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "baseUrl": ".",\n    "paths": {\n      "@/*": [\n        "./src/*"\n      ]\n    },\n    "jsx": "preserve",\n    "incremental": true,\n    "plugins": [\n      {\n        "name": "next"\n      }\n    ]\n  },\n  "include": [\n    "next-env.d.ts",\n    "**/*.ts",\n    "**/*.tsx",\n    ".next/types/**/*.ts"\n  ],\n  "exclude": [\n    "node_modules"\n  ]\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
