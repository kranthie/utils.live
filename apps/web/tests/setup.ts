import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock React's cache function (server component feature not available in test env)
vi.mock("react", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  };
});
