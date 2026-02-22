import { describe, it, expect } from "vitest";
import { gitignoreGenerator } from "../../../src/tools/api/gitignore-generator";
import { executeTool } from "../../../src/core/executor";

describe("gitignoreGenerator", () => {
  it("should have correct metadata", () => {
    expect(gitignoreGenerator.meta.id).toBe("api/gitignore-generator");
    expect(gitignoreGenerator.meta.category).toBe("api");
  });

  it("should generate Node.js gitignore", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "node",
      ide: "vscode",
      os: "all",
      extras: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("node_modules/");
      expect(output).toContain("dist/");
      expect(output).toContain(".vscode");
    }
  });

  it("should generate Python gitignore", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "python",
      ide: "none",
      os: "all",
      extras: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("__pycache__/");
      expect(output).toContain("venv/");
    }
  });

  it("should include IDE entries for IntelliJ", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "java",
      ide: "intellij",
      os: "all",
      extras: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain(".idea/");
      expect(output).toContain("*.iml");
    }
  });

  it("should include OS-specific entries for macOS", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "node",
      ide: "none",
      os: "macos",
      extras: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain(".DS_Store");
    }
  });

  it("should include extras when enabled", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "node",
      ide: "none",
      os: "all",
      extras: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain(".env");
      expect(output).toContain("coverage/");
      expect(output).toContain("*.log");
    }
  });

  it("should generate Go gitignore", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "go",
      ide: "none",
      os: "all",
      extras: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("*.exe");
      expect(output).toContain("vendor/");
    }
  });

  it("should generate Rust gitignore", async () => {
    const result = await executeTool(gitignoreGenerator, {
      language: "rust",
      ide: "none",
      os: "all",
      extras: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("target/");
      expect(output).toContain("Cargo.lock");
    }
  });
});
