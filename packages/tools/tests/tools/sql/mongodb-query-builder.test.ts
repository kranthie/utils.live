import { describe, it, expect } from "vitest";
import { mongodbQueryBuilder } from "../../../src/tools/sql/mongodb-query-builder";
import { executeTool } from "../../../src/core/executor";

describe("mongodbQueryBuilder", () => {
  it("should have correct metadata", () => {
    expect(mongodbQueryBuilder.meta.id).toBe("sql/mongodb-query-builder");
    expect(mongodbQueryBuilder.meta.category).toBe("sql");
  });

  it("should build a find query in shell format", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "find",
      collection: "users",
      filter: '{"age": {"$gt": 18}}',
      projection: '{"name": 1, "email": 1}',
      sort: '{"name": 1}',
      limit: 10,
      skip: 0,
      update: "",
      document: "",
      pipeline: "",
      field: "",
      format: "shell",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.find");
      expect(output).toContain(".sort");
      expect(output).toContain(".limit(10)");
    }
  });

  it("should build an insertOne query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "insertOne",
      collection: "users",
      filter: "{}",
      projection: "",
      sort: "",
      update: "",
      document: '{"name": "Alice", "age": 30}',
      pipeline: "",
      field: "",
      format: "shell",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.insertOne");
      expect(output).toContain("Alice");
    }
  });

  it("should build an updateOne query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "updateOne",
      collection: "users",
      filter: '{"_id": 1}',
      projection: "",
      sort: "",
      update: '{"$set": {"name": "Bob"}}',
      document: "",
      pipeline: "",
      field: "",
      format: "shell",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.updateOne");
      expect(output).toContain("$set");
    }
  });

  it("should build a deleteOne query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "deleteOne",
      collection: "users",
      filter: '{"_id": 1}',
      projection: "",
      sort: "",
      update: "",
      document: "",
      pipeline: "",
      field: "",
      format: "shell",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.deleteOne");
    }
  });

  it("should build an aggregate query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "aggregate",
      collection: "orders",
      filter: "{}",
      projection: "",
      sort: "",
      update: "",
      document: "",
      pipeline: '[{"$group": {"_id": "$status", "count": {"$sum": 1}}}]',
      field: "",
      format: "shell",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.orders.aggregate");
    }
  });

  it("should build node format", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "find",
      collection: "users",
      filter: "{}",
      projection: "",
      sort: "",
      update: "",
      document: "",
      pipeline: "",
      field: "",
      format: "node",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.collection('users')");
      expect(output).toContain("await");
    }
  });

  it("should build python format", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "find",
      collection: "users",
      filter: "{}",
      projection: "",
      sort: "",
      update: "",
      document: "",
      pipeline: "",
      field: "",
      format: "python",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.find");
      expect(output).toContain("list(cursor)");
    }
  });

  it("should build distinct query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "distinct",
      collection: "users",
      filter: "{}",
      projection: "",
      sort: "",
      update: "",
      document: "",
      pipeline: "",
      field: "country",
      format: "shell",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('db.users.distinct("country"');
    }
  });
});
