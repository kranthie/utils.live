import { describe, it, expect } from "vitest";
import {
  createToolError,
  extractJsonErrorPosition,
} from "../../src/core/errors";

describe("createToolError", () => {
  it("should create a basic error with code and message", () => {
    const error = createToolError({
      code: "TEST_ERROR",
      message: "Something went wrong",
    });

    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("Something went wrong");
    expect(error.details).toBeUndefined();
    expect(error.field).toBeUndefined();
    expect(error.line).toBeUndefined();
    expect(error.column).toBeUndefined();
  });

  it("should include details when provided", () => {
    const error = createToolError({
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: { issues: ["field is required"] },
    });

    expect(error.details).toEqual({ issues: ["field is required"] });
  });

  it("should include field when provided", () => {
    const error = createToolError({
      code: "INPUT_INVALID_TYPE",
      message: "Invalid type",
      field: "userName",
    });

    expect(error.field).toBe("userName");
  });

  it("should include line when provided", () => {
    const error = createToolError({
      code: "PARSE_ERROR",
      message: "Parse failed",
      line: 5,
    });

    expect(error.line).toBe(5);
  });

  it("should include column when provided", () => {
    const error = createToolError({
      code: "PARSE_ERROR",
      message: "Parse failed",
      column: 10,
    });

    expect(error.column).toBe(10);
  });

  it("should include all optional fields when provided", () => {
    const error = createToolError({
      code: "FULL_ERROR",
      message: "Full error message",
      details: { extra: "info" },
      field: "inputField",
      line: 3,
      column: 15,
    });

    expect(error.code).toBe("FULL_ERROR");
    expect(error.message).toBe("Full error message");
    expect(error.details).toEqual({ extra: "info" });
    expect(error.field).toBe("inputField");
    expect(error.line).toBe(3);
    expect(error.column).toBe(15);
  });
});

describe("extractJsonErrorPosition", () => {
  it("should extract position from 'at position X' format", () => {
    const position = extractJsonErrorPosition(
      "Unexpected token at position 42"
    );
    expect(position).toEqual({ line: 1, column: 43 });
  });

  it("should extract position from 'line X column Y' format", () => {
    const position = extractJsonErrorPosition("Error at line 5 column 10");
    expect(position).toEqual({ line: 5, column: 10 });
  });

  it("should return undefined for unknown format", () => {
    const position = extractJsonErrorPosition("Unknown error format");
    expect(position).toBeUndefined();
  });

  it("should handle case-insensitive position match", () => {
    const position = extractJsonErrorPosition("Error AT POSITION 15");
    expect(position).toEqual({ line: 1, column: 16 });
  });

  it("should handle case-insensitive line column match", () => {
    const position = extractJsonErrorPosition("Error at LINE 2 COLUMN 8");
    expect(position).toEqual({ line: 2, column: 8 });
  });
});
