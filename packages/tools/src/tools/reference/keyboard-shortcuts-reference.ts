import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z.string().optional().describe("Filter by shortcut or action"),
  app: z
    .enum(["general", "vscode", "chrome", "terminal", "git"])
    .default("general")
    .describe("Application context"),
});
const outputSchema = z.object({
  output: z.string().describe("Keyboard shortcuts reference"),
});

const SHORTCUTS: Record<string, Array<[string, string, string]>> = {
  general: [
    ["Ctrl+C", "Cmd+C", "Copy"],
    ["Ctrl+V", "Cmd+V", "Paste"],
    ["Ctrl+X", "Cmd+X", "Cut"],
    ["Ctrl+Z", "Cmd+Z", "Undo"],
    ["Ctrl+Y", "Cmd+Shift+Z", "Redo"],
    ["Ctrl+A", "Cmd+A", "Select all"],
    ["Ctrl+S", "Cmd+S", "Save"],
    ["Ctrl+F", "Cmd+F", "Find"],
    ["Ctrl+H", "Cmd+H", "Find and replace"],
    ["Ctrl+N", "Cmd+N", "New"],
    ["Ctrl+O", "Cmd+O", "Open"],
    ["Ctrl+P", "Cmd+P", "Print"],
    ["Ctrl+W", "Cmd+W", "Close tab"],
    ["Alt+Tab", "Cmd+Tab", "Switch app"],
    ["Ctrl+Tab", "Cmd+Tab", "Switch tab"],
  ],
  vscode: [
    ["Ctrl+P", "Cmd+P", "Quick open file"],
    ["Ctrl+Shift+P", "Cmd+Shift+P", "Command palette"],
    ["Ctrl+`", "Cmd+`", "Toggle terminal"],
    ["Ctrl+B", "Cmd+B", "Toggle sidebar"],
    ["Ctrl+/", "Cmd+/", "Toggle comment"],
    ["Alt+Up", "Option+Up", "Move line up"],
    ["Alt+Down", "Option+Down", "Move line down"],
    ["Ctrl+D", "Cmd+D", "Select next occurrence"],
    ["Ctrl+Shift+K", "Cmd+Shift+K", "Delete line"],
    ["Ctrl+L", "Cmd+L", "Select line"],
    ["Ctrl+G", "Cmd+G", "Go to line"],
    ["Ctrl+Shift+F", "Cmd+Shift+F", "Search in files"],
    ["F2", "F2", "Rename symbol"],
    ["F12", "F12", "Go to definition"],
    ["Ctrl+Shift+E", "Cmd+Shift+E", "Explorer"],
    ["Ctrl+K Ctrl+S", "Cmd+K Cmd+S", "Keyboard shortcuts"],
  ],
  chrome: [
    ["Ctrl+T", "Cmd+T", "New tab"],
    ["Ctrl+W", "Cmd+W", "Close tab"],
    ["Ctrl+Shift+T", "Cmd+Shift+T", "Reopen closed tab"],
    ["Ctrl+L", "Cmd+L", "Focus address bar"],
    ["Ctrl+R", "Cmd+R", "Reload"],
    ["Ctrl+Shift+R", "Cmd+Shift+R", "Hard reload"],
    ["F12", "Cmd+Option+I", "DevTools"],
    ["Ctrl+Shift+J", "Cmd+Option+J", "Console"],
    ["Ctrl+U", "Cmd+Option+U", "View source"],
    ["Ctrl+D", "Cmd+D", "Bookmark page"],
    ["Ctrl+J", "Cmd+Shift+J", "Downloads"],
    ["Ctrl+H", "Cmd+Y", "History"],
  ],
  terminal: [
    ["Ctrl+C", "Ctrl+C", "Interrupt/cancel"],
    ["Ctrl+D", "Ctrl+D", "EOF/logout"],
    ["Ctrl+L", "Cmd+K", "Clear screen"],
    ["Ctrl+R", "Ctrl+R", "Reverse search history"],
    ["Ctrl+A", "Ctrl+A", "Move to line start"],
    ["Ctrl+E", "Ctrl+E", "Move to line end"],
    ["Ctrl+U", "Ctrl+U", "Delete to start"],
    ["Ctrl+K", "Ctrl+K", "Delete to end"],
    ["Ctrl+W", "Ctrl+W", "Delete word back"],
    ["Tab", "Tab", "Autocomplete"],
  ],
  git: [
    ["git init", "", "Initialize repository"],
    ["git clone <url>", "", "Clone repository"],
    ["git add .", "", "Stage all changes"],
    ["git commit -m", "", "Commit with message"],
    ["git push", "", "Push to remote"],
    ["git pull", "", "Pull from remote"],
    ["git status", "", "Check status"],
    ["git log --oneline", "", "Compact log"],
    ["git branch", "", "List branches"],
    ["git checkout -b", "", "Create & switch branch"],
    ["git stash", "", "Stash changes"],
    ["git stash pop", "", "Apply stashed changes"],
  ],
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const app = input.app ?? "general";
  let shortcuts = SHORTCUTS[app] ?? SHORTCUTS.general!;
  if (input.filter) {
    const q = input.filter.toLowerCase();
    shortcuts = shortcuts.filter(
      ([win, mac, desc]) =>
        win.toLowerCase().includes(q) ||
        mac.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
    );
  }
  const isGit = app === "git";
  const header = isGit
    ? `${"Command".padEnd(25)} Description`
    : `${"Windows/Linux".padEnd(20)} ${"macOS".padEnd(20)} Action`;
  const lines = shortcuts.map(([a, b, c]) =>
    isGit ? `${a.padEnd(25)} ${c}` : `${a.padEnd(20)} ${b.padEnd(20)} ${c}`
  );
  return {
    output: [
      `${app.toUpperCase()} Shortcuts`,
      header,
      "-".repeat(60),
      ...lines,
    ].join("\n"),
  };
}

