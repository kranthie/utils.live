import { describe, it, expect } from "vitest";
import { erDiagramGenerator } from "../../../src/tools/sql/er-diagram-generator";
import { executeTool } from "../../../src/core/executor";

const sampleSQL = `
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  user_id INT REFERENCES users(id)
);
`;

describe("erDiagramGenerator", () => {
  it("should have correct metadata", () => {
    expect(erDiagramGenerator.meta.id).toBe("sql/er-diagram-generator");
    expect(erDiagramGenerator.meta.category).toBe("sql");
  });

  it("should generate mermaid ER diagram", async () => {
    const result = await executeTool(
      erDiagramGenerator,
      { input: sampleSQL },
      { format: "mermaid" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("erDiagram");
      expect(output).toContain("users");
      expect(output).toContain("posts");
    }
  });

  it("should mark PK and FK columns", async () => {
    const result = await executeTool(
      erDiagramGenerator,
      { input: sampleSQL },
      { format: "mermaid" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("PK");
      expect(output).toContain("FK");
    }
  });

  it("should generate relationships", async () => {
    const result = await executeTool(
      erDiagramGenerator,
      { input: sampleSQL },
      { format: "mermaid" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("users");
      expect(output).toContain("posts");
      expect(output).toContain("user_id");
    }
  });

  it("should generate PlantUML format", async () => {
    const result = await executeTool(
      erDiagramGenerator,
      { input: sampleSQL },
      { format: "plantuml" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("@startuml");
      expect(output).toContain("@enduml");
      expect(output).toContain("entity");
    }
  });

  it("should generate DBML format", async () => {
    const result = await executeTool(
      erDiagramGenerator,
      { input: sampleSQL },
      { format: "dbml" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Table users");
      expect(output).toContain("Table posts");
      expect(output).toContain("pk");
    }
  });

  it("should generate ASCII format", async () => {
    const result = await executeTool(
      erDiagramGenerator,
      { input: sampleSQL },
      { format: "ascii" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("USERS");
      expect(output).toContain("POSTS");
      expect(output).toContain("+");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(erDiagramGenerator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on non-CREATE TABLE input", async () => {
    const result = await executeTool(erDiagramGenerator, {
      input: "SELECT * FROM users;",
    });
    expect(result.success).toBe(false);
  });
});
