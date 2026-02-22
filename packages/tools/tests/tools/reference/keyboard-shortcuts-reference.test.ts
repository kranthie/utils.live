import { describe, it, expect } from "vitest";
import { keyboardShortcutsReference } from "../../../src/tools/reference/keyboard-shortcuts-reference";
import { executeTool } from "../../../src/core/executor";

describe("keyboardShortcutsReference", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(keyboardShortcutsReference.meta.id).toBe("reference/keyboard-shortcuts-reference");
      expect(keyboardShortcutsReference.meta.category).toBe("reference");
    });
  });

  describe("execute", () => {
    it("should return general shortcuts by default", async () => {
      const result = await executeTool(keyboardShortcutsReference, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("GENERAL Shortcuts");
        expect(output).toContain("Copy");
        expect(output).toContain("Paste");
        expect(output).toContain("Ctrl+C");
      }
    });

    it("should return vscode shortcuts", async () => {
      const result = await executeTool(keyboardShortcutsReference, {
        app: "vscode",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("VSCODE Shortcuts");
        expect(output).toContain("Command palette");
        expect(output).toContain("Toggle terminal");
      }
    });

    it("should return chrome shortcuts", async () => {
      const result = await executeTool(keyboardShortcutsReference, {
        app: "chrome",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("CHROME Shortcuts");
        expect(output).toContain("New tab");
        expect(output).toContain("DevTools");
      }
    });

    it("should return terminal shortcuts", async () => {
      const result = await executeTool(keyboardShortcutsReference, {
        app: "terminal",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("TERMINAL Shortcuts");
        expect(output).toContain("Interrupt/cancel");
        expect(output).toContain("Autocomplete");
      }
    });

    it("should return git shortcuts with command format", async () => {
      const result = await executeTool(keyboardShortcutsReference, {
        app: "git",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("GIT Shortcuts");
        expect(output).toContain("Command");
        expect(output).toContain("git init");
        expect(output).toContain("git clone");
      }
    });

    it("should filter shortcuts by action", async () => {
      const result = await executeTool(keyboardShortcutsReference, {
        app: "general",
        filter: "copy",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Copy");
        expect(output).not.toContain("Paste");
      }
    });

    it("should filter shortcuts by key combo", async () => {
      const result = await executeTool(keyboardShortcutsReference, {
        app: "general",
        filter: "ctrl+z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Undo");
      }
    });
  });
});
