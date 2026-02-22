import { describe, it, expect } from "vitest";
import { elasticsearchQueryBuilder } from "../../../src/tools/sql/elasticsearch-query-builder";
import { executeTool } from "../../../src/core/executor";

describe("elasticsearchQueryBuilder", () => {
  it("should have correct metadata", () => {
    expect(elasticsearchQueryBuilder.meta.id).toBe(
      "sql/elasticsearch-query-builder"
    );
    expect(elasticsearchQueryBuilder.meta.category).toBe("sql");
  });

  it("should build a match query", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match",
      index: "products",
      field: "title",
      value: "laptop",
      from: 0,
      size: 10,
      sort: "",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const query = data.query as Record<string, Record<string, unknown>>;
      expect(query.match.title).toBe("laptop");
      expect(data.from).toBe(0);
      expect(data.size).toBe(10);
    }
  });

  it("should build a term query", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "term",
      index: "users",
      field: "status",
      value: "active",
      from: 0,
      size: 10,
      sort: "",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const query = data.query as Record<string, Record<string, unknown>>;
      expect(query.term.status).toBe("active");
    }
  });

  it("should build a range query", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "range",
      index: "logs",
      field: "timestamp",
      value: "",
      from: 0,
      size: 10,
      sort: "",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "2024-01-01",
      rangeLte: "2024-12-31",
      format: "json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const query = data.query as Record<
        string,
        Record<string, Record<string, unknown>>
      >;
      expect(query.range.timestamp.gte).toBe("2024-01-01");
      expect(query.range.timestamp.lte).toBe("2024-12-31");
    }
  });

  it("should build a match_all query", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match_all",
      index: "docs",
      field: "",
      value: "",
      from: 0,
      size: 5,
      sort: "",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const query = data.query as Record<string, unknown>;
      expect(query.match_all).toBeDefined();
    }
  });

  it("should add sort when specified", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match_all",
      index: "logs",
      field: "",
      value: "",
      from: 0,
      size: 10,
      sort: "timestamp:desc",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const sort = data.sort as Array<Record<string, Record<string, unknown>>>;
      expect(sort).toBeDefined();
      expect(sort[0].timestamp.order).toBe("desc");
    }
  });

  it("should output curl format", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match_all",
      index: "my_index",
      field: "",
      value: "",
      from: 0,
      size: 10,
      sort: "",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "curl",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("curl");
      expect(output).toContain("my_index/_search");
    }
  });

  it("should output python format", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match_all",
      index: "my_index",
      field: "",
      value: "",
      from: 0,
      size: 10,
      sort: "",
      must: "",
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "python",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("from elasticsearch import Elasticsearch");
      expect(output).toContain("es.search");
    }
  });

  it("should handle bool query with must", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "bool",
      index: "test",
      field: "",
      value: "",
      from: 0,
      size: 10,
      sort: "",
      must: '[{"match":{"title":"test"}}]',
      should: "",
      mustNot: "",
      filter: "",
      rangeGte: "",
      rangeLte: "",
      format: "json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const query = data.query as Record<string, Record<string, unknown>>;
      expect(query.bool.must).toBeDefined();
    }
  });
});
