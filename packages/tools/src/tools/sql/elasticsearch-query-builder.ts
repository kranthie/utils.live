import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  queryType: z
    .enum([
      "match",
      "match_phrase",
      "term",
      "terms",
      "range",
      "bool",
      "wildcard",
      "regexp",
      "exists",
      "match_all",
    ])
    .default("match")
    .describe("Query type"),
  index: z.string().default("my_index").describe("Index name"),
  field: z.string().default("").describe("Field name"),
  value: z.string().default("").describe("Search value"),
  from: z.number().default(0).describe("Offset for pagination"),
  size: z.number().default(10).describe("Number of results"),
  sort: z.string().default("").describe("Sort field (e.g. 'timestamp:desc')"),
  must: z
    .string()
    .default("")
    .describe("Must conditions as JSON array (for bool query)"),
  should: z
    .string()
    .default("")
    .describe("Should conditions as JSON array (for bool query)"),
  mustNot: z
    .string()
    .default("")
    .describe("Must not conditions as JSON array (for bool query)"),
  filter: z
    .string()
    .default("")
    .describe("Filter conditions as JSON array (for bool query)"),
  rangeGte: z.string().default("").describe("Range >= value"),
  rangeLte: z.string().default("").describe("Range <= value"),
  format: z
    .enum(["json", "curl", "python"])
    .default("json")
    .describe("Output format"),
});
const outputSchema = z.object({
  output: z.string().describe("Elasticsearch query"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const {
    queryType,
    index,
    field,
    value,
    from,
    size,
    sort,
    must,
    should,
    mustNot,
    filter: filterStr,
    rangeGte,
    rangeLte,
    format,
  } = input;

  let query: Record<string, unknown> = {};

  switch (queryType) {
    case "match":
      query = { match: { [field]: value } };
      break;
    case "match_phrase":
      query = { match_phrase: { [field]: value } };
      break;
    case "term":
      query = { term: { [field]: value } };
      break;
    case "terms":
      query = { terms: { [field]: value.split(",").map((v) => v.trim()) } };
      break;
    case "range": {
      const rangeObj: Record<string, string> = {};
      if (rangeGte) rangeObj.gte = rangeGte;
      if (rangeLte) rangeObj.lte = rangeLte;
      query = { range: { [field]: rangeObj } };
      break;
    }
    case "bool": {
      const boolQuery: Record<string, unknown> = {};
      if (must)
        try {
          boolQuery.must = JSON.parse(must);
        } catch {
          boolQuery.must = [];
        }
      if (should)
        try {
          boolQuery.should = JSON.parse(should);
        } catch {
          boolQuery.should = [];
        }
      if (mustNot)
        try {
          boolQuery.must_not = JSON.parse(mustNot);
        } catch {
          boolQuery.must_not = [];
        }
      if (filterStr)
        try {
          boolQuery.filter = JSON.parse(filterStr);
        } catch {
          boolQuery.filter = [];
        }
      query = { bool: boolQuery };
      break;
    }
    case "wildcard":
      query = { wildcard: { [field]: value } };
      break;
    case "regexp":
      query = { regexp: { [field]: value } };
      break;
    case "exists":
      query = { exists: { field } };
      break;
    case "match_all":
      query = { match_all: {} };
      break;
  }

  const body: Record<string, unknown> = { query, from, size };
  if (sort) {
    const [sortField, sortOrder] = sort.split(":");
    body.sort = [
      { [sortField!.trim()]: { order: (sortOrder ?? "asc").trim() } },
    ];
  }

  if (format === "json") {
    return { output: JSON.stringify(body, null, 2) };
  }

  if (format === "curl") {
    const jsonBody = JSON.stringify(body);
    return {
      output: `curl -X GET "http://localhost:9200/${index}/_search" \\\n  -H "Content-Type: application/json" \\\n  -d '${jsonBody}'`,
    };
  }

  if (format === "python") {
    const lines = [
      `from elasticsearch import Elasticsearch`,
      ``,
      `es = Elasticsearch()`,
      ``,
      `body = ${JSON.stringify(body, null, 4)}`,
      ``,
      `result = es.search(index="${index}", body=body)`,
      `print(f"Total hits: {result['hits']['total']['value']}")`,
      `for hit in result['hits']['hits']:`,
      `    print(hit['_source'])`,
    ];
    return { output: lines.join("\n") };
  }

  return { output: JSON.stringify(body, null, 2) };
}

// FIXME(category-mismatch): Tool belongs in 'database' category, not 'sql'. Tracked in DC-006.
export const elasticsearchQueryBuilder = defineTool({
  meta: {
    id: "sql/elasticsearch-query-builder",
    name: "Elasticsearch Query Builder",
    description:
      "Free online Elasticsearch query builder — construct match, term, range, bool, and wildcard queries in JSON, cURL, or Python format instantly in your browser. No data is stored. Supports pagination, sorting, and complex boolean queries.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "elasticsearch",
      "query",
      "builder",
      "search",
      "nosql",
      "database",
    ],
    examples: [
      {
        title: "Full-Text Product Search",
        description: "Build an Elasticsearch match query for product titles",
        input: {
          queryType: "match",
          index: "products",
          field: "title",
          value: "wireless headphones",
          size: 10,
        },
        output:
          '{\n  "query": {\n    "match": {\n      "title": "wireless headphones"\n    }\n  },\n  "from": 0,\n  "size": 10\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
