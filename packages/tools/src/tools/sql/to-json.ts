import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("SQL query to parse into AST"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON AST representation of the SQL"),
  statementCount: z.number().describe("Number of statements parsed"),
});

const optionsSchema = z.object({
  pretty: z.boolean().default(true).describe("Pretty-print the JSON output"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface ASTNode {
  type: string;
  [key: string]: unknown;
}

interface SelectStatement {
  type: "select";
  distinct?: boolean;
  columns: ASTNode[];
  from?: ASTNode[];
  where?: ASTNode;
  groupBy?: ASTNode[];
  having?: ASTNode;
  orderBy?: Array<{ expr: ASTNode; direction: string }>;
  limit?: ASTNode;
  offset?: ASTNode;
}

interface InsertStatement {
  type: "insert";
  table: string;
  columns?: string[];
  values?: ASTNode[][];
  select?: SelectStatement;
}

interface UpdateStatement {
  type: "update";
  table: string;
  set: Array<{ column: string; value: ASTNode }>;
  where?: ASTNode;
}

interface DeleteStatement {
  type: "delete";
  table: string;
  where?: ASTNode;
}

interface CreateTableStatement {
  type: "create_table";
  table: string;
  ifNotExists?: boolean;
  columns: Array<{
    name: string;
    dataType: string;
    constraints: string[];
  }>;
  constraints?: Array<{ type: string; columns: string[]; references?: string }>;
}

/**
 * Simple SQL tokenizer for AST parsing.
 */
function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < sql.length) {
    if (/\s/.test(sql[i]!)) {
      i++;
      continue;
    }

    // Single-line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      continue;
    }

    // Multi-line comment
    if (sql[i] === "/" && sql[i + 1] === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      if (i < sql.length) i += 2;
      continue;
    }

    // String literal
    if (sql[i] === "'") {
      let str = "";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (sql[i] === "'") {
          i++;
          break;
        } else {
          str += sql[i];
          i++;
        }
      }
      tokens.push(`'${str}'`);
      continue;
    }

    // Operators and punctuation
    if ("(),;.*".includes(sql[i]!)) {
      tokens.push(sql[i]!);
      i++;
      continue;
    }

    if ("<>=!".includes(sql[i]!)) {
      let op = sql[i]!;
      i++;
      if (i < sql.length && "=><".includes(sql[i]!)) {
        op += sql[i];
        i++;
      }
      tokens.push(op);
      continue;
    }

    // Words and numbers
    let word = "";
    while (i < sql.length && !/[\s(),;.*<>=!']/.test(sql[i]!)) {
      word += sql[i];
      i++;
    }
    if (word) tokens.push(word);
  }

  return tokens;
}

/**
 * Simple recursive descent parser for SQL.
 */
class SQLParser {
  private tokens: string[];
  private pos: number;

