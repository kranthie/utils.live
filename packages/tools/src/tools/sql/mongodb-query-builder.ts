import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  operation: z
    .enum([
      "find",
      "insertOne",
      "insertMany",
      "updateOne",
      "updateMany",
      "deleteOne",
      "deleteMany",
      "aggregate",
      "count",
      "distinct",
    ])
    .default("find")
    .describe("MongoDB operation"),
  collection: z.string().default("collection").describe("Collection name"),
  filter: z.string().default("{}").describe("Query filter as JSON"),
  projection: z
    .string()
    .default("")
    .describe('Projection fields as JSON (e.g. \'{"name": 1, "email": 1}\')'),
  sort: z
    .string()
    .default("")
    .describe("Sort as JSON (e.g. '{\"created_at\": -1}')"),
  limit: z.number().optional().describe("Limit results"),
  skip: z.number().optional().describe("Skip results"),
  update: z
    .string()
    .default("")
    .describe("Update document as JSON (for update operations)"),
  document: z.string().default("").describe("Document to insert as JSON"),
  pipeline: z
    .string()
    .default("")
    .describe("Aggregation pipeline as JSON array"),
  field: z.string().default("").describe("Field name (for distinct)"),
  format: z
    .enum(["shell", "node", "python"])
    .default("shell")
    .describe("Output format"),
});
const outputSchema = z.object({ output: z.string().describe("MongoDB query") });

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const {
    operation,
    collection,
    filter,
    projection,
    sort,
    limit,
    skip,
    update,
    document,
    pipeline,
    field,
    format,
  } = input;

  if (format === "shell")
    return {
      output: buildShell(
        operation,
        collection,
        filter,
        projection,
        sort,
        limit,
        skip,
        update,
        document,
        pipeline,
        field
      ),
    };
  if (format === "node")
    return {
      output: buildNode(
        operation,
        collection,
        filter,
        projection,
        sort,
        limit,
        skip,
        update,
        document,
        pipeline,
        field
      ),
    };
  if (format === "python")
    return {
      output: buildPython(
        operation,
        collection,
        filter,
        projection,
        sort,
        limit,
        skip,
        update,
        document,
        pipeline,
        field
      ),
    };

  return {
    output: buildShell(
      operation,
      collection,
      filter,
      projection,
      sort,
      limit,
      skip,
      update,
      document,
      pipeline,
      field
    ),
  };
}

function buildShell(
  op: string,
  col: string,
  filter: string,
  proj: string,
  sort: string,
  limit: number | undefined,
  skip: number | undefined,
  update: string,
  doc: string,
  pipeline: string,
  field: string
): string {
  switch (op) {
    case "find": {
      let q = `db.${col}.find(${filter}`;
      if (proj) q += `, ${proj}`;
      q += ")";
      if (sort) q += `.sort(${sort})`;
      if (skip) q += `.skip(${skip})`;
      if (limit) q += `.limit(${limit})`;
      return q;
    }
    case "insertOne":
      return `db.${col}.insertOne(${doc || "{}"})`;
    case "insertMany":
      return `db.${col}.insertMany(${doc || "[]"})`;
    case "updateOne":
      return `db.${col}.updateOne(${filter}, ${update || '{"$set": {}}'})`;
    case "updateMany":
      return `db.${col}.updateMany(${filter}, ${update || '{"$set": {}}'})`;
    case "deleteOne":
      return `db.${col}.deleteOne(${filter})`;
    case "deleteMany":
      return `db.${col}.deleteMany(${filter})`;
    case "aggregate":
      return `db.${col}.aggregate(${pipeline || "[]"})`;
    case "count":
      return `db.${col}.countDocuments(${filter})`;
    case "distinct":
      return `db.${col}.distinct("${field}", ${filter})`;
    default:
      return `db.${col}.${op}(${filter})`;
  }
}