export const keyboardShortcutsReference = defineTool({
  meta: {
    id: "reference/keyboard-shortcuts-reference",
    name: "Keyboard Shortcuts Reference",
    description:
      "Free online keyboard shortcuts reference — look up hotkeys for VS Code, Chrome, terminal, and git instantly in your browser. No data is stored. Shows both Windows/Linux and macOS key bindings side by side with search filtering.",
    category: "reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "keyboard",
      "shortcuts",
      "hotkey",
      "keybind",
      "reference",
      "cheatsheet",
      "vscode",
      "chrome",
      "terminal",
      "git",
      "macos",
      "windows",
    ],
    examples: [
      {
        title: "VS Code search shortcuts",
        description: "Find keyboard shortcuts related to search in VS Code",
        input: { filter: "search", app: "vscode" },
        output:
          "VSCODE Shortcuts\nWindows/Linux        macOS                Action\n------------------------------------------------------------\nCtrl+Shift+F         Cmd+Shift+F          Search in files",
      },
      {
        title: "All Chrome DevTools shortcuts",
        description: "Browse all Chrome browser keyboard shortcuts",
        input: { app: "chrome" },
        output:
          "CHROME Shortcuts\nWindows/Linux        macOS                Action\n------------------------------------------------------------\nCtrl+T               Cmd+T                New tab\nCtrl+W               Cmd+W                Close tab\nCtrl+Shift+T         Cmd+Shift+T          Reopen closed tab\nCtrl+L               Cmd+L                Focus address bar\nCtrl+R               Cmd+R                Reload\nCtrl+Shift+R         Cmd+Shift+R          Hard reload\nF12                  Cmd+Option+I         DevTools\nCtrl+Shift+J         Cmd+Option+J         Console\nCtrl+U               Cmd+Option+U         View source\nCtrl+D               Cmd+D                Bookmark page\nCtrl+J               Cmd+Shift+J          Downloads\nCtrl+H               Cmd+Y                History",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
