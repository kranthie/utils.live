/**
 * Shared formatting utilities for C-like languages.
 * Used by JavaScript, TypeScript, Go, Rust, Java, C#, PHP formatters.
 */

export function formatCLikeCode(code: string, indentSize: number): string {
  const indentStr = " ".repeat(indentSize);
  const lines: string[] = [];
  let level = 0;

  let normalized = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Place opening braces on same line
  normalized = normalized.replace(/\s*\{\s*/g, " {\n");
  // Place closing braces on their own line
  normalized = normalized.replace(/\s*\}\s*/g, "\n}\n");
  // Newline after semicolons (not inside for loops or strings)
  normalized = normalized.replace(/;(?!\s*\/\/)/g, ";\n");

  const rawLines = normalized.split("\n");

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Decrease indent for closing braces
    if (
      trimmed.startsWith("}") ||
      trimmed.startsWith("]") ||
      trimmed.startsWith(")")
    ) {
      level = Math.max(0, level - 1);
    }

    lines.push(indentStr.repeat(level) + trimmed);

    // Increase indent after opening braces
    const lastChar = trimmed[trimmed.length - 1];
    if (lastChar === "{" || lastChar === "[") {
      level++;
    }
  }

  return lines.join("\n");
}

export function formatPython(code: string, indentSize: number): string {
  const indentStr = " ".repeat(indentSize);
  const lines = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      result.push("");
      continue;
    }

    // Detect current indent level
    const match = line.match(/^(\s*)/);
    const currentSpaces =
      match && match[1] ? match[1].replace(/\t/g, "    ").length : 0;
    const level = Math.round(currentSpaces / 4); // Python standard is 4
    const newIndent = indentStr.repeat(level);
    result.push(newIndent + line.trim());
  }

  return result.join("\n");
}