function buildNode(
  op: string,
  col: string,
  filter: string,
  proj: string,
  sort: string,
  limit: number | undefined,
  skip: number | undefined,
  update: string,
  doc: string,
  pipeline: string,
  field: string
): string {
  const lines: string[] = [];
  switch (op) {
    case "find": {
      let q = `const cursor = db.collection('${col}').find(${filter}`;
      if (proj) q += `, { projection: ${proj} }`;
      q += ")";
      if (sort) q += `\n  .sort(${sort})`;
      if (skip) q += `\n  .skip(${skip})`;
      if (limit) q += `\n  .limit(${limit})`;
      q += ";";
      lines.push(q);
      lines.push("const results = await cursor.toArray();");
      break;
    }
    case "insertOne":
      lines.push(
        `const result = await db.collection('${col}').insertOne(${doc || "{}"});`
      );
      break;
    case "insertMany":
      lines.push(
        `const result = await db.collection('${col}').insertMany(${doc || "[]"});`
      );
      break;
    case "updateOne":
      lines.push(
        `const result = await db.collection('${col}').updateOne(${filter}, ${update || "{ $set: {} }"});`
      );
      break;
    case "updateMany":
      lines.push(
        `const result = await db.collection('${col}').updateMany(${filter}, ${update || "{ $set: {} }"});`
      );
      break;
    case "deleteOne":
      lines.push(
        `const result = await db.collection('${col}').deleteOne(${filter});`
      );
      break;
    case "deleteMany":
      lines.push(
        `const result = await db.collection('${col}').deleteMany(${filter});`
      );
      break;
    case "aggregate":
      lines.push(
        `const results = await db.collection('${col}').aggregate(${pipeline || "[]"}).toArray();`
      );
      break;
    case "count":
      lines.push(
        `const count = await db.collection('${col}').countDocuments(${filter});`
      );
      break;
    case "distinct":
      lines.push(
        `const values = await db.collection('${col}').distinct('${field}', ${filter});`
      );
      break;
  }
  return lines.join("\n");
}

function buildPython(
  op: string,
  col: string,
  filter: string,
  proj: string,
  sort: string,
  limit: number | undefined,
  skip: number | undefined,
  update: string,
  doc: string,
  pipeline: string,
  field: string
): string {
  const lines: string[] = [];
  switch (op) {
    case "find": {
      let q = `cursor = db.${col}.find(${filter}`;
      if (proj) q += `, ${proj}`;
      q += ")";
      if (sort)
        q += `\ncursor = cursor.sort(${sort.replace(/:/g, ":").replace(/"/g, "'")})`;
      if (skip) q += `\ncursor = cursor.skip(${skip})`;
      if (limit) q += `\ncursor = cursor.limit(${limit})`;
      lines.push(q);
      lines.push("results = list(cursor)");
      break;
    }
    case "insertOne":
      lines.push(`result = db.${col}.insert_one(${doc || "{}"})`);
      break;
    case "insertMany":
      lines.push(`result = db.${col}.insert_many(${doc || "[]"})`);
      break;
    case "updateOne":
      lines.push(
        `result = db.${col}.update_one(${filter}, ${update || "{'$set': {}}"})`
      );
      break;
    case "updateMany":
      lines.push(
        `result = db.${col}.update_many(${filter}, ${update || "{'$set': {}}"})`
      );
      break;
    case "deleteOne":
      lines.push(`result = db.${col}.delete_one(${filter})`);
      break;
    case "deleteMany":
      lines.push(`result = db.${col}.delete_many(${filter})`);
      break;
    case "aggregate":
      lines.push(`results = list(db.${col}.aggregate(${pipeline || "[]"}))`);
      break;
    case "count":
      lines.push(`count = db.${col}.count_documents(${filter})`);
      break;
    case "distinct":
      lines.push(`values = db.${col}.distinct("${field}", ${filter})`);
      break;
  }
  return lines.join("\n");
}

// FIXME(category-mismatch): Tool belongs in 'database' category, not 'sql'. Tracked in DC-006.
export const mongodbQueryBuilder = defineTool({
  meta: {
    id: "sql/mongodb-query-builder",
    name: "MongoDB Query Builder",
    description:
      "Free online MongoDB query builder — construct find, insert, update, delete, aggregate, count, and distinct queries in shell, Node.js, or Python format instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: ["mongodb", "query", "builder", "nosql", "database", "document"],
    examples: [
      {
        title: "Find Active Users",
        description:
          "Build a MongoDB find query for active users sorted by name",
        input: {
          operation: "find",
          collection: "users",
          filter: '{"status": "active"}',
          sort: '{"name": 1}',
          limit: 20,
        },
        output:
          'db.users.find({"status": "active"}).sort({"name": 1}).limit(20)',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
