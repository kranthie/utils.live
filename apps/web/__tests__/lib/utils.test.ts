import { describe, it, expect } from "vitest";
import {
  cn,
  formatBytes,
  formatDuration,
  formatNumber,
  truncate,
  slugify,
  getInitials,
  deepClone,
  deepEqual,
  pick,
  omit,
  uniqueId,
} from "@/lib/utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const condition = false;
    expect(cn("foo", condition && "bar", "baz")).toBe("foo baz");
  });

  it("should resolve Tailwind conflicts", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatBytes", () => {
  it("should return '0 Bytes' for 0", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("should format bytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("should respect decimal places", () => {
    expect(formatBytes(1536, 1)).toBe("1.5 KB");
  });
});

describe("formatDuration", () => {
  it("should format milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("should format seconds", () => {
    expect(formatDuration(1500)).toBe("1.5s");
  });

  it("should format minutes and seconds", () => {
    expect(formatDuration(65000)).toBe("1m 5s");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(3665000)).toBe("1h 1m");
  });
});

describe("formatNumber", () => {
  it("should format numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("should handle small numbers", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("truncate", () => {
  it("should not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("should truncate long strings with ellipsis", () => {
    expect(truncate("hello world!", 8)).toBe("hello...");
  });

  it("should handle exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("slugify", () => {
  it("should convert to lowercase with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("should trim leading and trailing hyphens", () => {
    expect(slugify(" Hello World ")).toBe("hello-world");
  });
});

describe("getInitials", () => {
  it("should extract initials from a name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("should handle single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("should limit to 2 characters", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });
});

describe("deepClone", () => {
  it("should clone primitive values", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
  });

  it("should deep clone objects", () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it("should deep clone arrays", () => {
    const arr = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });
});

describe("deepEqual", () => {
  it("should return true for equal primitives", () => {
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual("hello", "hello")).toBe(true);
  });

  it("should return false for different primitives", () => {
    expect(deepEqual(42, 43)).toBe(false);
  });

  it("should compare objects deeply", () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("should compare arrays deeply", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
  });
});

describe("pick", () => {
  it("should pick specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("should ignore missing keys", () => {
    const obj = { a: 1, b: 2 };
    expect(pick(obj, ["a", "c" as keyof typeof obj])).toEqual({ a: 1 });
  });
});

describe("omit", () => {
  it("should omit specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
  });

  it("should return full object when omitting nothing", () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, []);
    expect(result).toEqual({ a: 1, b: 2 });
  });
});

describe("uniqueId", () => {
  it("should generate unique IDs", () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    expect(id1).not.toBe(id2);
  });

  it("should prepend prefix when provided", () => {
    const id = uniqueId("test-");
    expect(id.startsWith("test-")).toBe(true);
  });
});
