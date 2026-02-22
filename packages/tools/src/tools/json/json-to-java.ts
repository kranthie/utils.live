import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate Java POJOs from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root class"),
  packageName: z
    .string()
    .default("com.example.model")
    .describe("Java package name"),
  useLombok: z.boolean().default(false).describe("Use Lombok annotations"),
  useJackson: z.boolean().default(true).describe("Use Jackson annotations"),
  useGetterSetter: z
    .boolean()
    .default(true)
    .describe("Generate getters/setters"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Java POJOs"),
});

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function toCamelCase(s: string): string {
  const pascal = toPascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function inferJavaType(
  value: unknown,
  name: string,
  classes: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): string {
  if (value === null) return "Object";
  switch (typeof value) {
    case "string":
      return "String";
    case "number":
      return Number.isInteger(value)
        ? Math.abs(value) > 2147483647
          ? "Long"
          : "Integer"
        : "Double";
    case "boolean":
      return "Boolean";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "List<Object>";
        const first: unknown = value[0];
        if (
          first !== null &&
          typeof first === "object" &&
          !Array.isArray(first)
        ) {
          const merged: Record<string, unknown> = {};
          for (const item of value) {
            if (item && typeof item === "object") {
              for (const [k, v] of Object.entries(
                item as Record<string, unknown>
              )) {
                if (!(k in merged)) merged[k] = v;
              }
            }
          }
          const className = toPascalCase(name);
          generateClass(merged, className, classes, opts);
          return `List<${className}>`;
        }
        return `List<${inferJavaType(first, name, classes, opts)}>`;
      }
      const className = toPascalCase(name);
      generateClass(value as Record<string, unknown>, className, classes, opts);
      return className;
    }
    default:
      return "Object";
  }
}

function generateClass(
  obj: Record<string, unknown>,
  name: string,
  classes: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): void {
  if (classes.has(name)) return;
  classes.set(name, "");

  const fieldEntries = Object.entries(obj).map(([key, value]) => ({
    name: toCamelCase(key),
    type: inferJavaType(value, key, classes, opts),
    origKey: key,
  }));

  const lines: string[] = [];

  if (opts.useLombok) {
    lines.push("@Data");
    lines.push("@NoArgsConstructor");
    lines.push("@AllArgsConstructor");
  }

  lines.push(`public class ${name} {`);
  lines.push("");

  for (const f of fieldEntries) {
    if (opts.useJackson && f.name !== f.origKey) {
      lines.push(`    @JsonProperty("${f.origKey}")`);
    }
    lines.push(`    private ${f.type} ${f.name};`);
  }

  if (!opts.useLombok && opts.useGetterSetter) {
    lines.push("");
    // Constructor
    lines.push(`    public ${name}() {}`);
    lines.push("");

    for (const f of fieldEntries) {
      // Getter
      lines.push(`    public ${f.type} get${toPascalCase(f.name)}() {`);
      lines.push(`        return ${f.name};`);
      lines.push(`    }`);
      lines.push("");
      // Setter
      lines.push(
        `    public void set${toPascalCase(f.name)}(${f.type} ${f.name}) {`
      );
      lines.push(`        this.${f.name} = ${f.name};`);
      lines.push(`    }`);
      lines.push("");
    }
  }

  lines.push("}");
  classes.set(name, lines.join("\n"));
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const opts = {
    rootName: options?.rootName ?? "Root",
    packageName: options?.packageName ?? "com.example.model",
    useLombok: options?.useLombok ?? false,
    useJackson: options?.useJackson ?? true,
    useGetterSetter: options?.useGetterSetter ?? true,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const classes = new Map<string, string>();

  if (
    Array.isArray(parsed) &&
    parsed.length > 0 &&
    typeof parsed[0] === "object"
  ) {
    const merged: Record<string, unknown> = {};
    for (const item of parsed) {
      if (item && typeof item === "object") {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          if (!(k in merged)) merged[k] = v;
        }
      }
    }
    generateClass(merged, opts.rootName, classes, opts);
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed)
  ) {
    generateClass(
      parsed as Record<string, unknown>,
      opts.rootName,
      classes,
      opts
    );
  } else {
    return { output: `// JSON primitive type: ${typeof parsed}` };
  }

  const imports: string[] = [`package ${opts.packageName};`, ""];
  imports.push("import java.util.List;");
  if (opts.useJackson)
    imports.push("import com.fasterxml.jackson.annotation.JsonProperty;");
  if (opts.useLombok) {
    imports.push("import lombok.Data;");
    imports.push("import lombok.NoArgsConstructor;");
    imports.push("import lombok.AllArgsConstructor;");
  }
  imports.push("");

  const entries = [...classes.values()].reverse();
  return { output: imports.join("\n") + entries.join("\n\n") };
}

export const jsonToJava = defineTool({
  meta: {
    id: "json/json-to-java",
    name: "JSON to Java",
    description:
      "Free online JSON to Java converter — generate Java POJOs from JSON data with Jackson and Lombok support instantly in your browser. No data is stored. Includes getters/setters and import statements.",
    category: "json",
    subgroup: "Code Generation",
    tier: ToolTier.CLIENT,
    keywords: ["json", "java", "pojo", "class", "codegen", "jackson"],
    ui: { inputLanguage: "json", outputLanguage: "java" },
    examples: [
      {
        title: "User Object",
        description:
          "Generate a Java POJO with Jackson annotations from a user object",
        input:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true\n}',
        output:
          "package com.example.model;\n\nimport java.util.List;\nimport com.fasterxml.jackson.annotation.JsonProperty;\npublic class Root {\n\n    private Integer id;\n    private String name;\n    private String email;\n    private Boolean active;\n\n    public Root() {}\n\n    public Integer getId() {\n        return id;\n    }\n\n    public void setId(Integer id) {\n        this.id = id;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public void setName(String name) {\n        this.name = name;\n    }\n\n    public String getEmail() {\n        return email;\n    }\n\n    public void setEmail(String email) {\n        this.email = email;\n    }\n\n    public Boolean getActive() {\n        return active;\n    }\n\n    public void setActive(Boolean active) {\n        this.active = active;\n    }\n\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