  constructor(tokens: string[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): string | undefined {
    return this.tokens[this.pos];
  }

  private advance(): string {
    const token = this.tokens[this.pos]!;
    this.pos++;
    return token;
  }

  private expect(expected: string): string {
    const token = this.peek();
    if (token?.toUpperCase() !== expected.toUpperCase()) {
      throw new Error(`Expected '${expected}' but got '${token ?? "EOF"}'`);
    }
    return this.advance();
  }

  private match(expected: string): boolean {
    if (this.peek()?.toUpperCase() === expected.toUpperCase()) {
      this.advance();
      return true;
    }
    return false;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  private peekUpper(): string {
    return (this.peek() ?? "").toUpperCase();
  }

  parseStatements(): ASTNode[] {
    const statements: ASTNode[] = [];
    while (!this.isAtEnd()) {
      if (this.peek() === ";") {
        this.advance();
        continue;
      }
      statements.push(this.parseStatement());
      if (this.peek() === ";") {
        this.advance();
      }
    }
    return statements;
  }

  parseStatement(): ASTNode {
    const keyword = this.peekUpper();
    switch (keyword) {
      case "SELECT":
        return this.parseSelect() as unknown as ASTNode;
      case "INSERT":
        return this.parseInsert() as unknown as ASTNode;
      case "UPDATE":
        return this.parseUpdate() as unknown as ASTNode;
      case "DELETE":
        return this.parseDelete() as unknown as ASTNode;
      case "CREATE":
        return this.parseCreate();
      case "WITH":
        return this.parseWith();
      default:
        // Fallback: collect remaining tokens as raw
        return this.parseRaw();
    }
  }

  parseSelect(): SelectStatement {
    this.expect("SELECT");

    const stmt: SelectStatement = {
      type: "select",
      columns: [],
    };

    // DISTINCT
    if (this.match("DISTINCT")) {
      stmt.distinct = true;
    }

    // Columns
    stmt.columns = this.parseSelectColumns();

    // FROM
    if (this.peekUpper() === "FROM") {
      this.advance();
      stmt.from = this.parseFromClause();
    }

    // WHERE
    if (this.peekUpper() === "WHERE") {
      this.advance();
      stmt.where = this.parseExpression();
    }

    // GROUP BY
    if (this.peekUpper() === "GROUP") {
      this.advance();
      this.expect("BY");
      stmt.groupBy = this.parseExpressionList();
    }

    // HAVING
    if (this.peekUpper() === "HAVING") {
      this.advance();
      stmt.having = this.parseExpression();
    }

    // ORDER BY
    if (this.peekUpper() === "ORDER") {
      this.advance();
      this.expect("BY");
      stmt.orderBy = this.parseOrderByList();
    }

    // LIMIT
    if (this.peekUpper() === "LIMIT") {
      this.advance();
      stmt.limit = this.parseExpression();
    }

    // OFFSET
    if (this.peekUpper() === "OFFSET") {
      this.advance();
      stmt.offset = this.parseExpression();
    }

    return stmt;
  }

  parseSelectColumns(): ASTNode[] {
    const columns: ASTNode[] = [];

    if (this.peek() === "*") {
      this.advance();
      columns.push({ type: "wildcard", value: "*" });
      return columns;
    }

    columns.push(this.parseSelectColumn());
    while (this.peek() === ",") {
      this.advance();
      columns.push(this.parseSelectColumn());
    }

    return columns;
  }

  parseSelectColumn(): ASTNode {
    const expr = this.parseExpression();

    // Check for alias
    if (this.peekUpper() === "AS") {
      this.advance();
      const alias = this.advance();
      return { ...expr, alias };
    }

    // Implicit alias (word not a keyword)
    const clauseKeywords = new Set([
      "FROM",
      "WHERE",
      "GROUP",
      "HAVING",
      "ORDER",
      "LIMIT",
      "OFFSET",
      "UNION",
      "INTERSECT",
      "EXCEPT",
      "JOIN",
      "ON",
      "LEFT",
      "RIGHT",
      "INNER",
      "OUTER",
      "CROSS",
      "FULL",
    ]);

    if (
      this.peek() &&
      !clauseKeywords.has(this.peekUpper()) &&
      this.peek() !== "," &&
      this.peek() !== ")" &&
      this.peek() !== ";"
    ) {
      const potentialAlias = this.peek()!;
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(potentialAlias)) {
        this.advance();
        return { ...expr, alias: potentialAlias };
      }
    }

    return expr;
  }

  parseFromClause(): ASTNode[] {
    const tables: ASTNode[] = [];
    tables.push(this.parseTableRef());

    while (this.peek() === ",") {
      this.advance();
      tables.push(this.parseTableRef());
    }

    // JOINs
    while (this.isJoinKeyword()) {
      tables.push(this.parseJoin());
    }

    return tables;
  }

  isJoinKeyword(): boolean {
    const upper = this.peekUpper();
    return ["JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS"].includes(upper);
  }

  parseJoin(): ASTNode {
    let joinType = "";

    if (
      ["LEFT", "RIGHT", "FULL", "CROSS", "INNER"].includes(this.peekUpper())
    ) {
      joinType = this.advance().toUpperCase();
      if (this.peekUpper() === "OUTER") {
        joinType += " OUTER";
        this.advance();
      }
    }

    this.expect("JOIN");
    joinType = joinType ? `${joinType} JOIN` : "JOIN";

    const table = this.parseTableRef();
    let on: ASTNode | undefined;

    if (this.peekUpper() === "ON") {
      this.advance();
      on = this.parseExpression();
    }

    return {
      type: "join",
      joinType,
      table,
      on,
    };
  }

  parseTableRef(): ASTNode {
    if (this.peek() === "(") {
      this.advance();
      const subquery = this.parseSelect();
      this.expect(")");
      let alias: string | undefined;
      if (this.peekUpper() === "AS") {
        this.advance();
        alias = this.advance();
      } else if (this.peek() && /^[a-zA-Z_]/.test(this.peek()!)) {
        const clauseKw = new Set([
          "WHERE",
          "GROUP",
          "ORDER",
          "HAVING",
          "LIMIT",
          "OFFSET",
          "JOIN",
          "LEFT",
          "RIGHT",
          "INNER",
          "OUTER",
          "CROSS",
          "FULL",
          "ON",
          "UNION",
          "INTERSECT",
          "EXCEPT",
        ]);
        if (!clauseKw.has(this.peekUpper())) {
          alias = this.advance();
        }
      }
      return { type: "subquery", query: subquery, alias };
    }

    const name = this.advance();
    let schema: string | undefined;
    let tableName = name;

    if (this.peek() === ".") {
      this.advance();
      schema = name;
      tableName = this.advance();
    }

    let alias: string | undefined;
    if (this.peekUpper() === "AS") {
      this.advance();
      alias = this.advance();
    } else if (this.peek() && /^[a-zA-Z_]/.test(this.peek()!)) {
      const reserved = new Set([
        "WHERE",
        "GROUP",
        "ORDER",
        "HAVING",
        "LIMIT",
        "OFFSET",
        "JOIN",
        "LEFT",
        "RIGHT",
        "INNER",
        "OUTER",
        "CROSS",
        "FULL",
        "ON",
        "UNION",
        "INTERSECT",
        "EXCEPT",
        "SET",
      ]);
      if (!reserved.has(this.peekUpper()) && this.peek() !== ",") {
        alias = this.advance();
      }
    }

    const result: ASTNode = { type: "table_ref", table: tableName };
    if (schema) (result as Record<string, unknown>).schema = schema;
    if (alias) (result as Record<string, unknown>).alias = alias;
    return result;
  }

  parseExpression(): ASTNode {
    return this.parseOr();
  }

  parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.peekUpper() === "OR") {
      this.advance();
      const right = this.parseAnd();
      left = { type: "binary_expr", operator: "OR", left, right };
    }
    return left;
  }

  parseAnd(): ASTNode {
    let left = this.parseComparison();
    while (this.peekUpper() === "AND") {
      this.advance();
      const right = this.parseComparison();
      left = { type: "binary_expr", operator: "AND", left, right };
    }
    return left;
  }

  parseComparison(): ASTNode {
    if (this.peekUpper() === "NOT") {
      this.advance();
      const expr = this.parseComparison();
      return { type: "unary_expr", operator: "NOT", operand: expr };
    }

    if (this.peekUpper() === "EXISTS") {
      this.advance();
      this.expect("(");
      const subquery = this.parseSelect();
      this.expect(")");
      return { type: "exists", query: subquery };
    }

    let left = this.parsePrimary();

    // Handle IS NULL, IS NOT NULL
    if (this.peekUpper() === "IS") {
      this.advance();
      const not = this.match("NOT");
      const value = this.advance();
      return {
        type: "binary_expr",
        operator: not ? "IS NOT" : "IS",
        left,
        right: {
          type: "literal",
          value: value.toUpperCase() === "NULL" ? null : value,
        },
      };
    }

    // Handle BETWEEN
    if (this.peekUpper() === "BETWEEN") {
      this.advance();
      const low = this.parsePrimary();
      this.expect("AND");
      const high = this.parsePrimary();
      return { type: "between", expr: left, low, high };
    }

    // Handle IN
    if (
      this.peekUpper() === "IN" ||
      (this.peekUpper() === "NOT" &&
        this.tokens[this.pos + 1]?.toUpperCase() === "IN")
    ) {
      const not = this.match("NOT");
      this.expect("IN");
      this.expect("(");
      const values: ASTNode[] = [];
      if (this.peekUpper() === "SELECT") {
        const subquery = this.parseSelect();
        this.expect(")");
        return {
          type: not ? "not_in_subquery" : "in_subquery",
          expr: left,
          query: subquery,
        };
      }
      values.push(this.parseExpression());
      while (this.peek() === ",") {
        this.advance();
        values.push(this.parseExpression());
      }
      this.expect(")");
      return {
        type: not ? "not_in" : "in",
        expr: left,
        values,
      };
    }

    // Handle LIKE
    if (this.peekUpper() === "LIKE" || this.peekUpper() === "ILIKE") {
      const op = this.advance().toUpperCase();
      const pattern = this.parsePrimary();
      return { type: "binary_expr", operator: op, left, right: pattern };
    }

    // Comparison operators
    const ops = ["=", "!=", "<>", "<", ">", "<=", ">="];
    if (this.peek() && ops.includes(this.peek()!)) {
      const op = this.advance();
      const right = this.parsePrimary();
      left = { type: "binary_expr", operator: op, left, right };
    }

    // Arithmetic operators
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.advance();
      const right = this.parsePrimary();
      left = { type: "binary_expr", operator: op, left, right };
    }

    return left;
  }

  parsePrimary(): ASTNode {
    const token = this.peek();

    if (!token) {
      throw new Error("Unexpected end of input");
    }

    // Parenthesized expression or subquery
    if (token === "(") {
      this.advance();
      if (this.peekUpper() === "SELECT") {
        const subquery = this.parseSelect();
        this.expect(")");
        return { type: "subquery", query: subquery };
      }
      const expr = this.parseExpression();
      this.expect(")");
      return expr;
    }

    // NULL
    if (token.toUpperCase() === "NULL") {
      this.advance();
      return { type: "literal", value: null };
    }

    // Boolean
    if (token.toUpperCase() === "TRUE" || token.toUpperCase() === "FALSE") {
      this.advance();
      return { type: "literal", value: token.toUpperCase() === "TRUE" };
    }

    // String literal
    if (token.startsWith("'")) {
      this.advance();
      return { type: "literal", value: token.slice(1, -1) };
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      this.advance();
      return { type: "literal", value: Number(token) };
    }

    // Star
    if (token === "*") {
      this.advance();
      return { type: "wildcard", value: "*" };
    }

    // Identifier or function call
    const name = this.advance();

    // Check for table.column
    if (this.peek() === ".") {
      this.advance();
      const col = this.advance();
      if (col === "*") {
        return { type: "column_ref", table: name, column: "*" };
      }
      return { type: "column_ref", table: name, column: col };
    }

    // Function call
    if (this.peek() === "(") {
      this.advance();
      const args: ASTNode[] = [];

      if (this.peek() !== ")") {
        // Handle DISTINCT inside function (e.g., COUNT(DISTINCT col))
        let distinct = false;
        if (this.peekUpper() === "DISTINCT") {
          this.advance();
          distinct = true;
        }

        if (this.peek() === "*") {
          args.push({ type: "wildcard", value: "*" });
          this.advance();
        } else {
          args.push(this.parseExpression());
          while (this.peek() === ",") {
            this.advance();
            args.push(this.parseExpression());
          }
        }

        if (distinct) {
          return {
            type: "function_call",
            name: name.toUpperCase(),
            distinct: true,
            args,
          };
        }
      }

      this.expect(")");

      // Window function: OVER (...)
      if (this.peekUpper() === "OVER") {
        this.advance();
        this.expect("(");
        const windowSpec: Record<string, unknown> = {};
        if (this.peekUpper() === "PARTITION") {
          this.advance();
          this.expect("BY");
          windowSpec.partitionBy = this.parseExpressionList();
        }
        if (this.peekUpper() === "ORDER") {
          this.advance();
          this.expect("BY");
          windowSpec.orderBy = this.parseOrderByList();
        }
        this.expect(")");
        return {
          type: "window_function",
          name: name.toUpperCase(),
          args,
          over: windowSpec,
        };
      }

      return { type: "function_call", name: name.toUpperCase(), args };
    }

    // Plain column reference
    return { type: "column_ref", column: name };
  }

  parseExpressionList(): ASTNode[] {
    const list: ASTNode[] = [];
    list.push(this.parseExpression());
    while (this.peek() === ",") {
      this.advance();
      list.push(this.parseExpression());
    }
    return list;
  }

  parseOrderByList(): Array<{ expr: ASTNode; direction: string }> {
    const list: Array<{ expr: ASTNode; direction: string }> = [];

    const expr = this.parseExpression();
    let direction = "ASC";
    if (this.peekUpper() === "ASC" || this.peekUpper() === "DESC") {
      direction = this.advance().toUpperCase();
    }
    list.push({ expr, direction });

    while (this.peek() === ",") {
      this.advance();
      const e = this.parseExpression();
      let d = "ASC";
      if (this.peekUpper() === "ASC" || this.peekUpper() === "DESC") {
        d = this.advance().toUpperCase();
      }
      list.push({ expr: e, direction: d });
    }

    return list;
  }

  parseInsert(): InsertStatement {
    this.expect("INSERT");
    this.expect("INTO");

    const table = this.advance();
    const stmt: InsertStatement = { type: "insert", table };

    // Optional column list
    if (this.peek() === "(") {
      this.advance();
      const columns: string[] = [];
      columns.push(this.advance());
      while (this.peek() === ",") {
        this.advance();
        columns.push(this.advance());
      }
      this.expect(")");
      stmt.columns = columns;
    }

    // VALUES or SELECT
    if (this.peekUpper() === "VALUES") {
      this.advance();
      const values: ASTNode[][] = [];
      do {
        if (this.peek() === ",") this.advance();
        this.expect("(");
        const row: ASTNode[] = [];
        row.push(this.parseExpression());
        while (this.peek() === ",") {
          this.advance();
          row.push(this.parseExpression());
        }
        this.expect(")");
        values.push(row);
      } while (this.peek() === ",");
      stmt.values = values;
    } else if (this.peekUpper() === "SELECT") {
      stmt.select = this.parseSelect();
    }

    return stmt;
  }

  parseUpdate(): UpdateStatement {
    this.expect("UPDATE");
    const table = this.advance();
    this.expect("SET");

    const set: Array<{ column: string; value: ASTNode }> = [];
    const parseAssignment = (): void => {
      const column = this.advance();
      this.expect("=");
      const value = this.parseExpression();
      set.push({ column, value });
    };

    parseAssignment();
    while (this.peek() === ",") {
      this.advance();
      parseAssignment();
    }

    const stmt: UpdateStatement = { type: "update", table, set };

    if (this.peekUpper() === "WHERE") {
      this.advance();
      stmt.where = this.parseExpression();
    }

    return stmt;
  }

  parseDelete(): DeleteStatement {
    this.expect("DELETE");
    this.expect("FROM");
    const table = this.advance();

    const stmt: DeleteStatement = { type: "delete", table };

    if (this.peekUpper() === "WHERE") {
      this.advance();
      stmt.where = this.parseExpression();
    }

    return stmt;
  }

  parseCreate(): ASTNode {
    this.expect("CREATE");
    if (this.peekUpper() === "TABLE") {
      return this.parseCreateTable() as unknown as ASTNode;
    }
    // Fallback for other CREATE statements
    return this.parseRaw();
  }

  parseCreateTable(): CreateTableStatement {
    this.expect("TABLE");

    let ifNotExists = false;
    if (this.peekUpper() === "IF") {
      this.advance();
      this.expect("NOT");
      this.expect("EXISTS");
      ifNotExists = true;
    }

    const table = this.advance();
    this.expect("(");

    const columns: Array<{
      name: string;
      dataType: string;
      constraints: string[];
    }> = [];
    const constraints: Array<{
      type: string;
      columns: string[];
      references?: string;
    }> = [];

    while (this.peek() !== ")") {
      // Table-level constraints
      if (
        this.peekUpper() === "PRIMARY" ||
        this.peekUpper() === "UNIQUE" ||
        this.peekUpper() === "FOREIGN" ||
        this.peekUpper() === "CHECK" ||
        this.peekUpper() === "CONSTRAINT"
      ) {
        constraints.push(this.parseTableConstraint());
      } else {
        columns.push(this.parseColumnDef());
      }

      if (this.peek() === ",") {
        this.advance();
      }
    }
    this.expect(")");

    const result: CreateTableStatement = {
      type: "create_table",
      table,
      ifNotExists,
      columns,
    };
    if (constraints.length > 0) {
      result.constraints = constraints;
    }
    return result;
  }

  parseColumnDef(): { name: string; dataType: string; constraints: string[] } {
    const name = this.advance();

    // Data type
    let dataType = this.advance();
    // Handle parameterized types like VARCHAR(255), DECIMAL(10,2)
    if (this.peek() === "(") {
      this.advance();
      dataType += "(";
      dataType += this.advance();
      while (this.peek() === ",") {
        dataType += ", ";
        this.advance();
        dataType += this.advance();
      }
      this.expect(")");
      dataType += ")";
    }

    const colConstraints: string[] = [];

    // Column constraints
    while (
      this.peek() &&
      this.peek() !== "," &&
      this.peek() !== ")" &&
      !["PRIMARY", "UNIQUE", "FOREIGN", "CHECK", "CONSTRAINT"].includes(
        this.peekUpper()
      )
    ) {
      if (this.peekUpper() === "NOT") {
        this.advance();
        this.expect("NULL");
        colConstraints.push("NOT NULL");
      } else if (this.peekUpper() === "NULL") {
        this.advance();
        colConstraints.push("NULL");
      } else if (this.peekUpper() === "DEFAULT") {
        this.advance();
        const defaultVal = this.advance();
        colConstraints.push(`DEFAULT ${defaultVal}`);
      } else if (
        this.peekUpper() === "AUTO_INCREMENT" ||
        this.peekUpper() === "SERIAL" ||
        this.peekUpper() === "BIGSERIAL"
      ) {
        colConstraints.push(this.advance().toUpperCase());
      } else if (this.peekUpper() === "REFERENCES") {
        this.advance();
        let ref = this.advance();
        if (this.peek() === "(") {
          this.advance();
          ref += `(${this.advance()})`;
          this.expect(")");
        }
        colConstraints.push(`REFERENCES ${ref}`);
      } else {
        // Consume other keywords as constraints
        colConstraints.push(this.advance().toUpperCase());
      }
    }

    return {
      name,
      dataType: dataType.toUpperCase(),
      constraints: colConstraints,
    };
  }

  parseTableConstraint(): {
    type: string;
    columns: string[];
    references?: string;
  } {
    let constraintName: string | undefined;
    if (this.peekUpper() === "CONSTRAINT") {
      this.advance();
      constraintName = this.advance();
    }

    const constraintType = this.advance().toUpperCase();
    let type = constraintType;

    if (constraintType === "PRIMARY") {
      this.expect("KEY");
      type = "PRIMARY KEY";
    }

    this.expect("(");
    const columns: string[] = [];
    columns.push(this.advance());
    while (this.peek() === ",") {
      this.advance();
      columns.push(this.advance());
    }
    this.expect(")");

    const result: {
      type: string;
      columns: string[];
      references?: string;
      name?: string;
    } = { type, columns };
    if (constraintName) result.name = constraintName;

    if (this.peekUpper() === "REFERENCES") {
      this.advance();
      let ref = this.advance();
      if (this.peek() === "(") {
        this.advance();
        ref += `(${this.advance()})`;
        this.expect(")");
      }
      result.references = ref;
    }

    return result;
  }

  parseWith(): ASTNode {
    this.expect("WITH");
    const ctes: ASTNode[] = [];

    const parseCTE = (): { type: string; name: string; query: ASTNode } => {
      const name = this.advance();
      this.expect("AS");
      this.expect("(");
      const query = this.parseSelect();
      this.expect(")");
      return { type: "cte", name, query: query as unknown as ASTNode };
    };

    ctes.push(parseCTE());
    while (this.peek() === ",") {
      this.advance();
      ctes.push(parseCTE());
    }

    const mainQuery = this.parseStatement();

    return {
      type: "with",
      ctes,
      query: mainQuery,
    };
  }

  parseRaw(): ASTNode {
    const tokens: string[] = [];
    while (!this.isAtEnd() && this.peek() !== ";") {
      tokens.push(this.advance());
    }
    return { type: "raw", sql: tokens.join(" ") };
  }
}

