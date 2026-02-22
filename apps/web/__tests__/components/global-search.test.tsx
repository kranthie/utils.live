import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlobalSearch } from "@/components/search/global-search";

// Mock the keyboard provider
const mockSetSearchOpen = vi.fn();
vi.mock("@/components/providers/keyboard-provider", () => ({
  useKeyboard: () => ({
    isSearchOpen: true,
    setSearchOpen: mockSetSearchOpen,
    registerShortcut: vi.fn(),
    unregisterShortcut: vi.fn(),
    shortcuts: [],
  }),
}));

// Mock the SearchCommand component to isolate GlobalSearch logic
vi.mock("@/components/search/search-command", () => ({
  SearchCommand: ({
    tools,
    categories,
    open,
  }: {
    tools: unknown[];
    categories: unknown[];
    open: boolean;
  }) => (
    <div data-testid="search-command" data-open={open}>
      <span data-testid="tool-count">{tools.length}</span>
      <span data-testid="category-count">{categories.length}</span>
    </div>
  ),
}));

const MOCK_TOOLS = [
  {
    id: "json/json-formatter",
    name: "JSON Formatter",
    description: "Format JSON",
    category: "json",
    keywords: ["json"],
    icon: "Braces",
  },
];

const MOCK_CATEGORIES = [{ id: "json", name: "JSON Tools", icon: "Braces" }];

describe("GlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render SearchCommand after mounting", () => {
    render(<GlobalSearch tools={MOCK_TOOLS} categories={MOCK_CATEGORIES} />);
    expect(screen.getByTestId("search-command")).toBeDefined();
  });

  it("should pass tools data to SearchCommand", () => {
    render(<GlobalSearch tools={MOCK_TOOLS} categories={MOCK_CATEGORIES} />);
    const toolCount = parseInt(
      screen.getByTestId("tool-count").textContent || "0"
    );
    expect(toolCount).toBeGreaterThan(0);
  });

  it("should pass categories data to SearchCommand", () => {
    render(<GlobalSearch tools={MOCK_TOOLS} categories={MOCK_CATEGORIES} />);
    const categoryCount = parseInt(
      screen.getByTestId("category-count").textContent || "0"
    );
    expect(categoryCount).toBeGreaterThan(0);
  });

  it("should pass open state from keyboard context", () => {
    render(<GlobalSearch tools={MOCK_TOOLS} categories={MOCK_CATEGORIES} />);
    const searchCmd = screen.getByTestId("search-command");
    expect(searchCmd.getAttribute("data-open")).toBe("true");
  });
});
