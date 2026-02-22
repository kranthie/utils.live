# CSV Tools

Tools for working with CSV (Comma-Separated Values) data, including formatting, validation, filtering, sorting, statistical analysis, and conversion to other formats.

## Available Tools

| Tool                 | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `csvFormatter`       | Format and normalize CSV with configurable delimiters |
| `csvValidator`       | Validate CSV structure and detect issues              |
| `csvToJson`          | Convert CSV to JSON format                            |
| `csvToYaml`          | Convert CSV to YAML format                            |
| `csvToXml`           | Convert CSV to XML format                             |
| `csvDiff`            | Compare two CSV files and show differences            |
| `csvMerge`           | Merge multiple CSV files                              |
| `csvFilter`          | Filter CSV rows based on column conditions            |
| `csvSort`            | Sort CSV data by one or more columns                  |
| `csvStats`           | Calculate statistics for CSV data                     |
| `csvViewer`          | Format CSV as a readable table                        |
| `jsonToCsvAlt`       | Convert JSON to CSV format (alternative)              |
| `csvToSql`           | Convert CSV to SQL INSERT statements                  |
| `csvColumnExtractor` | Extract specific columns from CSV                     |
| `csvDeduplicator`    | Remove duplicate rows from CSV                        |
| `csvToTsv`           | Convert CSV to TSV (tab-separated values)             |
| `csvToMarkdown`      | Convert CSV to Markdown table                         |

## Usage

```typescript
import { csvToJson, csvFilter, csvStats, csvToSql } from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Convert CSV to JSON
const json = executeTool(csvToJson, {
  input: `name,age,city
John,30,New York
Jane,25,Los Angeles`,
});
console.log(json.output);
// Output: [{"name":"John","age":30,"city":"New York"},{"name":"Jane","age":25,"city":"Los Angeles"}]

// Filter CSV rows
const filtered = executeTool(csvFilter, {
  input: `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`,
  filter: "age > 28",
});
console.log(filtered.output); // Filtered CSV
console.log(filtered.originalCount); // 3
console.log(filtered.filteredCount); // 2

// Calculate statistics
const stats = executeTool(csvStats, {
  input: `name,age,salary
John,30,50000
Jane,25,60000
Bob,35,55000`,
});
console.log(stats.rowCount); // 3
console.log(stats.columnCount); // 3
console.log(stats.columns); // Array with stats per column
// Each column includes: name, type, uniqueCount, nullCount, min, max, mean, median

// Convert to SQL statements
const sql = executeTool(
  csvToSql,
  {
    input: `name,age,email
John,30,john@example.com
Jane,25,jane@example.com`,
  },
  { tableName: "users", includeCreate: true }
);
console.log(sql.output);
// Output: CREATE TABLE users (...); INSERT INTO users ...
```

## Common Options

### Parsing Options

- `header` (boolean): First row is header (default: true)
- `delimiter` (string): Column delimiter (default: ",")

### Filter Expressions

The `csvFilter` tool supports simple expressions:

| Expression       | Example                                           |
| ---------------- | ------------------------------------------------- |
| Comparison       | `age > 30`, `price <= 100`                        |
| Equality         | `status == "active"`, `count != 0`                |
| String matching  | `name contains "John"`                            |
| Starts/Ends with | `email startsWith "admin"`, `url endsWith ".com"` |

### SQL Options

- `tableName` (string): Target table name (default: "data")
- `includeCreate` (boolean): Include CREATE TABLE statement (default: true)
- `batchSize` (number): INSERT batch size (default: 100)

### Statistics Output

The `csvStats` tool provides per-column analysis:

```typescript
{
  name: "age",
  type: "number",      // "number", "string", "boolean", or "mixed"
  uniqueCount: 10,
  nullCount: 2,
  minValue: 18,
  maxValue: 65,
  mean: 32.5,
  median: 30
}
```

## Related Categories

- [JSON Tools](../json/README.md) - Convert between CSV and JSON
- [XML Tools](../xml/README.md) - Convert between CSV and XML
- [YAML Tools](../yaml/README.md) - Convert between CSV and YAML
- [Markdown Tools](../markdown/README.md) - Convert CSV to Markdown tables