/**
 * Parses SQL into AST JSON.
 */
function execute(input: Input, options?: Options): Output {
  const sql = input.input.trim();
  if (!sql) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "SQL input is empty",
    });
  }

  const pretty = options?.pretty ?? true;

  try {
    const tokens = tokenize(sql);
    const parser = new SQLParser(tokens);
    const statements = parser.parseStatements();

    const ast =
      statements.length === 1 ? statements[0] : { type: "program", statements };

    const output = pretty ? JSON.stringify(ast, null, 2) : JSON.stringify(ast);

    return {
      output,
      statementCount: statements.length,
    };
  } catch (err) {
    throw createToolError({
      code: EXEC_FAILED,
      message: `SQL parse error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

/**
 * SQL to JSON tool.
 * Parses SQL queries into AST JSON representation.
 */
export const sqlToJson = defineTool({
  meta: {
    id: "sql/to-json",
    name: "SQL to JSON",
    description:
      "Free online SQL to JSON converter — parse SQL queries into detailed AST JSON representation with column references, table refs, binary expressions, and clause structure instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "json", "ast", "parse", "tree"],
    examples: [
      {
        title: "Parse to AST",
        description:
          "Parse a SQL SELECT statement into a detailed AST JSON representation",
        input: "SELECT id, name FROM users WHERE active = true",
        output:
          '{\n  "type": "select",\n  "columns": [\n    {\n      "type": "column_ref",\n      "column": "id"\n    },\n    {\n      "type": "column_ref",\n      "column": "name"\n    }\n  ],\n  "from": [\n    {\n      "type": "table_ref",\n      "table": "users"\n    }\n  ],\n  "where": {\n    "type": "binary_expr",\n    "operator": "=",\n    "left": {\n      "type": "column_ref",\n      "column": "active"\n    },\n    "right": {\n      "type": "literal",\n      "value": true\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
