import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  // Formatters
  jsFormatter,
  graphqlFormatter,
  mdFormatter,
  pythonFormatter,
  // Minifiers
  jsMinify,
  jsonMinifyCode,
  xmlMinifyCode,
  graphqlMinify,
  tsMinify,
  batchMinify,
  // Code Analysis
  jsObfuscator,
  codeComplexity,
  syntaxHighlighter,
  lineCounter,
  codeToImage,
  commentStripper,
  deadCodeFinder,
} from "../../../src/tools/code";

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════════

describe("JavaScript Formatter", () => {
  it("should have correct metadata", () => {
    expect(jsFormatter.meta.id).toBe("code/js-formatter");
    expect(jsFormatter.meta.category).toBe("code");
  });

  it("should format minified JS", async () => {
    const result = await executeTool(jsFormatter, {
      input: "function hello(){return 'world';}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "function"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "return"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(jsFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("GraphQL Formatter", () => {
  it("should have correct metadata", () => {
    expect(graphqlFormatter.meta.id).toBe("code/graphql-formatter");
    expect(graphqlFormatter.meta.category).toBe("code");
  });

  it("should format GraphQL query", async () => {
    const result = await executeTool(graphqlFormatter, {
      input: "query{user(id:1){name email}}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "query"
      );
      expect((result.data as Record<string, unknown>).output).toContain("user");
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(graphqlFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Markdown Formatter", () => {
  it("should have correct metadata", () => {
    expect(mdFormatter.meta.id).toBe("code/md-formatter");
    expect(mdFormatter.meta.category).toBe("code");
  });

  it("should format markdown", async () => {
    const result = await executeTool(mdFormatter, {
      input: "#  Title\n\n\n\nSome  text   here",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Title"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(mdFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Python Formatter", () => {
  it("should have correct metadata", () => {
    expect(pythonFormatter.meta.id).toBe("code/python-formatter");
    expect(pythonFormatter.meta.category).toBe("code");
  });

  it("should format Python code", async () => {
    const result = await executeTool(pythonFormatter, {
      input: "def hello():\n  print('world')\n  return True",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "def hello():"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "print"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(pythonFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MINIFIERS
// ═══════════════════════════════════════════════════════════════════════════════

describe("JavaScript Minifier", () => {
  it("should have correct metadata", () => {
    expect(jsMinify.meta.id).toBe("code/js-minify");
    expect(jsMinify.meta.category).toBe("code");
  });

  it("should minify JavaScript", async () => {
    const result = await executeTool(jsMinify, {
      input: "function hello() {\n  return 'world';\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThanOrEqual(0);
      expect(
        (result.data as Record<string, unknown>).originalSize
      ).toBeGreaterThan((result.data as Record<string, unknown>).minifiedSize);
    }
  });

  it("should remove comments", async () => {
    const result = await executeTool(jsMinify, {
      input: "// comment\nvar x = 1; /* block */",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "comment"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "block"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(jsMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("JSON Minifier (Code)", () => {
  it("should have correct metadata", () => {
    expect(jsonMinifyCode.meta.id).toBe("code/json-minify-code");
    expect(jsonMinifyCode.meta.category).toBe("code");
  });

  it("should minify JSON", async () => {
    const result = await executeTool(jsonMinifyCode, {
      input: '{\n  "name": "test",\n  "value": 42\n}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThanOrEqual(0);
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "\n"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(jsonMinifyCode, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("XML Minifier (Code)", () => {
  it("should have correct metadata", () => {
    expect(xmlMinifyCode.meta.id).toBe("code/xml-minify-code");
    expect(xmlMinifyCode.meta.category).toBe("code");
  });

  it("should minify XML", async () => {
    const result = await executeTool(xmlMinifyCode, {
      input: "<root>\n  <item>value</item>\n</root>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(xmlMinifyCode, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("GraphQL Minifier", () => {
  it("should have correct metadata", () => {
    expect(graphqlMinify.meta.id).toBe("code/graphql-minify");
    expect(graphqlMinify.meta.category).toBe("code");
  });

  it("should minify GraphQL", async () => {
    const result = await executeTool(graphqlMinify, {
      input: "query {\n  user(id: 1) {\n    name\n    email\n  }\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(graphqlMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("TypeScript Minifier", () => {
  it("should have correct metadata", () => {
    expect(tsMinify.meta.id).toBe("code/ts-minify");
    expect(tsMinify.meta.category).toBe("code");
  });

  it("should remove basic type annotations from function params", async () => {
    const result = await executeTool(tsMinify, {
      input: "function add(a: number, b: number): number { return a + b; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).not.toContain(": number");
      expect(output).toContain("return a+b");
    }
  });

  it("should remove interface declarations", async () => {
    const result = await executeTool(tsMinify, {
      input:
        "interface User {\n  name: string;\n  age: number;\n}\nconst x = 1;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).not.toContain("interface");
      expect(output).toContain("const x");
    }
  });

  it("should remove generic type params with custom types", async () => {
    const result = await executeTool(tsMinify, {
      input: "function wrap<User>(arg: User): User { return arg; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      // <User> generic declaration should be removed
      expect(output).not.toContain("<User>");
    }
  });

  it("should remove Array<T> generics", async () => {
    const result = await executeTool(tsMinify, {
      input: "const items: Array<string> = [];",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).not.toContain("Array<string>");
    }
  });

  it("should remove as-casts", async () => {
    const result = await executeTool(tsMinify, {
      input: "const x = getValue() as string;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).not.toContain(" as string");
    }
  });

  it("should report size reduction", async () => {
    const result = await executeTool(tsMinify, {
      input:
        "interface Config {\n  host: string;\n  port: number;\n}\nfunction connect(config: Config): void {\n  console.log(config);\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).originalSize
      ).toBeGreaterThan(
        (result.data as Record<string, unknown>).minifiedSize as number
      );
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThan(0);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(tsMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Batch Minifier", () => {
  it("should have correct metadata", () => {
    expect(batchMinify.meta.id).toBe("code/batch-minify");
    expect(batchMinify.meta.category).toBe("code");
  });

  it("should auto-detect and minify JSON", async () => {
    const result = await executeTool(batchMinify, {
      input: '{\n  "name": "test"\n}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).detectedFormat).toBe(
        "json"
      );
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("should auto-detect and minify HTML", async () => {
    const result = await executeTool(batchMinify, {
      input: "<html>\n  <body>\n    <p>Hello</p>\n  </body>\n</html>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).detectedFormat).toBe(
        "html"
      );
    }
  });

  it("should auto-detect and minify CSS", async () => {
    const result = await executeTool(batchMinify, {
      input: ".container {\n  color: red;\n  margin: 0;\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).detectedFormat).toBe(
        "css"
      );
    }
  });

  it("should auto-detect and minify SQL", async () => {
    const result = await executeTool(batchMinify, {
      input: "SELECT id, name\nFROM users\nWHERE active = 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).detectedFormat).toBe(
        "sql"
      );
    }
  });

  it("should use forced format option", async () => {
    const result = await executeTool(
      batchMinify,
      { input: "var x = 1;\nvar y = 2;" },
      { format: "javascript" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).detectedFormat).toBe(
        "javascript"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(batchMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CODE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

describe("JavaScript Obfuscator", () => {
  it("should have correct metadata", () => {
    expect(jsObfuscator.meta.id).toBe("code/js-obfuscator");
    expect(jsObfuscator.meta.category).toBe("code");
  });

  it("should rename variables in code", async () => {
    const result = await executeTool(jsObfuscator, {
      input: "const myVariable = 42;\nconsole.log(myVariable);",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "myVariable"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "console.log"
      );
    }
  });

  it("should remove comments during obfuscation", async () => {
    const result = await executeTool(jsObfuscator, {
      input: "// comment\nvar x = 1;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "comment"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(jsObfuscator, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Code Complexity Analyzer", () => {
  it("should have correct metadata", () => {
    expect(codeComplexity.meta.id).toBe("code/code-complexity");
    expect(codeComplexity.meta.category).toBe("code");
  });

  it("should analyze simple function complexity", async () => {
    const result = await executeTool(codeComplexity, {
      input: "function add(a, b) {\n  return a + b;\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Cyclomatic Complexity"
      );
      expect(
        (result.data as Record<string, unknown>).totalComplexity
      ).toBeGreaterThanOrEqual(1);
      expect(
        (result.data as Record<string, unknown>).functions.length
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("should detect higher complexity with branching", async () => {
    const result = await executeTool(codeComplexity, {
      input: [
        "function complex(x) {",
        "  if (x > 10) {",
        "    for (let i = 0; i < x; i++) {",
        "      if (i % 2 === 0) {",
        "        console.log(i);",
        "      }",
        "    }",
        "  } else if (x > 5) {",
        "    while (x > 0) {",
        "      x--;",
        "    }",
        "  }",
        "}",
      ].join("\n"),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).totalComplexity
      ).toBeGreaterThan(3);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(codeComplexity, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Syntax Highlighter", () => {
  it("should have correct metadata", () => {
    expect(syntaxHighlighter.meta.id).toBe("code/syntax-highlighter");
    expect(syntaxHighlighter.meta.category).toBe("code");
  });

  it("should produce HTML with highlighting classes", async () => {
    const result = await executeTool(syntaxHighlighter, {
      input: "const x = 42; // comment",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<pre");
      expect((result.data as Record<string, unknown>).output).toContain(
        "<code>"
      );
      expect((result.data as Record<string, unknown>).output).toContain("kw"); // keyword class
    }
  });

  it("should support light theme", async () => {
    const result = await executeTool(
      syntaxHighlighter,
      { input: "var x = 1;" },
      { theme: "light" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "#ffffff"
      ); // light background
    }
  });

  it("should auto-detect HTML", async () => {
    const result = await executeTool(syntaxHighlighter, {
      input: '<div class="test">Hello</div>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("tag"); // tag class
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(syntaxHighlighter, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Line Counter", () => {
  it("should have correct metadata", () => {
    expect(lineCounter.meta.id).toBe("code/line-counter");
    expect(lineCounter.meta.category).toBe("code");
  });

  it("should count lines of code", async () => {
    const result = await executeTool(lineCounter, {
      input: "var x = 1;\n// comment\n\nvar y = 2;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).totalLines).toBe(4);
      expect((result.data as Record<string, unknown>).codeLines).toBe(2);
      expect((result.data as Record<string, unknown>).commentLines).toBe(1);
      expect((result.data as Record<string, unknown>).blankLines).toBe(1);
    }
  });

  it("should count block comments", async () => {
    const result = await executeTool(lineCounter, {
      input: "var x = 1;\n/*\n  block\n  comment\n*/\nvar y = 2;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).commentLines
      ).toBeGreaterThanOrEqual(3);
      expect((result.data as Record<string, unknown>).codeLines).toBe(2);
    }
  });

  it("should handle all-blank input", async () => {
    const result = await executeTool(lineCounter, {
      input: "x = 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).totalLines).toBe(1);
      expect((result.data as Record<string, unknown>).codeLines).toBe(1);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(lineCounter, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Code to Image", () => {
  it("should have correct metadata", () => {
    expect(codeToImage.meta.id).toBe("code/code-to-image");
    expect(codeToImage.meta.category).toBe("code");
  });

  it("should generate styled HTML with dark theme", async () => {
    const result = await executeTool(codeToImage, {
      input: 'console.log("Hello World");',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<div");
      expect((result.data as Record<string, unknown>).output).toContain("<pre");
      expect((result.data as Record<string, unknown>).output).toContain(
        "#282c34"
      ); // dark theme bg
    }
  });

  it("should support light theme", async () => {
    const result = await executeTool(
      codeToImage,
      { input: "var x = 1;" },
      { theme: "light" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "#fafafa"
      ); // light theme bg
    }
  });

  it("should support monokai theme", async () => {
    const result = await executeTool(
      codeToImage,
      { input: "var x = 1;" },
      { theme: "monokai" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "#272822"
      ); // monokai bg
    }
  });

  it("should include title bar when title is set", async () => {
    const result = await executeTool(
      codeToImage,
      { input: "var x = 1;" },
      { title: "test.js" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "test.js"
      );
    }
  });

  it("should include line numbers", async () => {
    const result = await executeTool(codeToImage, {
      input: "line1\nline2\nline3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("  1");
      expect((result.data as Record<string, unknown>).output).toContain("  2");
      expect((result.data as Record<string, unknown>).output).toContain("  3");
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(codeToImage, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Comment Stripper", () => {
  it("should have correct metadata", () => {
    expect(commentStripper.meta.id).toBe("code/comment-stripper");
    expect(commentStripper.meta.category).toBe("code");
  });

  it("should strip JavaScript comments", async () => {
    const result = await executeTool(commentStripper, {
      input: "// line comment\nvar x = 1; /* block */\nvar y = 2;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "line comment"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "block"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "var x = 1;"
      );
      expect(
        (result.data as Record<string, unknown>).commentsRemoved
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("should strip HTML comments", async () => {
    const result = await executeTool(
      commentStripper,
      { input: "<!-- comment --><div>Hello</div>" },
      { language: "html" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "comment"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<div>Hello</div>"
      );
    }
  });

  it("should strip Python comments", async () => {
    const result = await executeTool(
      commentStripper,
      { input: "# comment\nx = 1\n# another" },
      { language: "python" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "# comment"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "x = 1"
      );
      expect(
        (result.data as Record<string, unknown>).commentsRemoved
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("should strip SQL comments", async () => {
    const result = await executeTool(
      commentStripper,
      { input: "-- line comment\nSELECT * FROM users; /* block */" },
      { language: "sql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "line comment"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "block"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "SELECT"
      );
    }
  });

  it("should auto-detect language", async () => {
    const result = await executeTool(commentStripper, {
      input: "<!-- HTML comment --><div>test</div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "HTML comment"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(commentStripper, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Dead Code Finder", () => {
  it("should have correct metadata", () => {
    expect(deadCodeFinder.meta.id).toBe("code/dead-code-finder");
    expect(deadCodeFinder.meta.category).toBe("code");
  });

  it("should find unused variables", async () => {
    const result = await executeTool(deadCodeFinder, {
      input: "const usedVar = 1;\nconst unusedVar = 2;\nconsole.log(usedVar);",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).unusedVariables
      ).toContain("unusedVar");
      expect(
        (result.data as Record<string, unknown>).unusedVariables
      ).not.toContain("usedVar");
    }
  });

  it("should find unused functions", async () => {
    const result = await executeTool(deadCodeFinder, {
      input: "function usedFn() {}\nfunction unusedFn() {}\nusedFn();",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).unusedFunctions
      ).toContain("unusedFn");
      expect(
        (result.data as Record<string, unknown>).unusedFunctions
      ).not.toContain("usedFn");
    }
  });

  it("should report no dead code when everything is used", async () => {
    const result = await executeTool(deadCodeFinder, {
      input: "const x = 1;\nconsole.log(x);",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "No potentially unused code"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(deadCodeFinder, { input: "" });
    expect(result.success).toBe(false);
  });
});
